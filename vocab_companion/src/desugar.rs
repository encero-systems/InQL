use incan_vocab::{
    DesugarError, DesugarOutput, IncanBinaryOp, IncanExpr, IncanScopedSurfacePayload,
    IncanStatement, IncanUnaryOp, VocabBodyItem, VocabClause, VocabClauseBody,
    VocabDeclaration, VocabDesugarer,
    VocabExpressionItem, VocabFieldSpec, VocabSyntaxNode,
};

use crate::{helper_exported, QUERY_FIELD_DESCRIPTOR, QUALITY_KW, QUERY_KW};

#[derive(Default)]
pub struct IncqlVocabDesugarer;

struct PendingJoin {
    source: IncanExpr,
    relation_name: String,
    method_name: &'static str,
}

impl VocabDesugarer for IncqlVocabDesugarer {
    fn desugar(&self, node: &VocabSyntaxNode) -> Result<DesugarOutput, DesugarError> {
        let declaration = match node {
            VocabSyntaxNode::Declaration(declaration)
                if matches!(declaration.keyword.as_str(), QUERY_KW | QUALITY_KW) =>
            {
                declaration
            }
            VocabSyntaxNode::Declaration(_) => {
                return Err(DesugarError::new(
                    "IncQL desugarer expected a `query:` or `quality:` declaration",
                ));
            }
            _ => {
                return Err(DesugarError::new(
                    "IncQL query desugarer expected a declaration node",
                ))
            }
        };
        match declaration.keyword.as_str() {
            QUERY_KW => Ok(DesugarOutput::Expression(lower_query(declaration)?)),
            QUALITY_KW => Ok(DesugarOutput::Expression(lower_quality(declaration)?)),
            _ => Err(DesugarError::new(
                "IncQL desugarer received an unsupported declaration keyword",
            )),
        }
    }
}

fn lower_quality(declaration: &VocabDeclaration) -> Result<IncanExpr, DesugarError> {
    if !declaration.head.header_args.is_empty() || declaration.head.name.is_some() {
        return Err(DesugarError::new(
            "quality blocks do not accept header arguments",
        ));
    }

    let mut assertions = Vec::new();
    for item in &declaration.body {
        match item {
            VocabBodyItem::Statement(IncanStatement::Expr(expr)) => {
                assertions.push(lower_quality_expr(expr)?);
            }
            VocabBodyItem::Statement(IncanStatement::Pass) => {}
            VocabBodyItem::Statement(_) => {
                return Err(DesugarError::new(
                    "quality blocks accept assertion expressions, not statements",
                ));
            }
            VocabBodyItem::Clause(clause) => {
                return Err(DesugarError::new(format!(
                    "quality blocks do not support `{}` clauses",
                    clause_spelling(clause),
                )));
            }
            VocabBodyItem::Declaration(_) => {
                return Err(DesugarError::new(
                    "quality blocks do not support nested declarations",
                ));
            }
            _ => {
                return Err(DesugarError::new(
                    "quality blocks do not support this body item",
                ));
            }
        }
    }
    Ok(IncanExpr::List(assertions))
}

fn lower_quality_expr(expr: &IncanExpr) -> Result<IncanExpr, DesugarError> {
    match expr {
        IncanExpr::ScopedSurface(surface) if surface.descriptor_key == QUERY_FIELD_DESCRIPTOR => {
            if let IncanScopedSurfacePayload::LeadingDotPath { segments, .. } = &surface.payload {
                return Ok(helper_call("col", vec![IncanExpr::Str(segments.join("."))]));
            }
            Err(DesugarError::new(
                "quality field shorthand expected a leading-dot path",
            ))
        }
        IncanExpr::CurrentField(field) => Ok(helper_call("col", vec![IncanExpr::Str(field.clone())])),
        IncanExpr::RelationField { relation, field } => Ok(helper_call(
            "col",
            vec![IncanExpr::Str(format!("{relation}.{field}"))],
        )),
        IncanExpr::List(items) => Ok(IncanExpr::List(
            items
                .iter()
                .map(lower_quality_expr)
                .collect::<Result<Vec<_>, _>>()?,
        )),
        IncanExpr::Tuple(items) => Ok(IncanExpr::Tuple(
            items
                .iter()
                .map(lower_quality_expr)
                .collect::<Result<Vec<_>, _>>()?,
        )),
        IncanExpr::Dict(items) => Ok(IncanExpr::Dict(
            items
                .iter()
                .map(|(key, value)| Ok((lower_quality_expr(key)?, lower_quality_expr(value)?)))
                .collect::<Result<Vec<_>, DesugarError>>()?,
        )),
        IncanExpr::Binary(left, op, right) => Ok(helper_call(
            binary_helper(*op)?,
            vec![lower_quality_expr(left)?, lower_quality_expr(right)?],
        )),
        IncanExpr::Unary(op, inner) => Ok(helper_call(unary_helper(*op)?, vec![lower_quality_expr(inner)?])),
        IncanExpr::Call { callee, args } => lower_quality_call(callee, args),
        IncanExpr::Field { object, field } => Ok(IncanExpr::Field {
            object: Box::new(lower_quality_expr(object)?),
            field: field.clone(),
        }),
        _ => Ok(expr.clone()),
    }
}

fn lower_quality_call(callee: &IncanExpr, args: &[IncanExpr]) -> Result<IncanExpr, DesugarError> {
    let lowered_args = args
        .iter()
        .map(lower_quality_expr)
        .collect::<Result<Vec<_>, _>>()?;
    match callee {
        IncanExpr::Name(name) => {
            let helper = helper_name(name);
            if helper_exported(helper) {
                return Ok(helper_call(helper, lowered_args));
            }
            Ok(IncanExpr::Call {
                callee: Box::new(callee.clone()),
                args: lowered_args,
            })
        }
        IncanExpr::Field { object, field } => Ok(IncanExpr::Call {
            callee: Box::new(IncanExpr::Field {
                object: Box::new(lower_quality_expr(object)?),
                field: field.clone(),
            }),
            args: lowered_args,
        }),
        _ => Ok(IncanExpr::Call {
            callee: Box::new(lower_quality_expr(callee)?),
            args: lowered_args,
        }),
    }
}

fn lower_query(declaration: &VocabDeclaration) -> Result<IncanExpr, DesugarError> {
    let from_clause = required_clause(declaration, "FROM")?;
    let mut current = required_expression(from_clause, "FROM")?.clone();
    let mut saw_select = false;
    let mut pending_join: Option<PendingJoin> = None;

    // Query clauses are lowered left-to-right into the same carrier method calls that authors can write manually.
    // `JOIN` is staged until the following `ON` clause so relation naming and predicate lowering stay together.
    for item in &declaration.body {
        let VocabBodyItem::Clause(clause) = item else {
            continue;
        };
        let spelling = clause_spelling(clause);
        match spelling.as_str() {
            "FROM" => {}
            "JOIN" | "LEFT JOIN" => {
                ensure_no_pending_join(&pending_join)?;
                let source = required_expression(clause, &spelling)?.clone();
                pending_join = Some(PendingJoin {
                    relation_name: join_relation_name(&source)?,
                    source,
                    method_name: if spelling == "LEFT JOIN" {
                        "left_join"
                    } else {
                        "join"
                    },
                });
            }
            "ON" => {
                let Some(join) = pending_join.take() else {
                    return Err(DesugarError::new(
                        "ON clauses require a preceding JOIN or LEFT JOIN clause",
                    ));
                };
                current = method_call(
                    current,
                    join.method_name,
                    vec![
                        join.source,
                        lower_column_expr(required_expression(clause, "ON")?)?,
                        IncanExpr::Str(join.relation_name),
                    ],
                );
            }
            "WHERE" => {
                ensure_no_pending_join(&pending_join)?;
                current = method_call(
                    current,
                    "filter",
                    vec![lower_column_expr(required_expression(clause, "WHERE")?)?],
                );
            }
            "GROUP BY" => {
                ensure_no_pending_join(&pending_join)?;
                current = method_call(
                    current,
                    "group_by",
                    vec![IncanExpr::List(lower_expression_list(clause)?)],
                );
            }
            "EXPLODE" => {
                ensure_no_pending_join(&pending_join)?;
                let generator = lower_explode_clause(clause)?;
                current = method_call(current, "generate", vec![generator]);
            }
            "WINDOW BY" => {
                ensure_no_pending_join(&pending_join)?;
                for field in field_set(clause)? {
                    let application = field.default_value.as_ref().ok_or_else(|| {
                        DesugarError::new("WINDOW BY entries require `name = window_call`")
                    })?;
                    current = method_call(
                        current,
                        "with_window_column",
                        vec![
                            IncanExpr::Str(field.name.clone()),
                            lower_column_expr(application)?,
                        ],
                    );
                }
            }
            "SELECT" => {
                ensure_no_pending_join(&pending_join)?;
                let (items, distinct) = select_items_and_distinct(clause, false)?;
                current = lower_select(current, &items, distinct)?;
                saw_select = true;
            }
            "SELECT DISTINCT" => {
                ensure_no_pending_join(&pending_join)?;
                let (items, distinct) = select_items_and_distinct(clause, true)?;
                current = lower_select(current, &items, distinct)?;
                saw_select = true;
            }
            "ORDER BY" => {
                ensure_no_pending_join(&pending_join)?;
                current = method_call(
                    current,
                    "order_by",
                    vec![IncanExpr::List(lower_expression_list(clause)?)],
                );
            }
            "LIMIT" => {
                ensure_no_pending_join(&pending_join)?;
                current = method_call(
                    current,
                    "limit",
                    vec![required_expression(clause, "LIMIT")?.clone()],
                );
            }
            _ => {}
        }
    }

    ensure_no_pending_join(&pending_join)?;
    if !saw_select {
        return Err(DesugarError::new(
            "query blocks require a SELECT or SELECT DISTINCT clause",
        ));
    }
    Ok(current)
}

fn ensure_no_pending_join(pending_join: &Option<PendingJoin>) -> Result<(), DesugarError> {
    if pending_join.is_some() {
        return Err(DesugarError::new(
            "JOIN clauses must be followed immediately by ON",
        ));
    }
    Ok(())
}

fn join_relation_name(expr: &IncanExpr) -> Result<String, DesugarError> {
    match expr {
        IncanExpr::Name(name) => Ok(name.clone()),
        _ => Err(DesugarError::new(
            "JOIN sources must be a named relation so relation.column references can be resolved",
        )),
    }
}

fn lower_explode_clause(clause: &VocabClause) -> Result<IncanExpr, DesugarError> {
    let items = expression_items(clause)?;
    if items.len() != 1 {
        return Err(DesugarError::new("EXPLODE requires exactly one expression"));
    }
    let Some(alias) = &items[0].alias else {
        return Err(DesugarError::new(
            "EXPLODE requires `as <alias>` for the generated column",
        ));
    };
    Ok(helper_call(
        "explode",
        vec![
            lower_column_expr(&items[0].expr)?,
            IncanExpr::Str(alias.clone()),
        ],
    ))
}

fn select_items_and_distinct(
    clause: &VocabClause,
    explicit_distinct: bool,
) -> Result<(Vec<VocabExpressionItem>, bool), DesugarError> {
    let mut items = expression_items(clause)?.to_vec();
    let distinct = explicit_distinct || strip_distinct_prefix(&mut items)?;
    Ok((items, distinct))
}

fn strip_distinct_prefix(items: &mut [VocabExpressionItem]) -> Result<bool, DesugarError> {
    let Some(first) = items.first_mut() else {
        return Ok(false);
    };
    match &mut first.expr {
        IncanExpr::ScopedSurface(surface) if surface.descriptor_key == QUERY_FIELD_DESCRIPTOR => {
            let IncanScopedSurfacePayload::LeadingDotPath { segments, .. } = &mut surface.payload
            else {
                return Ok(false);
            };
            return strip_distinct_segments(segments);
        }
        IncanExpr::CurrentField(field) | IncanExpr::Name(field) => {
            if let Some(stripped) = field.strip_prefix("DISTINCT.") {
                if stripped.is_empty() {
                    return Err(DesugarError::new(
                        "SELECT DISTINCT requires an expression after DISTINCT",
                    ));
                }
                *field = stripped.to_string();
                return Ok(true);
            }
        }
        IncanExpr::RelationField { relation, field } if relation == "DISTINCT" => {
            if field.is_empty() {
                return Err(DesugarError::new(
                    "SELECT DISTINCT requires an expression after DISTINCT",
                ));
            }
            first.expr = IncanExpr::CurrentField(field.clone());
            return Ok(true);
        }
        _ => {}
    }
    Ok(false)
}

fn strip_distinct_segments(segments: &mut Vec<String>) -> Result<bool, DesugarError> {
    let Some(first) = segments.first() else {
        return Ok(false);
    };
    if first == "DISTINCT" {
        segments.remove(0);
    } else if let Some(stripped) = first.strip_prefix("DISTINCT.") {
        segments[0] = stripped.to_string();
    } else {
        return Ok(false);
    }
    if segments.is_empty() || segments[0].is_empty() {
        return Err(DesugarError::new(
            "SELECT DISTINCT requires an expression after DISTINCT",
        ));
    }
    Ok(true)
}

fn lower_select(
    source: IncanExpr,
    items: &[VocabExpressionItem],
    distinct: bool,
) -> Result<IncanExpr, DesugarError> {
    if items.iter().any(item_is_aggregate) {
        let mut measures = Vec::new();
        let mut assignments = Vec::new();
        for item in items {
            if expr_is_aggregate(&item.expr) {
                let measure = lower_column_expr(&item.expr)?;
                let output_name = aggregate_item_output_name(item)?;
                measures.push(match &item.alias {
                    Some(alias) => {
                        helper_call("aggregate_as", vec![measure, IncanExpr::Str(alias.clone())])
                    }
                    None => measure,
                });
                assignments.push(helper_call(
                    "with_column_assignment",
                    vec![
                        IncanExpr::Str(output_name.clone()),
                        helper_call("col", vec![IncanExpr::Str(output_name)]),
                    ],
                ));
            } else {
                let output_name = select_item_output_name(item)?;
                assignments.push(helper_call(
                    "with_column_assignment",
                    vec![IncanExpr::Str(output_name), lower_column_expr(&item.expr)?],
                ));
            }
        }
        let mut current = method_call(source, "agg", vec![IncanExpr::List(measures)]);
        current = method_call(current, "select", vec![IncanExpr::List(assignments)]);
        if distinct {
            current = method_call(
                current,
                "group_by",
                vec![IncanExpr::List(select_output_columns(items)?)],
            );
        }
        return Ok(current);
    }

    let assignments = items
        .iter()
        .map(|item| {
            let output_name = select_item_output_name(item)?;
            let expr = lower_column_expr(&item.expr)?;
            Ok(helper_call(
                "with_column_assignment",
                vec![IncanExpr::Str(output_name), expr],
            ))
        })
        .collect::<Result<Vec<_>, DesugarError>>()?;
    let mut current = method_call(source, "select", vec![IncanExpr::List(assignments)]);
    if distinct {
        current = method_call(
            current,
            "group_by",
            vec![IncanExpr::List(select_output_columns(items)?)],
        );
    }
    Ok(current)
}

fn aggregate_item_output_name(item: &VocabExpressionItem) -> Result<String, DesugarError> {
    if let Some(alias) = &item.alias {
        return Ok(alias.clone());
    }
    match &item.expr {
        IncanExpr::Call { callee, args } => aggregate_call_output_name(callee, args),
        IncanExpr::ScopedSymbolCall(call) => {
            aggregate_default_output_name(&call.symbol, &call.args)
        }
        _ => Err(DesugarError::new(
            "aggregate SELECT expressions require `as <alias>`",
        )),
    }
}

fn aggregate_call_output_name(
    callee: &IncanExpr,
    args: &[IncanExpr],
) -> Result<String, DesugarError> {
    match callee {
        IncanExpr::Name(name) => aggregate_default_output_name(name, args),
        _ => Err(DesugarError::new(
            "aggregate SELECT expects a direct aggregate helper call",
        )),
    }
}

fn aggregate_default_output_name(name: &str, args: &[IncanExpr]) -> Result<String, DesugarError> {
    if !is_aggregate_name(name) {
        return Err(DesugarError::new(
            "aggregate SELECT expected an aggregate call",
        ));
    }
    if args.is_empty() {
        return Ok(name.to_string());
    }
    Ok(format!("{}_{}", name, scalar_default_output_name(&args[0])))
}

fn scalar_default_output_name(expr: &IncanExpr) -> String {
    match expr {
        IncanExpr::ScopedSurface(surface) if surface.descriptor_key == QUERY_FIELD_DESCRIPTOR => {
            if let IncanScopedSurfacePayload::LeadingDotPath { segments, .. } = &surface.payload {
                return segments.join(".");
            }
            "expr".to_string()
        }
        IncanExpr::CurrentField(field) | IncanExpr::Name(field) => field.clone(),
        IncanExpr::RelationField { relation, field } => format!("{relation}.{field}"),
        _ => "expr".to_string(),
    }
}

fn select_output_columns(items: &[VocabExpressionItem]) -> Result<Vec<IncanExpr>, DesugarError> {
    items
        .iter()
        .map(|item| {
            Ok(helper_call(
                "col",
                vec![IncanExpr::Str(select_item_output_name(item)?)],
            ))
        })
        .collect()
}

fn select_item_output_name(item: &VocabExpressionItem) -> Result<String, DesugarError> {
    if let Some(alias) = &item.alias {
        return Ok(alias.clone());
    }
    match &item.expr {
        IncanExpr::ScopedSurface(surface) if surface.descriptor_key == QUERY_FIELD_DESCRIPTOR => {
            if let IncanScopedSurfacePayload::LeadingDotPath { segments, .. } = &surface.payload {
                return Ok(segments.join("."));
            }
            Err(DesugarError::new(
                "query field shorthand expected a leading-dot path",
            ))
        }
        IncanExpr::CurrentField(field) | IncanExpr::Name(field) => Ok(field.clone()),
        IncanExpr::RelationField { relation, field } => Ok(format!("{relation}.{field}")),
        _ => Err(DesugarError::new(
            "computed SELECT expressions require `as <alias>`",
        )),
    }
}

fn lower_expression_list(clause: &VocabClause) -> Result<Vec<IncanExpr>, DesugarError> {
    match &clause.body {
        VocabClauseBody::ExpressionList(expressions) => expressions
            .iter()
            .map(|item| lower_column_expr(&item.expr))
            .collect(),
        VocabClauseBody::Expression(expr) => Ok(vec![lower_column_expr(expr)?]),
        _ => Err(DesugarError::new(format!(
            "{} requires an expression list",
            clause_spelling(clause)
        ))),
    }
}

fn lower_column_expr(expr: &IncanExpr) -> Result<IncanExpr, DesugarError> {
    // The vocab AST distinguishes query-only field shorthands from ordinary Incan expressions. Normalize every
    // supported query expression into the public IncQL helper surface before the compiler typechecks the generated call.
    match expr {
        IncanExpr::ScopedSurface(surface) if surface.descriptor_key == QUERY_FIELD_DESCRIPTOR => {
            if let IncanScopedSurfacePayload::LeadingDotPath { segments, .. } = &surface.payload {
                return Ok(helper_call("col", vec![IncanExpr::Str(segments.join("."))]));
            }
            Err(DesugarError::new(
                "query field shorthand expected a leading-dot path",
            ))
        }
        IncanExpr::CurrentField(field) => {
            Ok(helper_call("col", vec![IncanExpr::Str(field.clone())]))
        }
        IncanExpr::RelationField { relation, field } => Ok(helper_call(
            "col",
            vec![IncanExpr::Str(format!("{relation}.{field}"))],
        )),
        IncanExpr::Str(_) | IncanExpr::Int(_) | IncanExpr::Bool(_) => {
            Ok(helper_call("lit", vec![expr.clone()]))
        }
        IncanExpr::Binary(left, op, right) => Ok(helper_call(
            binary_helper(*op)?,
            vec![lower_value_expr(left)?, lower_value_expr(right)?],
        )),
        IncanExpr::Unary(op, inner) => Ok(helper_call(
            unary_helper(*op)?,
            vec![lower_value_expr(inner)?],
        )),
        IncanExpr::Call { callee, args } => lower_call(callee, args),
        IncanExpr::ScopedSymbolCall(call) => Ok(helper_call(
            call.symbol.as_str(),
            call.args
                .iter()
                .map(lower_value_expr)
                .collect::<Result<Vec<_>, DesugarError>>()?,
        )),
        IncanExpr::Name(name) => Ok(helper_call("col", vec![IncanExpr::Str(name.clone())])),
        IncanExpr::Field { object, field } => Ok(IncanExpr::Field {
            object: Box::new(lower_column_expr(object)?),
            field: field.clone(),
        }),
        IncanExpr::List(items) => Ok(IncanExpr::List(
            items
                .iter()
                .map(lower_column_expr)
                .collect::<Result<Vec<_>, _>>()?,
        )),
        _ => Err(DesugarError::new(
            "query blocks do not support this expression form",
        )),
    }
}

fn lower_value_expr(expr: &IncanExpr) -> Result<IncanExpr, DesugarError> {
    match expr {
        IncanExpr::Str(_) | IncanExpr::Int(_) | IncanExpr::Bool(_) => Ok(expr.clone()),
        _ => lower_column_expr(expr),
    }
}

fn lower_call(callee: &IncanExpr, args: &[IncanExpr]) -> Result<IncanExpr, DesugarError> {
    match callee {
        IncanExpr::Name(name) => Ok(helper_call(
            helper_name(name),
            args.iter()
                .map(lower_value_expr)
                .collect::<Result<Vec<_>, _>>()?,
        )),
        IncanExpr::Field { object, field } => Ok(IncanExpr::Call {
            callee: Box::new(IncanExpr::Field {
                object: Box::new(lower_column_expr(object)?),
                field: field.clone(),
            }),
            args: args
                .iter()
                .map(lower_value_expr)
                .collect::<Result<Vec<_>, _>>()?,
        }),
        _ => Err(DesugarError::new(
            "query calls require a direct helper or method callee",
        )),
    }
}

fn helper_name(name: &str) -> &str {
    match name {
        "mod" => "modulo",
        other => other,
    }
}

fn binary_helper(op: IncanBinaryOp) -> Result<&'static str, DesugarError> {
    match op {
        IncanBinaryOp::Add => Ok("add"),
        IncanBinaryOp::Sub => Ok("sub"),
        IncanBinaryOp::Mul => Ok("mul"),
        IncanBinaryOp::Div => Ok("div"),
        IncanBinaryOp::Mod => Ok("modulo"),
        IncanBinaryOp::Eq => Ok("eq"),
        IncanBinaryOp::NotEq => Ok("ne"),
        IncanBinaryOp::Lt => Ok("lt"),
        IncanBinaryOp::LtEq => Ok("lte"),
        IncanBinaryOp::Gt => Ok("gt"),
        IncanBinaryOp::GtEq => Ok("gte"),
        IncanBinaryOp::And => Ok("and_"),
        IncanBinaryOp::Or => Ok("or_"),
        _ => Err(DesugarError::new(
            "query blocks do not support this binary operator",
        )),
    }
}

fn unary_helper(op: IncanUnaryOp) -> Result<&'static str, DesugarError> {
    match op {
        IncanUnaryOp::Not => Ok("not_"),
        IncanUnaryOp::Neg => Ok("neg"),
        _ => Err(DesugarError::new(
            "query blocks do not support this unary operator",
        )),
    }
}

fn method_call(receiver: IncanExpr, method: &str, args: Vec<IncanExpr>) -> IncanExpr {
    IncanExpr::Call {
        callee: Box::new(IncanExpr::Field {
            object: Box::new(receiver),
            field: method.to_string(),
        }),
        args,
    }
}

fn helper_call(name: &str, args: Vec<IncanExpr>) -> IncanExpr {
    IncanExpr::Call {
        callee: Box::new(IncanExpr::Helper(name.to_string())),
        args,
    }
}

fn required_clause<'a>(
    declaration: &'a VocabDeclaration,
    spelling: &str,
) -> Result<&'a VocabClause, DesugarError> {
    declaration
        .body
        .iter()
        .find_map(|item| match item {
            VocabBodyItem::Clause(clause) if clause_spelling(clause) == spelling => Some(clause),
            _ => None,
        })
        .ok_or_else(|| DesugarError::new(format!("query blocks require a {spelling} clause")))
}

fn required_expression<'a>(
    clause: &'a VocabClause,
    spelling: &str,
) -> Result<&'a IncanExpr, DesugarError> {
    match &clause.body {
        VocabClauseBody::Expression(expr) => Ok(expr),
        _ => Err(DesugarError::new(format!(
            "{spelling} requires one expression"
        ))),
    }
}

fn field_set(clause: &VocabClause) -> Result<&[VocabFieldSpec], DesugarError> {
    match &clause.body {
        VocabClauseBody::FieldSet(fields) => Ok(fields),
        _ => Err(DesugarError::new(format!(
            "{} requires a field body",
            clause_spelling(clause)
        ))),
    }
}

fn expression_items(clause: &VocabClause) -> Result<&[VocabExpressionItem], DesugarError> {
    match &clause.body {
        VocabClauseBody::ExpressionList(items) => Ok(items),
        _ => Err(DesugarError::new(format!(
            "{} requires an expression list",
            clause_spelling(clause)
        ))),
    }
}

fn clause_spelling(clause: &VocabClause) -> String {
    if clause.compound_tokens.is_empty() {
        return clause.keyword.clone();
    }
    format!("{} {}", clause.keyword, clause.compound_tokens.join(" "))
}

fn item_is_aggregate(item: &VocabExpressionItem) -> bool {
    expr_is_aggregate(&item.expr)
}

fn expr_is_aggregate(expr: &IncanExpr) -> bool {
    match expr {
        IncanExpr::Call { callee, .. } => {
            matches!(callee.as_ref(), IncanExpr::Name(name) if is_aggregate_name(name))
        }
        IncanExpr::ScopedSymbolCall(call) => is_aggregate_name(&call.symbol),
        _ => false,
    }
}

fn is_aggregate_name(name: &str) -> bool {
    matches!(
        name,
        "sum" | "count" | "count_distinct" | "avg" | "min" | "max"
    )
}

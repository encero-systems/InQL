//! InQL query-block vocabulary companion.
//!
//! The Incan compiler owns the generic vocabulary contract. InQL owns this package-specific `query:` surface and
//! lowers it into ordinary InQL helper/method calls that continue through Prism, Substrait, and the active backend.

mod desugar;

use incan_vocab::{
    ClauseSurface, DeclarationSurface, DslSurface, HelperBinding, LibraryManifest,
    ScopedSurfaceDescriptor, ScopedSurfaceDiagnosticKind, ScopedSurfaceDiagnosticTemplate,
    ScopedSurfaceEligibility, ScopedSurfaceMisuseScope, ScopedSurfaceReceiver, VocabRegistration,
};

pub use desugar::InqlQueryDesugarer;

pub const NAMESPACE: &str = "inql";
pub const QUERY_KW: &str = "query";
pub const QUERY_FIELD_DESCRIPTOR: &str = "inql.query.field";

// Incan's current vocab manifest API requires query desugarers to name helper bindings explicitly. Keep this list as
// the query-expression helper surface, and keep the tests below in lock-step with `src/lib.incn` public function exports
// so query blocks do not silently drift away from ordinary `pub::inql` helper calls.
const QUERY_BLOCK_HELPER_EXPORTS: &[&str] = &[
    "col",
    "lit",
    "always_false",
    "always_true",
    "bool_expr",
    "bool_lit",
    "float_expr",
    "int_expr",
    "int_lit",
    "str_expr",
    "str_lit",
    "count",
    "count_expr",
    "count_distinct",
    "count_if",
    "sum",
    "avg",
    "min",
    "max",
    "approx_count_distinct",
    "approx_percentile",
    "hll_deserialize",
    "hll_estimate",
    "hll_merge",
    "hll_serialize",
    "hll_sketch",
    "is_array",
    "is_boolean",
    "is_float",
    "is_integer",
    "is_null_value",
    "is_object",
    "is_string",
    "is_timestamp",
    "parse_variant_json",
    "try_parse_variant_json",
    "typeof",
    "variant_get",
    "abs",
    "acos",
    "asin",
    "atan",
    "atan2",
    "ceil",
    "cos",
    "degrees",
    "exp",
    "floor",
    "greatest",
    "least",
    "ln",
    "log",
    "log10",
    "power",
    "radians",
    "round",
    "sign",
    "sin",
    "sqrt",
    "tan",
    "char_length",
    "concat",
    "concat_ws",
    "lcase",
    "left",
    "lower",
    "lpad",
    "ltrim",
    "octet_length",
    "overlay",
    "position",
    "repeat",
    "replace",
    "right",
    "rpad",
    "rtrim",
    "split_part",
    "substr",
    "substring",
    "translate",
    "trim",
    "ucase",
    "upper",
    "base64",
    "decode",
    "encode",
    "hex",
    "unbase64",
    "unhex",
    "regexp_extract",
    "regexp_like",
    "regexp_replace",
    "current_date",
    "current_time",
    "current_timestamp",
    "date_add",
    "date_diff",
    "date_part",
    "date_sub",
    "date_trunc",
    "dateadd",
    "datediff",
    "extract",
    "from_unixtime",
    "last_day",
    "make_date",
    "make_time",
    "make_timestamp",
    "time_trunc",
    "timestamp_diff",
    "to_date",
    "to_time",
    "to_timestamp",
    "unix_micros",
    "unix_millis",
    "unix_seconds",
    "array",
    "array_contains",
    "array_distinct",
    "array_except",
    "array_flatten",
    "array_intersect",
    "array_join",
    "array_position",
    "array_range",
    "array_reverse",
    "array_slice",
    "array_sort",
    "array_union",
    "arrays_overlap",
    "cardinality",
    "element_at",
    "map_contains_key",
    "map_entries",
    "map_extract",
    "map_from_arrays",
    "map_keys",
    "map_values",
    "named_struct",
    "explode",
    "explode_outer",
    "flatten",
    "inline",
    "inline_outer",
    "posexplode",
    "posexplode_outer",
    "stack",
    "window",
    "row_number",
    "rank",
    "dense_rank",
    "percent_rank",
    "cume_dist",
    "ntile",
    "lag",
    "lead",
    "first_value",
    "last_value",
    "nth_value",
    "current_row",
    "following",
    "preceding",
    "unbounded_following",
    "unbounded_preceding",
    "md5",
    "crc32",
    "sha1",
    "sha2",
    "sha224",
    "sha256",
    "sha384",
    "sha512",
    "xxhash64",
    "parse_url",
    "try_url_decode",
    "url_decode",
    "url_encode",
    "check_json",
    "from_json",
    "get_json_object",
    "json_array_length",
    "json_extract_path_text",
    "json_object_keys",
    "parse_json",
    "schema_of_json",
    "to_json",
    "try_from_json",
    "from_csv",
    "schema_of_csv",
    "to_csv",
    "add",
    "sub",
    "mul",
    "div",
    "modulo",
    "eq",
    "ne",
    "lt",
    "lte",
    "gt",
    "gte",
    "and_",
    "or_",
    "not_",
    "neg",
    "equal_null",
    "cast",
    "try_cast",
    "safe_cast",
    "between",
    "in_",
    "is_nan",
    "is_not_nan",
    "is_not_null",
    "is_null",
    "case_when",
    "coalesce",
    "nullif",
    "asc",
    "asc_nulls_first",
    "asc_nulls_last",
    "desc",
    "desc_nulls_first",
    "desc_nulls_last",
    "aggregate_as",
    "with_column_assignment",
];

#[must_use]
pub fn library_vocab() -> VocabRegistration {
    VocabRegistration::new()
        .with_surface(
            DslSurface::on_import(NAMESPACE)
                .with_declaration(
                    DeclarationSurface::named(QUERY_KW)
                        .with_clause_body()
                        .desugars_to_expression()
                        .with_clauses([
                            ClauseSurface::expr("FROM").required(),
                            ClauseSurface::expr("JOIN").repeating().after("FROM"),
                            ClauseSurface::expr("LEFT JOIN").repeating().after("FROM"),
                            ClauseSurface::expr("ON").repeating().after("JOIN"),
                            ClauseSurface::expr("WHERE").repeating().after("FROM"),
                            ClauseSurface::expr_list("GROUP BY")
                                .optional()
                                .after("WHERE"),
                            ClauseSurface::expr_list("EXPLODE")
                                .repeating()
                                .after("FROM"),
                            ClauseSurface::fields("WINDOW BY")
                                .optional()
                                .after("GROUP BY"),
                            ClauseSurface::expr_list("SELECT").optional().after("FROM"),
                            ClauseSurface::expr_list("SELECT DISTINCT")
                                .optional()
                                .after("FROM"),
                            ClauseSurface::expr_list("ORDER BY")
                                .optional()
                                .after("SELECT"),
                            ClauseSurface::expr("LIMIT").optional().after("ORDER BY"),
                        ]),
                )
                .with_scoped_surface(
                    ScopedSurfaceDescriptor::leading_dot_path(QUERY_FIELD_DESCRIPTOR)
                        .with_eligibilities([
                            ScopedSurfaceEligibility::clause_body(QUERY_KW, "WHERE"),
                            ScopedSurfaceEligibility::clause_body(QUERY_KW, "GROUP"),
                            ScopedSurfaceEligibility::clause_body(QUERY_KW, "SELECT"),
                            ScopedSurfaceEligibility::clause_body(QUERY_KW, "ORDER"),
                            ScopedSurfaceEligibility::clause_body(QUERY_KW, "EXPLODE"),
                            ScopedSurfaceEligibility::clause_body(QUERY_KW, "WINDOW"),
                            ScopedSurfaceEligibility::clause_body(QUERY_KW, "ON"),
                        ])
                        .with_receiver(ScopedSurfaceReceiver::OwningDeclaration)
                        .with_misuse_scope(ScopedSurfaceMisuseScope::ActivatingFile)
                        .with_diagnostic(
                            ScopedSurfaceDiagnosticTemplate::new(
                                "inql-query-field-outside-scope",
                                ScopedSurfaceDiagnosticKind::OutsideScope,
                                "query field shorthand is only valid inside InQL query clauses",
                            )
                            .with_help(
                                "move the leading-dot field reference into a `query:` clause",
                            ),
                        ),
                ),
        )
        .with_library_manifest(LibraryManifest {
            helper_bindings: helper_bindings(),
            ..LibraryManifest::default()
        })
        .with_desugarer(InqlQueryDesugarer)
}

fn helper_bindings() -> Vec<HelperBinding> {
    QUERY_BLOCK_HELPER_EXPORTS
        .iter()
        .map(|name| HelperBinding {
            key: (*name).to_string(),
            exported_name: (*name).to_string(),
        })
        .collect()
}

incan_vocab::export_wasm_desugarer!(InqlQueryDesugarer);

#[cfg(test)]
mod tests {
    use std::collections::BTreeSet;

    use super::*;

    const PUBLIC_FACADE: &str = include_str!("../../src/lib.incn");
    const NON_QUERY_EXPRESSION_FUNCTION_EXPORTS: &[&str] = &[
        "display",
        "function_registry",
        "function_registry_canonical_names",
        "function_registry_entries",
        "function_registry_entry",
        "function_registry_entry_by_name",
        "function_registry_entry_count",
        "function_registry_function_refs",
        "registered_substrait_mapped_function_refs",
    ];

    #[test]
    fn helper_manifest_matches_declared_query_block_exports() {
        let registration = library_vocab();
        let manifest_bindings = &registration.metadata().library_manifest.helper_bindings;
        let manifest_keys: Vec<&str> = manifest_bindings
            .iter()
            .map(|binding| binding.key.as_str())
            .collect();

        assert_eq!(manifest_keys, QUERY_BLOCK_HELPER_EXPORTS);
        for binding in manifest_bindings {
            assert_eq!(binding.key, binding.exported_name);
        }
    }

    #[test]
    fn query_block_exports_cover_public_function_helpers() {
        let helper_names: BTreeSet<&str> = QUERY_BLOCK_HELPER_EXPORTS.iter().copied().collect();
        assert_eq!(helper_names.len(), QUERY_BLOCK_HELPER_EXPORTS.len());

        for exported_name in public_function_exports() {
            if NON_QUERY_EXPRESSION_FUNCTION_EXPORTS.contains(&exported_name.as_str()) {
                continue;
            }
            assert!(
                helper_names.contains(exported_name.as_str()),
                "`{exported_name}` is exported from `src/lib.incn` but is not available to query-block expressions",
            );
        }
    }

    fn public_function_exports() -> BTreeSet<String> {
        public_imports_with_prefix(PUBLIC_FACADE, "pub from functions.")
    }

    fn public_imports_with_prefix(source: &str, prefix: &str) -> BTreeSet<String> {
        let mut names = BTreeSet::new();
        let mut in_matching_import = false;
        for line in source.lines() {
            let trimmed = line.trim();
            if in_matching_import {
                if trimmed == ")" {
                    in_matching_import = false;
                } else {
                    add_import_symbols(trimmed, &mut names);
                }
                continue;
            }
            if !trimmed.starts_with(prefix) {
                continue;
            }
            let Some((_, imported)) = trimmed.split_once(" import ") else {
                continue;
            };
            if imported == "(" {
                in_matching_import = true;
            } else {
                add_import_symbols(imported, &mut names);
            }
        }
        names
    }

    fn add_import_symbols(segment: &str, names: &mut BTreeSet<String>) {
        for raw_name in segment.trim_end_matches(',').split(',') {
            let name = raw_name.trim();
            if !name.is_empty() {
                names.insert(name.to_string());
            }
        }
    }
}

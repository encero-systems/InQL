<section class="prism-hero" markdown="1">
<div class="prism-hero__copy" markdown="1">
<p class="prism-eyebrow">InQL documentation</p>

# Typed relational logic for governed data systems

InQL is a typed relational layer for authoring, inspecting, and executing data logic. Query blocks, dataset carriers, portable function calls, Prism plan inspection, and Substrait boundaries share one backend-neutral model.

<div class="prism-actions" markdown="1">
[Start with dataset transformations](language/how-to/dataset_transformations.md){ .prism-button .prism-button--primary }
[Read the query block reference](language/reference/query_blocks.md){ .prism-button }
</div>
</div>
<div class="prism-hero__visual" aria-label="InQL source code flowing into Prism plan, lineage, Substrait, and adapter evidence views.">
<div class="prism-flow__pane prism-flow__pane--source">
<span class="prism-flow__label">Incan source</span>
<div class="prism-flow__code">
<span>rollup = query {</span>
<span>  FROM orders</span>
<span>  WHERE .status == "paid"</span>
<span>  GROUP BY .region</span>
<span>  SELECT .region as region,</span>
<span>         sum(.amount) as total</span>
<span>}</span>
</div>
</div>
<div class="prism-flow__pane prism-flow__pane--plan">
<span class="prism-flow__label">Prism plan</span>
<div class="prism-flow__row"><span>relation</span><strong>AggregateRel</strong></div>
<div class="prism-flow__row"><span>schema</span><strong>region, total</strong></div>
<div class="prism-flow__row"><span>lineage</span><strong>orders.amount</strong></div>
</div>
<div class="prism-flow__pane prism-flow__pane--evidence">
<span class="prism-flow__label">Portable boundary</span>
<div class="prism-flow__row"><span>format</span><strong>Substrait</strong></div>
<div class="prism-flow__row"><span>adapter</span><strong>DataFusion</strong></div>
<div class="prism-flow__row"><span>quality</span><strong>observable</strong></div>
</div>
</div>
</section>

## Choose the right path

<div class="prism-card-grid" markdown="1">
<article class="prism-card" markdown="1">
<span class="prism-card__label">Write logic</span>

### Build typed transformations

Start with `DataSet[T]`, `LazyFrame[T]`, and query blocks when you want relational intent in source code instead of untyped SQL strings.

[Use dataset transformations](language/how-to/dataset_transformations.md)
</article>

<article class="prism-card" markdown="1">
<span class="prism-card__label">Understand plans</span>

### Inspect Prism and lineage

Use inspection docs when you need to see output schema, relation nodes, lineage edges, semantic targets, and evidence markers.

[Inspect plan lineage](language/how-to/inspect_plan_lineage.md)
</article>

<article class="prism-card" markdown="1">
<span class="prism-card__label">Execute deliberately</span>

### Keep sessions downstream

Execution context docs explain how reads, bindings, observations, adapter coverage, and backend execution stay below InQL semantics.

[Read execution context](language/reference/execution_context.md)
</article>

<article class="prism-card" markdown="1">
<span class="prism-card__label">Verify behavior</span>

### Track quality and governance

Quality and governed evidence docs show how InQL records assertions, observations, targets, and policy checkpoints without making a backend the semantic owner.

[Observe quality checks](language/how-to/quality_observations.md)
</article>
</div>

## A first useful loop

InQL is easiest to learn by following the shape of a real workflow: declare row models, build a typed relational plan, inspect the plan before execution, then run it through a session when you intentionally cross the backend boundary.

```incan
model Order:
    order_id: str
    region: str
    status: str
    amount: float

paid_rollup = query {
    FROM orders
    WHERE .status == "paid"
    GROUP BY .region
    SELECT
        .region as region,
        sum(.amount) as total_amount,
        count() as order_count
    ORDER BY desc(.total_amount)
}
```

That example is not trying to teach every surface at once. It shows the core promise: the query reads like relational logic, but it remains typed source that can flow through Prism inspection and Substrait lowering before any adapter executes it.

## What the docs cover

<div class="prism-track-list" markdown="1">
<div class="prism-track" markdown="1">
<strong>How-to guides</strong>

Task-oriented workflows for building transformations, normalizing semi-structured data, expanding rows, adding windows, observing execution, and inspecting lineage.

[Browse how-to guides](language/how-to/README.md)
</div>

<div class="prism-track" markdown="1">
<strong>Reference</strong>

Current API contracts for carriers, methods, query blocks, execution context, inspection, quality, governance, functions, builders, and Substrait boundaries.

[Open the reference](language/reference/dataset_carriers.md)
</div>

<div class="prism-track" markdown="1">
<strong>Architecture and RFCs</strong>

Design context for how InQL sits next to Incan, Prism, Substrait, sessions, backend adapters, quality evidence, and future extension points.

[Read the architecture](architecture.md)
</div>
</div>

!!! note "Where InQL stops"
    InQL owns typed data logic and portable logical intent. It does not own workflow orchestration, credential binding, physical planning, or backend-specific execution semantics; those belong downstream in sessions, adapters, runners, or adjacent Encero projects.

## Navigation shortcuts

| If you want to... | Start here |
| --- | --- |
| Learn the carrier model | [Dataset carriers explanation](language/explanation/dataset_carriers.md) |
| See the method surface | [Dataset methods reference](language/reference/dataset_methods.md) |
| Write SQL-familiar blocks | [Query blocks reference](language/reference/query_blocks.md) |
| Normalize JSON, CSV, and variants | [Normalize semi-structured fields](language/how-to/normalize_semistructured_fields.md) |
| Add windows or aggregates | [Window columns](language/how-to/window_columns.md) |
| Inspect plan structure and lineage | [Inspect plan lineage](language/how-to/inspect_plan_lineage.md) |
| Understand Substrait boundaries | [Read-root binding contract](language/reference/substrait/read_root_binding_contract.md) |
| Review the design record | [RFC index](rfcs/README.md) |

<section class="inql-hero" markdown="1">
<div class="inql-hero__copy" markdown="1">
<p class="inql-eyebrow">InQL documentation</p>

<h1 id="the-typed-data-logic-plane">The <span class="inql-gradient-text">typed</span> data logic plane</h1>

<p class="inql-hero__intro">InQL is a typed relational layer for authoring, inspecting, and executing data logic. Query blocks, dataset carriers, portable function calls, Prism plan inspection, and Substrait boundaries share one backend-neutral model.</p>

<div class="inql-actions">
<a class="inql-button inql-button--primary" href="language/how-to/dataset_transformations/">Start with dataset transformations</a>
<a class="inql-button" href="language/reference/query_blocks/">Read the query block reference</a>
</div>
</div>

<div class="inql-hero__visual" aria-label="A glass prism refracts typed data logic into floating planning stages.">
<img class="inql-hero__image" src="shared/prismplane/prismplane-hero.jpg" alt="">
</div>
</section>

<section class="inql-section inql-glass-panel" markdown="1">
## Choose the right path

<div class="inql-card-grid" markdown="1">
<article class="inql-glass-card inql-nav-card" markdown="1">
<span class="inql-card-icon" aria-hidden="true"></span>
<span class="inql-card-label">Write logic</span>

### Build typed transformations

Start with `DataSet[T]`, `LazyFrame[T]`, and query blocks when you want relational intent in source code instead of untyped SQL strings.

[Use dataset transformations](language/how-to/dataset_transformations.md)
</article>

<article class="inql-glass-card inql-nav-card" markdown="1">
<span class="inql-card-icon" aria-hidden="true"></span>
<span class="inql-card-label">Understand plans</span>

### Inspect Prism and lineage

Use inspection docs when you need to see output schema, relation nodes, lineage edges, semantic targets, and evidence markers.

[Inspect plan lineage](language/how-to/inspect_plan_lineage.md)
</article>

<article class="inql-glass-card inql-nav-card" markdown="1">
<span class="inql-card-icon" aria-hidden="true"></span>
<span class="inql-card-label">Execute deliberately</span>

### Keep sessions downstream

Execution context docs explain how reads, bindings, observations, adapter coverage, and backend execution stay below InQL semantics.

[Read execution context](language/reference/execution_context.md)
</article>

<article class="inql-glass-card inql-nav-card" markdown="1">
<span class="inql-card-icon" aria-hidden="true"></span>
<span class="inql-card-label">Verify behavior</span>

### Track quality and governance

Quality and governed evidence docs show how InQL records assertions, observations, targets, and policy checkpoints without making a backend the semantic owner.

[Observe quality checks](language/how-to/quality_observations.md)
</article>
</div>
</section>

<section class="inql-section inql-glass-panel inql-loop" markdown="1">
## A first useful loop

<div class="inql-loop__layout" markdown="1">
<div class="inql-loop__copy" markdown="1">
InQL is easiest to learn by following the shape of a real workflow: declare row models, build a typed relational plan, inspect the plan before execution, then run it through a session when you intentionally cross the backend boundary.
</div>

<div class="inql-loop__example" markdown="1">
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

<div class="inql-schema-flow" aria-label="Simplified Prism plan flow">
<span>Source</span>
<span>Filter</span>
<span>Aggregate</span>
<span>Project</span>
</div>
</div>
</div>

That example is not trying to teach every surface at once. It shows the core promise: the query reads like relational logic, but it remains typed source that can flow through Prism inspection and Substrait lowering before any adapter executes it.
</section>

<section class="inql-section inql-glass-panel" markdown="1">
## What the docs cover

<div class="inql-track-grid" markdown="1">
<div class="inql-glass-card inql-doc-card" markdown="1">
<strong>How-to guides</strong>

Task-oriented workflows for building transformations, normalizing semi-structured data, expanding rows, adding windows, observing execution, and inspecting lineage.

[Browse how-to guides](language/how-to/README.md)
</div>

<div class="inql-glass-card inql-doc-card" markdown="1">
<strong>Reference</strong>

Current API contracts for carriers, methods, query blocks, execution context, inspection, quality, governance, functions, builders, and Substrait boundaries.

[Open the reference](language/reference/dataset_carriers.md)
</div>

<div class="inql-glass-card inql-doc-card" markdown="1">
<strong>Architecture and RFCs</strong>

Design context for how InQL sits next to Incan, Prism, Substrait, sessions, backend adapters, quality evidence, and future extension points.

[Read the architecture](architecture.md)
</div>
</div>

<div class="inql-glass-callout" markdown="1">
<strong>Where InQL stops</strong>

InQL owns typed data logic and portable logical intent. It does not own workflow orchestration, credential binding, physical planning, or backend-specific execution semantics; those belong downstream in sessions, adapters, runners, or adjacent Encero projects.
</div>
</section>

<section class="inql-section inql-glass-panel" markdown="1">
## Navigation shortcuts

<div class="inql-shortcut-grid">
<div class="inql-compact-nav-card">
<span>If you want to...</span><span>Start here</span>
<a href="language/explanation/dataset_carriers/">Learn the carrier model</a>
<a href="language/explanation/dataset_carriers/">Dataset carriers explanation</a>
<a href="language/reference/dataset_methods/">See the method surface</a>
<a href="language/reference/dataset_methods/">Dataset methods reference</a>
<a href="language/reference/query_blocks/">Write SQL-familiar blocks</a>
<a href="language/reference/query_blocks/">Query blocks reference</a>
<a href="language/how-to/normalize_semistructured_fields/">Normalize JSON, CSV, and variants</a>
<a href="language/how-to/normalize_semistructured_fields/">Normalize semi-structured fields</a>
</div>

<div class="inql-compact-nav-card">
<span>If you want to...</span><span>Start here</span>
<a href="language/how-to/window_columns/">Add windows or aggregates</a>
<a href="language/how-to/window_columns/">Window columns</a>
<a href="language/how-to/inspect_plan_lineage/">Inspect plan structure and lineage</a>
<a href="language/how-to/inspect_plan_lineage/">Inspect plan lineage</a>
<a href="language/reference/substrait/read_root_binding_contract/">Understand Substrait boundaries</a>
<a href="language/reference/substrait/read_root_binding_contract/">Read-root binding contract</a>
<a href="rfcs/">Review the design record</a>
<a href="rfcs/">RFC index</a>
</div>
</div>
</section>

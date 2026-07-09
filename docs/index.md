<main class="inql-launch" markdown="1">
<section class="inql-launch-hero" markdown="1">
<div class="inql-launch-hero__copy" markdown="1">
<p class="inql-eyebrow">One semantic model. Multiple ways to think.</p>

<h1 id="write-once-run-anywhere-inspect-everything">Write data logic <span class="inql-gradient-text">once</span>.<br>Run it <span class="inql-gradient-text">anywhere</span>.<br>Inspect <span class="inql-gradient-text">everything</span>.</h1>

<p class="inql-launch-hero__intro">InQL keeps query blocks, DataFrame-style chains, LazyFrames, and execution evidence attached to one typed relational model. Prism makes that model visible before a backend runs.</p>

<p class="inql-hero-kicker">Different syntax. Exactly the same semantics.</p>

<div class="inql-actions">
<a class="inql-button inql-button--primary" href="language/how-to/dataset_transformations/">Start with dataset transformations</a>
<a class="inql-button" href="language/how-to/inspect_plan_lineage/">See Prism in action</a>
</div>
</div>

<div class="inql-launch-hero__visual" aria-label="Prism refracts data intent into typed planning stages and portable execution boundaries.">
<img class="inql-launch-hero__image" src="shared/prismplane/prismplane-hero.jpg" alt="">
<div class="inql-prism-story" aria-hidden="true">
<span>Intent</span>
<span>Semantic model</span>
<span>Prism</span>
<span>Portable plan</span>
<span>Execution</span>
</div>
</div>
</section>

<section class="inql-fracture-section" markdown="1">
<div class="inql-fracture-copy" markdown="1">
## Data logic is fragmented

The same business rule often gets rewritten across SQL, DataFrames, lazy plans, notebook glue, validation scripts, and backend-specific execution paths. The syntax changes, and too often the semantics change with it.
</div>

<div class="inql-fracture-map" aria-label="Many data authoring surfaces converge into InQL and Prism">
<div class="inql-source-cloud">
<span class="inql-source-chip">SQL</span>
<span class="inql-source-chip">DataFrames</span>
<span class="inql-source-chip">LazyFrames</span>
<span class="inql-source-chip">Pipelines</span>
<span class="inql-source-chip">Quality checks</span>
<span class="inql-source-chip">Backend adapters</span>
</div>
<div class="inql-convergence-line" aria-hidden="true"></div>
<div class="inql-unifier">
<span>InQL</span>
<strong>typed relational intent</strong>
</div>
<div class="inql-convergence-line inql-convergence-line--out" aria-hidden="true"></div>
<div class="inql-outcome-stack">
<span>Prism inspection</span>
<span>Substrait boundary</span>
<span>DataFusion / DuckDB / Spark</span>
</div>
</div>
</section>

<section class="inql-compiler-section" markdown="1">
<div class="inql-section-heading" markdown="1">
## The compiler becomes visible

InQL is not another string builder. Author intent becomes a typed semantic model, then a Prism plan, then a portable execution boundary.
</div>

<div class="inql-demo-panel" markdown="1">
<div class="inql-demo-code" markdown="1">
```incan
paid_rollup = query {
    FROM orders
    WHERE .status == "paid"
    GROUP BY .region
    SELECT
        .region as region,
        sum(.amount) as total_amount,
        count() as order_count
}
```
</div>

<div class="inql-visible-compiler-flow" aria-label="Query intent flows through InQL, Prism, Substrait, and backend execution">
<span class="inql-flow-node">Intent</span>
<span class="inql-flow-node">Semantic model</span>
<span class="inql-flow-node inql-flow-node--focus">Prism</span>
<span class="inql-flow-node">Portable plan</span>
<span class="inql-flow-node">Execution</span>
</div>

<div class="inql-engine-row" aria-label="Execution engines">
<span>DataFusion</span>
<span>DuckDB</span>
<span>Spark</span>
<span>Substrait consumers</span>
</div>
</div>
</section>

<section class="inql-same-semantics" markdown="1">
<div class="inql-section-heading inql-section-heading--center" markdown="1">
## Different syntax. Exactly the same semantics.

This is the moment InQL is built for: familiar authoring shapes collapsing into one inspectable plan.
</div>

<div class="inql-syntax-collapse" markdown="1">
<article class="inql-syntax-card" markdown="1">
<span>Query block</span>

```incan
query {
    FROM orders
    WHERE .status == "paid"
    GROUP BY .region
    SELECT
        .region as region,
        sum(.amount) as total_amount
}
```
</article>

<article class="inql-syntax-card" markdown="1">
<span>Carrier chain</span>

```incan
orders
    .filter(eq(col("status"), "paid"))
    .group_by([col("region")])
    .agg([sum(col("amount"))])
```
</article>

<article class="inql-syntax-card" markdown="1">
<span>Deferred session flow</span>

```incan
orders = session.read_csv(
    "orders",
    "orders.csv",
)?

paid = orders.filter(
    eq(col("status"), "paid"),
)
```
</article>

<div class="inql-collapse-target" markdown="1">
<strong>Same Prism plan</strong>
<div class="inql-stage-strip inql-stage-strip--large" aria-label="Same Prism plan">
<span>Source</span>
<span>Filter</span>
<span>Aggregate</span>
<span>Project</span>
</div>
</div>
</div>
</section>

<section class="inql-prism-moment" markdown="1">
<div class="inql-prism-moment__visual" markdown="1">
<img src="shared/prismplane/prismplane-hero.jpg" alt="">
<div class="inql-stage-strip" aria-label="Prism inspection stages">
<span>Schema</span>
<span>Lineage</span>
<span>Coverage</span>
<span>Quality</span>
</div>
</div>

<div class="inql-prism-moment__copy" markdown="1">
## Prism is the reason InQL becomes obvious

Prism shows the compiler’s relational model before execution. Source relations, predicates, projections, aggregates, windows, generators, lineage edges, quality observations, and adapter coverage become inspectable artifacts instead of backend side effects.

That visibility is what lets InQL support governance without becoming a single-engine framework.
</div>
</section>

<section class="inql-trust-section" markdown="1">
<div class="inql-trust-block" markdown="1">
## Built for trust

- Static typing and schema flow for confidence
- Prism inspection before backend execution
- Deterministic, backend-neutral semantics
- Reproducible observations and quality evidence
</div>

<div class="inql-trust-block" markdown="1">
## Engineered for developers

- Familiar if you know SQL or DataFrames
- Stronger when a workflow needs governance
- Extension-aware without giving up portability
- Designed for humans and AI agents to inspect
</div>
</section>

<section class="inql-learn-section" markdown="1">
<div markdown="1">
## Ready to experience InQL?

Start with a hands-on guide, inspect a plan, or jump straight into the API reference.
</div>

<div class="inql-actions">
<a class="inql-button inql-button--primary" href="language/how-to/dataset_transformations/">Get started</a>
<a class="inql-button" href="language/reference/query_blocks/">Query blocks</a>
<a class="inql-button" href="docs_map/">Explore the docs</a>
</div>
</section>
</main>

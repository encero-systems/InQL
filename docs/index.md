<main class="incql-launch" markdown="1">
<section class="incql-hero" markdown="1">
<div class="incql-hero__copy" markdown="1">
<p class="incql-eyebrow">One semantic model. Multiple ways to think.</p>

<h1 id="write-data-logic-once-run-it-anywhere-inspect-everything">Write data logic <span class="incql-gradient-text">once</span>.<br>Run it <span class="incql-gradient-text">anywhere</span>.<br>Inspect <span class="incql-gradient-text">everything</span>.</h1>

<p class="incql-hero__intro">IncQL unifies query blocks, DataFrame-style chains, LazyFrames, and pipelines into one typed relational model. Prism lets you see exactly what the compiler sees before execution.</p>

<div class="incql-actions">
<a class="incql-button incql-button--primary" href="language/how-to/dataset_transformations/">Start with transformations</a>
<a class="incql-button" href="language/how-to/inspect_plan_lineage/">See Prism in action</a>
</div>

<div class="incql-proof-row" aria-label="IncQL proof points">
<span><strong>Typed & safe</strong> Catch issues early with static typing</span>
<span><strong>Inspectable</strong> See the plan before execution</span>
<span><strong>Portable</strong> Compile to Substrait</span>
<span><strong>Governed</strong> Observe and verify behavior</span>
</div>
</div>

<div class="incql-hero__visual" aria-label="Prism refracts data logic into inspectable typed plan layers.">
<img src="shared/prismplane/prismplane-hero-light.png" alt="A glass prism refracting data logic into layered plan stages.">
</div>
</section>

<section class="incql-convergence-section" markdown="1">
<div class="incql-diagnosis" markdown="1">
## The problem with data logic today

Teams lose time to expression, semantics drift, and opaque pipelines that lock them to engines.

<div class="incql-friction-list">
<article>
<span>01</span>
<div>
<h3>Too many ways to express logic</h3>
<p>SQL, DataFrames, pipelines, and notebooks each carry their own shape.</p>
</div>
</article>

<article>
<span>02</span>
<div>
<h3>Different semantics and behaviors</h3>
<p>Small rewrites can change meaning before anyone sees the plan.</p>
</div>
</article>

<article>
<span>03</span>
<div>
<h3>Hard to inspect and debug</h3>
<p>You see results, but not the logic, lineage, or rechecking behavior.</p>
</div>
</article>

<article>
<span>04</span>
<div>
<h3>Tied to specific engines</h3>
<p>Porting usually means rewriting logic and revalidating behavior.</p>
</div>
</article>
</div>
</div>

<div class="incql-semantic-map" aria-label="Different authoring surfaces converging into IncQL's typed relational model and portable execution targets.">
<div class="incql-map-heading">
<h2>IncQL is the unifying layer</h2>
<p>Different surfaces. One compiler. Multiple execution targets.</p>
</div>

<div class="incql-map-body">
<div class="incql-map-sources" aria-label="Authoring surfaces">
<article>
<span>SQL</span>
<div><strong>SQL</strong><p>Query blocks</p></div>
</article>
<article>
<span>DF</span>
<div><strong>DataFrames</strong><p>Python, Rust, JS</p></div>
</article>
<article>
<span>Lazy</span>
<div><strong>LazyFrames</strong><p>Polars, Ibis, DataFusion</p></div>
</article>
<article>
<span>Pipe</span>
<div><strong>Pipelines</strong><p>Airflow, dbt, custom</p></div>
</article>
</div>

<div class="incql-map-core">
<img src="shared/brand/incql-mark.png" alt="">
<strong>IncQL</strong>
<p>Typed relational model</p>
<ul>
<li>Schema flow</li>
<li>Lineage</li>
<li>Optimizer choices</li>
<li>Type-checked</li>
</ul>
</div>

<div class="incql-map-bridge"><span>One semantic</span><span>model</span></div>

<div class="incql-map-targets" aria-label="Execution targets">
<article>
<span class="incql-target-icon"><img src="shared/icons/duck.svg" alt="" aria-hidden="true"></span>
<span class="incql-target-copy"><strong>DuckDB</strong><small>In-process</small></span>
</article>
<article>
<span class="incql-target-icon"><img src="shared/icons/database-cog-outline.svg" alt="" aria-hidden="true"></span>
<span class="incql-target-copy"><strong>DataFusion</strong><small>Rust</small></span>
</article>
<article>
<span class="incql-target-icon"><img src="shared/icons/flash-outline.svg" alt="" aria-hidden="true"></span>
<span class="incql-target-copy"><strong>Spark</strong><small>JVM</small></span>
</article>
<article>
<span class="incql-target-icon"><img src="shared/icons/vector-polyline.svg" alt="" aria-hidden="true"></span>
<span class="incql-target-copy"><strong>Substrait consumers</strong><small>Any engine</small></span>
</article>
</div>
</div>
</div>
</section>

<section class="incql-process" markdown="1">
<div class="incql-section-heading incql-process-heading" markdown="1">
## How <span class="incql-gradient-text">IncQL</span> works

Author in the surface that fits the task. IncQL keeps the semantics attached as the work moves from intent to execution.
</div>

<div class="incql-process-stage" aria-label="Five IncQL stages moving from authoring intent through Prism inspection to portable execution.">
<div class="incql-process-rail">
<article class="incql-step-card incql-step-card--author">
<header class="incql-step-card__title">
<span>01</span>
<h3>Author</h3>
</header>
<p>Write in the interface that matches your workflow and context.</p>
<ul class="incql-process-list">
<li>Query blocks</li>
<li>DataFrames</li>
<li>LazyFrames</li>
<li>Pipelines</li>
</ul>
</article>

<article class="incql-step-card incql-step-card--compile">
<header class="incql-step-card__title">
<span>02</span>
<h3>Compile</h3>
</header>
<p>Lower authoring intent into a typed relational model and Substrait plan.</p>
<div class="incql-mini-code" markdown="1">

```incan
model Order:
    id: int
    status: str
    region: str
```

</div>
<p class="incql-tag-row">Substrait</p>
</article>

<article class="incql-step-card incql-step-card--prism">
<header class="incql-step-card__title">
<span>03</span>
<h3>Prism</h3>
</header>
<p>IncQL's semantic core makes the compiler's decisions visible.</p>
<ul class="incql-process-list">
<li>Schema flow</li>
<li>Lineage</li>
<li>Projections</li>
<li>Filters</li>
<li>Optimizer choices</li>
</ul>
</article>

<article class="incql-step-card incql-step-card--optimize">
<header class="incql-step-card__title">
<span>04</span>
<h3>Optimize</h3>
</header>
<p>Apply rule- and cost-based optimizations for the best execution plan.</p>
<ul class="incql-process-list">
<li>Aggregate</li>
<li>Filter</li>
<li>Project</li>
<li>Scan</li>
</ul>
<p class="incql-tag-row">Smart optimizer</p>
</article>

<article class="incql-step-card incql-step-card--execute">
<header class="incql-step-card__title">
<span>05</span>
<h3>Execute</h3>
</header>
<p>Run on the engine that fits: local, in-process, or distributed.</p>
<ul class="incql-process-list">
<li>DataFusion</li>
<li>DuckDB</li>
<li>Spark</li>
<li>Substrait</li>
</ul>
</article>
</div>
</div>
</section>

<section class="incql-prism-visible" markdown="1">
<div class="incql-section-heading" markdown="1">
<p class="incql-section-kicker">Inspect before execution</p>

## Prism makes the compiler <span class="incql-gradient-text">visible</span>

IncQL plans are not opaque strings handed to a backend engine. Prism exposes the typed model and evidence before execution.
</div>

<div class="incql-prism-board" markdown="block">
<div class="incql-code-card" markdown="block">
<div class="incql-feature-card__header">
<span class="incql-feature-card__step">01</span>
<div><strong>Your query</strong><small>Authoring intent</small></div>
</div>

```incan
query {
    FROM orders
    WHERE .status == "paid"
    GROUP BY .region
    SELECT
        .region as region,
        sum(.amount) as total
}
```
</div>

<div class="incql-plan-card" markdown="block">
<div class="incql-feature-card__header incql-feature-card__header--prism">
<span class="incql-feature-card__step incql-feature-card__step--prism">02</span>
<div><strong>Prism inspection</strong><small>Typed relational model</small></div>
<span class="incql-feature-card__status">Inspectable</span>
</div>

```text
Source(orders)
  Filter(status == paid)
  Aggregate(group: region)
  Project(region, total)
```

<div class="incql-evidence-strip" aria-label="Prism evidence available before execution">
<span><strong>Schema</strong> flow</span>
<span><strong>Lineage</strong> attached</span>
<span><strong>Choices</strong> visible</span>
</div>
</div>

<div class="incql-engine-card" markdown="block">
<div class="incql-feature-card__header">
<span class="incql-feature-card__step">03</span>
<div><strong>Execution targets</strong><small>Portable boundary</small></div>
</div>

<ul class="incql-engine-targets">
<li><img src="shared/icons/database-cog-outline.svg" alt="" aria-hidden="true"><span>DataFusion</span></li>
<li><img src="shared/icons/duck.svg" alt="" aria-hidden="true"><span>DuckDB</span></li>
<li><img src="shared/icons/flash-outline.svg" alt="" aria-hidden="true"><span>Spark</span></li>
<li><img src="shared/icons/vector-polyline.svg" alt="" aria-hidden="true"><span>Other Substrait consumers</span></li>
</ul>
</div>
</div>
</section>

<section class="incql-surfaces" markdown="1">
<div class="incql-surfaces__copy" markdown="1">
<p class="incql-section-kicker">Semantic convergence</p>

## One language. Many surfaces.

Different ways to write. Same plan. Same result.
</div>

<div class="incql-surface-demo" markdown="1">
<div class="incql-surface-tabs" data-incql-surface-tabs>
<div class="incql-surface-labels" role="tablist" aria-label="Supported authoring surfaces">
<button type="button" id="incql-surface-tab-query" role="tab" aria-selected="true" aria-controls="incql-surface-panel-query">Query blocks</button>
<button type="button" id="incql-surface-tab-sql" role="tab" aria-selected="false" aria-controls="incql-surface-panel-sql" tabindex="-1">SQL</button>
<button type="button" id="incql-surface-tab-dataframe" role="tab" aria-selected="false" aria-controls="incql-surface-panel-dataframe" tabindex="-1">DataFrames</button>
<button type="button" id="incql-surface-tab-lazyframe" role="tab" aria-selected="false" aria-controls="incql-surface-panel-lazyframe" tabindex="-1">LazyFrames</button>
<button type="button" id="incql-surface-tab-pipeline" role="tab" aria-selected="false" aria-controls="incql-surface-panel-pipeline" tabindex="-1">Pipelines</button>
</div>

<div id="incql-surface-panel-query" class="incql-surface-panel" role="tabpanel" aria-labelledby="incql-surface-tab-query" tabindex="0" markdown="1">

```incan
query {
    FROM orders
    WHERE .status == "paid"
    ORDER BY desc(.amount)
    LIMIT 20
}
```

</div>

<div id="incql-surface-panel-sql" class="incql-surface-panel" role="tabpanel" aria-labelledby="incql-surface-tab-sql" tabindex="0" markdown="1">

```sql
SELECT *
FROM orders
WHERE status = 'paid'
ORDER BY amount DESC
LIMIT 20;
```

</div>

<div id="incql-surface-panel-dataframe" class="incql-surface-panel" role="tabpanel" aria-labelledby="incql-surface-tab-dataframe" tabindex="0" markdown="1">

```incan
preview = (
    orders
        .where(orders["status"] == "paid")
        .sort_values("amount", ascending=false)
        .head(20)
)
```

</div>

<div id="incql-surface-panel-lazyframe" class="incql-surface-panel" role="tabpanel" aria-labelledby="incql-surface-tab-lazyframe" tabindex="0" markdown="1">

```incan
preview = orders
    .filter(eq(col("status"), "paid"))
    .order_by([desc(col("amount"))])
    .limit(20)
```

</div>

<div id="incql-surface-panel-pipeline" class="incql-surface-panel" role="tabpanel" aria-labelledby="incql-surface-tab-pipeline" tabindex="0" markdown="1">

```incan
preview = orders
    |> where .status == "paid"
    |> order_by .amount desc
    |> limit 20
```

</div>
</div>
</div>

<div class="incql-surface-bridge" aria-hidden="true">
<img src="shared/brand/incql-mark.png" alt="" loading="lazy" decoding="async">
<span>One semantic model</span>
</div>

<div class="incql-same-plan" markdown="1">
<div class="incql-same-plan__heading">
<span>Prism</span>
<h3>Same Prism plan</h3>
</div>

<ol class="incql-plan-list">
<li><strong>Source</strong><span>Read the same typed relation.</span></li>
<li><strong>Filter</strong><span>Apply the same predicate semantics.</span></li>
<li><strong>Order</strong><span>Keep descending amount order attached.</span></li>
<li><strong>Limit</strong><span>Return the same preview window.</span></li>
</ol>
</div>
</section>

<section class="incql-trust" markdown="1">
<article class="incql-trust__card incql-trust__card--confidence" markdown="1">
<div class="incql-trust__number" aria-hidden="true">01</div>
<p class="incql-section-kicker">Confidence by construction</p>

## Built for trust

- Static typing and schema flow for confidence
- Prism for deep visibility before execution
- Deterministic, backend-neutral semantics
- Reproducible, testable, observable evidence
</article>

<article class="incql-trust__card incql-trust__card--developer" markdown="1">
<div class="incql-trust__number" aria-hidden="true">02</div>
<p class="incql-section-kicker">A surface developers can own</p>

## Engineered for developers

- Familiar when you know SQL or DataFrames
- Powerful when governance matters
- Extensible, open, and community-driven
- Designed for humans and AI agents
</article>
</section>

<section class="incql-final-cta" markdown="1">
<div class="incql-final-cta__brand" aria-hidden="true">
<img class="incql-final-cta__mark" src="shared/brand/incql-mark.png" alt="" loading="lazy" decoding="async">
</div>

<div class="incql-final-cta__copy" markdown="1">
<p class="incql-section-kicker">Start with inspectable data logic</p>

## Ready to experience IncQL?

Start with a quickstart, explore examples, or jump straight into the reference.
</div>

<div class="incql-actions">
<a class="incql-button incql-button--primary" href="language/how-to/dataset_transformations/">Get started</a>
<a class="incql-button" href="docs_map/">Explore examples</a>
</div>
</section>
</main>

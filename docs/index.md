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

<div class="incql-map-bridge">One semantic model</div>

<div class="incql-map-targets" aria-label="Execution targets">
<article><strong>DuckDB</strong><p>In-process</p></article>
<article><strong>DataFusion</strong><p>Rust</p></article>
<article><strong>Spark</strong><p>JVM</p></article>
<article><strong>Substrait consumers</strong><p>Any engine</p></article>
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
<pre class="incql-mini-code"><code>model Orders {
  id: uuid
  status: str
  region: str
}</code></pre>
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
## Prism makes the compiler <span class="incql-gradient-text">visible</span>

IncQL plans are not opaque strings handed to a backend engine. Prism exposes the typed model and evidence before execution.
</div>

<div class="incql-prism-board" markdown="block">
<div class="incql-code-card" markdown="block">
<span>Your query</span>

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
<span>Prism inspection</span>

```text
Source(orders)
  Filter(status == paid)
  Aggregate(group: region)
  Project(region, total)
```
</div>

<div class="incql-engine-card" markdown="block">
<span>Execution targets</span>

- DataFusion
- DuckDB
- Spark
- Other Substrait consumers
</div>
</div>
</section>

<section class="incql-surfaces" markdown="1">
<div class="incql-surfaces__copy" markdown="1">
## One language. Many surfaces.

Different ways to write. Same plan. Same result.
</div>

<div class="incql-surface-demo" markdown="1">
<div class="incql-tabs" aria-label="Example authoring surfaces">
<span>Query blocks</span>
<span>SQL</span>
<span>DataFrames</span>
<span>LazyFrames</span>
<span>Pipelines</span>
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

<div class="incql-same-plan" markdown="1">
### Same Prism plan

<ol class="incql-plan-list">
<li><strong>Source</strong><span>Read the same typed relation.</span></li>
<li><strong>Filter</strong><span>Apply the same predicate semantics.</span></li>
<li><strong>Aggregate</strong><span>Keep grouping and measures attached.</span></li>
<li><strong>Project</strong><span>Expose the same output shape.</span></li>
</ol>
</div>
</section>

<section class="incql-trust" markdown="1">
<article markdown="1">
## Built for trust

- Static typing and schema flow for confidence
- Prism for deep visibility before execution
- Deterministic, backend-neutral semantics
- Reproducible, testable, observable evidence
</article>

<article markdown="1">
## Engineered for developers

- Familiar when you know SQL or DataFrames
- Powerful when governance matters
- Extensible, open, and community-driven
- Designed for humans and AI agents
</article>
</section>

<section class="incql-final-cta" markdown="1">
<div markdown="1">
## Ready to experience IncQL?

Start with a quickstart, explore examples, or jump straight into the reference.
</div>

<div class="incql-actions">
<a class="incql-button incql-button--primary" href="language/how-to/dataset_transformations/">Get started</a>
<a class="incql-button" href="docs_map/">Explore examples</a>
</div>
</section>
</main>

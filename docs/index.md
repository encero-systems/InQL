<main class="inql-launch" markdown="1">
<section class="inql-hero" markdown="1">
<div class="inql-hero__copy" markdown="1">
<p class="inql-eyebrow">One semantic model. Multiple ways to think.</p>

<h1 id="write-data-logic-once-run-it-anywhere-inspect-everything">Write data logic <span class="inql-gradient-text">once</span>.<br>Run it <span class="inql-gradient-text">anywhere</span>.<br>Inspect <span class="inql-gradient-text">everything</span>.</h1>

<p class="inql-hero__intro">InQL unifies query blocks, DataFrame-style chains, LazyFrames, and pipelines into one typed relational model. Prism lets you see exactly what the compiler sees before execution.</p>

<div class="inql-actions">
<a class="inql-button inql-button--primary" href="language/how-to/dataset_transformations/">Start with transformations</a>
<a class="inql-button" href="language/how-to/inspect_plan_lineage/">See Prism in action</a>
</div>

<div class="inql-proof-row" aria-label="InQL proof points">
<span><strong>Typed & safe</strong> Catch issues early with static typing</span>
<span><strong>Inspectable</strong> See the plan before execution</span>
<span><strong>Portable</strong> Compile to Substrait</span>
<span><strong>Governed</strong> Observe and verify behavior</span>
</div>
</div>

<div class="inql-hero__visual" aria-label="Prism refracts data logic into inspectable typed plan layers.">
<img src="shared/prismplane/prismplane-hero-light.png" alt="A glass prism refracting data logic into layered plan stages.">
</div>
</section>

<section class="inql-problem-panel inql-convergence-section" markdown="1">
<div class="inql-problem-panel__left inql-diagnosis" markdown="1">
<p class="inql-section-kicker">Why it exists</p>

## The problem with data logic today

Teams lose time to expression drift, backend rewrites, and plans that stay hidden until runtime.

<div class="inql-friction-list">
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

<div class="inql-problem-panel__right inql-convergence" role="img" aria-label="Authoring surfaces converging into one typed relational model and refracting into portable execution paths.">
<div class="inql-convergence__copy">
<p class="inql-section-kicker">The InQL idea</p>

<h2>InQL is the unifying layer</h2>

<p>Different surfaces. One compiler. Multiple execution targets.</p>

<div class="inql-convergence-flow" aria-label="InQL semantic convergence flow">
<span>SQL</span>
<span>DataFrames</span>
<span>LazyFrames</span>
<span>Pipelines</span>
<strong>One typed relational model</strong>
<span>Execution targets</span>
</div>

<p class="inql-thesis">Write once. Understand always. Run anywhere.</p>
</div>
</div>
</section>

<section class="inql-process" markdown="1">
<div class="inql-section-heading" markdown="1">
## How InQL works

Author in the surface that fits the task. InQL keeps the semantics attached as the work moves from intent to execution.
</div>

<div class="inql-process-rail">
<article class="inql-step-card">
<span>01</span>
<h3>Author</h3>
<p>Write query blocks, DataFrames, LazyFrames, or pipelines.</p>
<p class="inql-tag-row">SQL · DF · Lazy · Pipe</p>
</article>

<article class="inql-step-card">
<span>02</span>
<h3>Compile</h3>
<p>Lower authoring intent into a typed relational model and Substrait boundary.</p>
<p class="inql-tag-row">Substrait</p>
</article>

<article class="inql-step-card inql-step-card--focus">
<span>03</span>
<h3>Prism</h3>
<p>Inspect schema flow, lineage, projections, filters, and optimizer choices.</p>
<p class="inql-tag-row">Inspect everything</p>
</article>

<article class="inql-step-card">
<span>04</span>
<h3>Optimize</h3>
<p>Apply planning rules without making one engine the semantic owner.</p>
<p class="inql-tag-row">Smart optimizer</p>
</article>

<article class="inql-step-card">
<span>05</span>
<h3>Execute</h3>
<p>Run on DataFusion first, with room for compatible Substrait engines.</p>
<p class="inql-tag-row">DataFusion · DuckDB · Spark</p>
</article>
</div>
</section>

<section class="inql-prism-visible" markdown="1">
<div class="inql-section-heading" markdown="1">
## Prism makes the compiler <span class="inql-gradient-text">visible</span>

InQL plans are not opaque strings handed to a backend engine. Prism exposes the typed model and evidence before execution.
</div>

<div class="inql-prism-board" markdown="block">
<div class="inql-code-card" markdown="block">
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

<div class="inql-plan-card" markdown="block">
<span>Prism inspection</span>

```text
Source(orders)
  Filter(status == paid)
  Aggregate(group: region)
  Project(region, total)
```
</div>

<div class="inql-engine-card" markdown="block">
<span>Execution targets</span>

- DataFusion
- DuckDB
- Spark
- Other Substrait consumers
</div>
</div>
</section>

<section class="inql-surfaces" markdown="1">
<div class="inql-surfaces__copy" markdown="1">
## One language. Many surfaces.

Different ways to write. Same plan. Same result.
</div>

<div class="inql-surface-demo" markdown="1">
<div class="inql-tabs" aria-label="Example authoring surfaces">
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

<div class="inql-same-plan" markdown="1">
### Same Prism plan

<ol class="inql-plan-list">
<li><strong>Source</strong><span>Read the same typed relation.</span></li>
<li><strong>Filter</strong><span>Apply the same predicate semantics.</span></li>
<li><strong>Aggregate</strong><span>Keep grouping and measures attached.</span></li>
<li><strong>Project</strong><span>Expose the same output shape.</span></li>
</ol>
</div>
</section>

<section class="inql-trust" markdown="1">
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

<section class="inql-final-cta" markdown="1">
<div markdown="1">
## Ready to experience InQL?

Start with a quickstart, explore examples, or jump straight into the reference.
</div>

<div class="inql-actions">
<a class="inql-button inql-button--primary" href="language/how-to/dataset_transformations/">Get started</a>
<a class="inql-button" href="docs_map/">Explore examples</a>
</div>
</section>
</main>

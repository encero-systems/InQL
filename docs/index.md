<main class="inql-launch" markdown="1">
<section class="inql-hero" markdown="1">
<div class="inql-hero__copy" markdown="1">
<p class="inql-eyebrow">One semantic model. Multiple ways to think.</p>

<h1 id="write-data-logic-once-run-it-anywhere-inspect-everything">Write data logic <span class="inql-gradient-text">once</span>.<br>Run it <span class="inql-gradient-text">anywhere</span>.<br>Inspect <span class="inql-gradient-text">everything</span>.</h1>

<p class="inql-hero__intro">InQL unifies query blocks, DataFrame-style chains, LazyFrames, and pipelines into one typed relational model. Prism makes the compiler visible before execution.</p>

<div class="inql-actions">
<a class="inql-button inql-button--primary" href="language/how-to/dataset_transformations/">Get started</a>
<a class="inql-button" href="language/how-to/inspect_plan_lineage/">See Prism in action</a>
</div>

<div class="inql-proof-row" aria-label="InQL proof points">
<span><strong>Typed & safe</strong> Catch errors early with static typing</span>
<span><strong>Inspectable</strong> See every stage with Prism before execution</span>
<span><strong>Portable</strong> Compile to Substrait and run on many engines</span>
<span><strong>Governed</strong> Observe, assert, and prove behavior</span>
</div>
</div>

<div class="inql-hero__visual" aria-label="Prism refracts data logic into inspectable typed plan layers.">
<img src="shared/prismplane/prismplane-hero.jpg" alt="">
</div>
</section>

<section class="inql-problem-panel" markdown="1">
<div class="inql-problem-panel__left" markdown="1">
## The problem with data logic today

<div class="inql-problem-grid" markdown="1">
<article markdown="1">
### Too many ways to express logic

SQL, DataFrames, pipelines, and notebooks each carry their own shape.
</article>

<article markdown="1">
### Different semantics and behaviors

Small rewrites can change meaning before anyone sees the plan.
</article>

<article markdown="1">
### Hard to inspect and debug

You see results, but not the typed relational model that produced them.
</article>

<article markdown="1">
### Tied to specific engines

Porting usually means rewriting logic and rechecking behavior.
</article>
</div>
</div>

<div class="inql-problem-panel__right" markdown="1">
## InQL is the unifying layer

Different surfaces. One semantic model. One compiler. Multiple execution targets.

<p class="inql-thesis">Write once. Understand always. Run anywhere.</p>
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
<p>Apply rule-based and cost-aware planning without making an engine the semantic owner.</p>
<p class="inql-tag-row">Smart optimizer</p>
</article>

<article class="inql-step-card">
<span>05</span>
<h3>Execute</h3>
<p>Run on DataFusion first, and keep the boundary open for compatible engines.</p>
<p class="inql-tag-row">DataFusion · DuckDB · Spark</p>
</article>
</div>
</section>

<section class="inql-prism-visible" markdown="1">
<div class="inql-section-heading" markdown="1">
## Prism makes the compiler <span class="inql-gradient-text">visible</span>

InQL plans are not opaque strings handed to a backend engine. Prism exposes the typed model and evidence before execution.
</div>

<div class="inql-prism-board" markdown="1">
<article class="inql-code-card" markdown="1">
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
</article>

<div class="inql-prism-image">
<img src="shared/prismplane/prismplane-hero.jpg" alt="Prism refracting a query into plan layers.">
</div>

<article class="inql-plan-card" markdown="1">
<span>Substrait plan</span>

```text
Root
  Aggregate
    GroupBy: region
    Filter: status = paid
    Scan: orders
```
</article>

<article class="inql-engine-card" markdown="1">
<span>Execution engines</span>

- DataFusion
- DuckDB
- Spark
- Other Substrait consumers
</article>
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

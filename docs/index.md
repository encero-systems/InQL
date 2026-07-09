<main class="inql-launch" markdown="1">
<section class="inql-launch-hero" markdown="1">
<div class="inql-launch-hero__copy" markdown="1">
<p class="inql-eyebrow">One semantic model. Multiple ways to think.</p>

<h1 id="write-once-run-anywhere-inspect-everything">Write data logic <span class="inql-gradient-text">once</span>.<br>Run it <span class="inql-gradient-text">anywhere</span>.<br>Inspect <span class="inql-gradient-text">everything</span>.</h1>

<p class="inql-launch-hero__intro">InQL unifies query blocks, DataFrames, LazyFrames, and portable function calls into one typed relational model. Prism makes the compiler visible before execution, so intent, schema flow, and backend boundaries can be inspected instead of guessed.</p>

<div class="inql-actions">
<a class="inql-button inql-button--primary" href="language/how-to/dataset_transformations/">Start with dataset transformations</a>
<a class="inql-button" href="language/how-to/inspect_plan_lineage/">See Prism in action</a>
</div>

<div class="inql-hero-proof">
<span><strong>Typed</strong> Catch issues before execution</span>
<span><strong>Inspectable</strong> See each planning stage</span>
<span><strong>Portable</strong> Keep semantics backend-neutral</span>
<span><strong>Observable</strong> Record quality and evidence</span>
</div>
</div>

<div class="inql-launch-hero__visual" aria-label="Prism refracts data intent into typed planning stages and portable execution boundaries.">
<img class="inql-launch-hero__image" src="shared/prismplane/prismplane-hero.jpg" alt="">
<div class="inql-prism-story" aria-hidden="true">
<span>Intent</span>
<span>Typed model</span>
<span>Prism inspection</span>
<span>Portable execution</span>
</div>
</div>
</section>

<section class="inql-problem-section" markdown="1">
<div class="inql-section-heading" markdown="1">
## The problem with data logic today

Data work is spread across SQL strings, DataFrame chains, backend-specific functions, orchestration glue, and inspection tools that rarely share one semantic source of truth.
</div>

<div class="inql-problem-layout" markdown="1">
<div class="inql-problem-list" markdown="1">
<article class="inql-quiet-card" markdown="1">
<strong>Too many ways to express logic</strong>

SQL, DataFrames, LazyFrames, and pipelines often drift into separate languages.
</article>

<article class="inql-quiet-card" markdown="1">
<strong>Different semantics and behaviors</strong>

Backend-specific surfaces make portability feel like a rewrite instead of a lowering step.
</article>

<article class="inql-quiet-card" markdown="1">
<strong>Hard to inspect before execution</strong>

Most systems show results first and only expose planning detail after something goes wrong.
</article>

<article class="inql-quiet-card" markdown="1">
<strong>Trust evidence is bolted on</strong>

Quality checks, observations, and governed targets need to attach to the same semantic model.
</article>
</div>

<aside class="inql-thesis-panel" markdown="1">
### InQL is the unifying layer

Different authoring surfaces. One typed relational model. One visible compiler. Multiple execution targets.

<span>Write once. Understand always. Run anywhere.</span>
</aside>
</div>
</section>

<section class="inql-how-section" markdown="1">
<div class="inql-section-heading" markdown="1">
## How InQL works

The important move is not another syntax. It is keeping authoring, inspection, Substrait lowering, adapter execution, and governed evidence attached to the same plan.
</div>

<div class="inql-process-rail" aria-label="InQL process from authoring to execution">
<article>
<span>01</span>
<strong>Author</strong>
<p>Write query blocks, DataFrame-style chains, or dataset methods.</p>
</article>
<article>
<span>02</span>
<strong>Compile</strong>
<p>InQL normalizes intent into a typed relational plan.</p>
</article>
<article class="inql-process-rail__focus">
<span>03</span>
<strong>Prism</strong>
<p>Inspect schema flow, relation nodes, lineage, and optimizer decisions before the backend runs.</p>
</article>
<article>
<span>04</span>
<strong>Lower</strong>
<p>Emit Substrait-compatible logical intent at the execution boundary.</p>
</article>
<article>
<span>05</span>
<strong>Execute</strong>
<p>Run through sessions and backend adapters without making the adapter the semantic owner.</p>
</article>
</div>
</section>

<section class="inql-prism-moment" markdown="1">
<div class="inql-prism-moment__copy" markdown="1">
## Prism makes the compiler visible

InQL plans are not opaque strings headed straight for an engine. Prism exposes the typed relational shape first: source relations, filters, projections, aggregates, windows, generators, lineage edges, quality observations, and backend coverage.

That visibility is the reason InQL can support governance and quality without hiding inside a single execution engine.
</div>

<div class="inql-prism-moment__visual" markdown="1">
<img src="shared/prismplane/prismplane-hero.jpg" alt="">
<div class="inql-stage-strip" aria-label="Prism inspection stages">
<span>Source</span>
<span>Filter</span>
<span>Aggregate</span>
<span>Project</span>
</div>
</div>
</section>

<section class="inql-same-semantics" markdown="1">
<div class="inql-section-heading" markdown="1">
## One language. Many surfaces.

Different ways to write. Same plan. Same result.
</div>

<div class="inql-semantics-layout" markdown="1">
<div class="inql-code-panel" markdown="1">
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
</div>

<div class="inql-plan-panel" markdown="1">
<p>Same Prism plan</p>
<div class="inql-stage-strip inql-stage-strip--large" aria-label="Same Prism plan">
<span>Source</span>
<span>Filter</span>
<span>Aggregate</span>
<span>Project</span>
</div>
</div>
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

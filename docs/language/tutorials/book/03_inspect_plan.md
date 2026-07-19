<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 3. Inspect the plan

Use Prism-backed inspection to explain the lazy work before a backend executes it.
</header>

<section class="pp-book-part-context" aria-label="Part II: Explain and execute it">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part II</p>
    <p class="pp-book-part-context__title"><strong>Explain and execute it</strong></p>
    <p class="pp-book-part-context__position">Chapter 1 of 3</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part II chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../03_inspect_plan/" aria-current="page"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Inspect the plan</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../04_collect_observed/"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Collect an observed result</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../05_adapter_coverage/"><span class="pp-book-part-journey__number">3</span><span class="pp-book-part-journey__title">Check adapter coverage</span></a></li>
    </ol>
  </nav>
</section>

<section class="pp-book-step" markdown="1">

## Goal

Inspect the review plan and its lineage without executing DataFusion. Locate the plan target, output schema, Prism nodes, and lineage relationships that explain the deferred work.

</section>

## Prism is the planning layer

IncQL is the library and public data-logic surface. Prism is its internal logical planning engine; the two names are related but not interchangeable. Today, the `LazyFrame` path owns Prism state, which is why `inspect_plan(...)` and `inspect_lineage(...)` can read this plan locally.

Inspection is read-only. It does not bind a physical backend, inspect a DataFusion physical plan, or turn local evidence into a Substrait payload.

<section class="pp-book-trace" aria-labelledby="inspect-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">Query under glass · local plan evidence</p>
      <h2 id="inspect-trace-title">See what Prism knows—and where inspection stops</h2>
    </div>
    <p>The checkpoint builds one deferred carrier, then reads two views of its local Prism state. Neither inspection call crosses into backend execution.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/code-braces-box.svg" alt="">
        <span class="pp-book-trace__number">01</span>
        <div><strong>Deferred review plan</strong><small>Describe a named read followed by a limit</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
orders: LazyFrame[Order] = session.read_csv("tutorial_orders", "orders.csv")?
plan = orders.limit(3)
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>Authoring surface</dd></div>
        <div><dt>Artifact</dt><dd><code>LazyFrame[Order]</code></dd></div>
        <div><dt>Knowable now</dt><dd>The authored <code>ReadNamedTable → Limit</code> intent</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/link-variant.svg" alt="">
        <span class="pp-book-trace__number">02</span>
        <div><strong>Prism inspection</strong><small>Read structure and lineage from local plan state</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
inspection = inspect_plan(plan.clone())
lineage = inspect_lineage(plan)
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>Prism inspection</dd></div>
        <div><dt>Artifact</dt><dd><code>PlanInspection</code> and lineage graph</dd></div>
        <div><dt>Knowable now</dt><dd>Plan target, output schema, authored nodes, and lineage relationships</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/database-cog-outline.svg" alt="">
        <span class="pp-book-trace__number">03</span>
        <div><strong>Local evidence return</strong><small>Report plan facts without materialising rows</small></div>
      </header>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Plan target</dt><dd>One local Prism identifier</dd></div>
          <div><dt>Authored nodes</dt><dd>2</dd></div>
          <div><dt>Lineage edges</dt><dd>8</dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/vector-polyline.svg" alt=""><code>PlanInspection</code></span>
          <span><img src="../../../../shared/icons/source-branch.svg" alt="">Lineage graph</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Inspection boundary receipt">
    <header><span>Inspection boundary</span><strong>Plan evidence, not runtime evidence</strong></header>
    <dl>
      <div><dt>Established</dt><dd>Local structure, output schema, Prism nodes, and lineage</dd></div>
      <div><dt>Not established</dt><dd>Backend-time source availability or physical backend binding</dd></div>
      <div><dt>Not produced</dt><dd>A DataFusion physical plan or execution telemetry</dd></div>
      <div><dt>Portable boundary</dt><dd>The inspection record is not serialized into Substrait</dd></div>
    </dl>
  </aside>
</section>

<div class="pp-book-chapter-clear" aria-hidden="true"></div>

`inspect_plan(...)` returns a structured `PlanInspection`. `inspect_lineage(...)` exposes the lineage graph from the same Prism-backed state when that graph is all a caller needs. The plan identifier printed by the checkpoint is a local evidence anchor, not a global catalog ID.

<details class="pp-book-source">
  <summary>Open the complete Chapter 3 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_03.incn"
```

  </div>
</details>

Run it from the included tutorial project:

```bash
incan run src/chapter_03.incn
```

A successful run prints the local plan ID, two authored nodes, eight lineage edges, and confirmation that inspection completed without executing the plan.

The exact records and current limits are documented in [Local inspection](../../reference/inspection.md).

<section class="pp-book-exercise" markdown="1">

## Try it

Print each lineage edge's relationship value. For every edge you see, point back to the carrier operation that caused it. Do not interpret a missing edge as proof that no relationship exists; unsupported or conservative evidence is represented separately.

</section>

<section class="pp-book-complete" markdown="1">

## Chapter complete

You can describe what Prism knows before execution and distinguish a local `PlanInspection` from the backend work that has not happened yet.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../02_deferred_plan/"><small>Previous chapter</small><strong>← 2. Build deferred work</strong></a>
  <a href="../04_collect_observed/"><small>Next chapter</small><strong>4. Collect an observed result →</strong></a>
</nav>

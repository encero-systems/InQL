<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 2. Build deferred work

Transform the logical source while keeping execution behind the Session boundary.
</header>

<section class="pp-book-part-context" aria-label="Part I: Model the work">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part I</p>
    <p class="pp-book-part-context__title"><strong>Model the work</strong></p>
    <p class="pp-book-part-context__position">Chapter 2 of 2</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part I chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../01_typed_relation/"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Read a typed relation</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../02_deferred_plan/" aria-current="page"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Build deferred work</span></a></li>
    </ol>
  </nav>
</section>

<section class="pp-book-step" markdown="1">

## Goal

Build a review plan from the CSV-backed `LazyFrame` and run the checkpoint without collecting rows. The important result is a new logical plan, not a local table.

</section>

## Add one honest relational step

IncQL method calls append relational intent to the lazy carrier. This tutorial deliberately adds only `limit(3)`, producing a simple `ReadNamedTable → Limit` plan. A limit constrains the eventual result; it does not materialize that result by itself.

IncQL also has filter, ordering, projection, aggregation, and query-block surfaces. They remain available in [Guides](../../how-to/README.md) and [Reference](../../reference/README.md). The book keeps this first plan deliberately small so the relationship between one authored operation, its Prism representation, and the later execution evidence stays easy to inspect.

<section class="pp-book-trace" aria-labelledby="deferred-plan-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">Plan construction · no execution attempt</p>
      <h2 id="deferred-plan-trace-title">Follow one operation into the logical plan</h2>
    </div>
    <p>The source registration supplies the plan root. <code>limit(3)</code> appends bounded relational intent: the eventual result may contain at most three rows, with no ordering promise.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <span class="pp-book-trace__number">01</span>
        <div><strong>Registered source</strong><small>Start from the named-table carrier</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
orders: LazyFrame[Order] = session.read_csv("tutorial_orders", "orders.csv")?
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code></dd></div>
        <div><dt>Artifact</dt><dd><code>LazyFrame[Order]</code> rooted at <code>ReadNamedTable</code></dd></div>
        <div><dt>Knowable now</dt><dd>The source identity and planned CSV columns</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <span class="pp-book-trace__number">02</span>
        <div><strong>Append bounded intent</strong><small>Add one Prism plan node without collecting</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
return Ok(orders.limit(3))
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>IncQL relational carrier</dd></div>
        <div><dt>Artifact</dt><dd><code>ReadNamedTable → Limit(3)</code> logical plan</dd></div>
        <div><dt>Knowable now</dt><dd>The eventual result is capped at three rows</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <span class="pp-book-trace__number">03</span>
        <div><strong>Deferred plan state</strong><small>Keep backend work behind the Session boundary</small></div>
      </header>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Plan shape</dt><dd><code>ReadNamedTable → Limit</code></dd></div>
          <div><dt>Output bound</dt><dd>At most 3 rows</dd></div>
          <div><dt>Backend attempt</dt><dd>None</dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/vector-polyline.svg" alt="">Prism logical plan</span>
          <span><img src="../../../../shared/icons/chart-timeline-variant.svg" alt="">Execution still absent</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Deferred plan receipt">
    <header><span>Plan receipt</span><strong>The plan changed; no rows moved</strong></header>
    <dl>
      <div><dt>Input</dt><dd><code>ReadNamedTable("tutorial_orders")</code></dd></div>
      <div><dt>Operation</dt><dd><code>Limit(3)</code></dd></div>
      <div><dt>Ordering</dt><dd>No “first three” ordering is guaranteed</dd></div>
      <div><dt>Next question</dt><dd><a href="../03_inspect_plan/">What can Prism explain? →</a></dd></div>
    </dl>
  </aside>
</section>

<details class="pp-book-source">
  <summary>Open the complete Chapter 2 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_02.incn"
```

  </div>
</details>

Run it from `examples/tutorial_book`:

```bash
incan run src/chapter_02.incn
```

The source file deliberately stops before `collect(...)`. The returned value is still a `LazyFrame[Order]`, so further relational operations or inspection can be composed before runtime binding and execution.

<div class="pp-book-output" markdown="1">

**Expected output**

```text
Chapter 2: planned ReadNamedTable -> Limit; execution is still deferred
```

There is no materialized row count or table preview. That absence is meaningful: no `DataFrame` exists yet.

</div>

For the complete method surface, use [Dataset methods](../../reference/dataset_methods.md). The book stays with the verified operation set needed by this one flow.

<section class="pp-book-exercise" markdown="1">

## Try it

Reduce the final limit by one and rerun the checkpoint. Explain why this changes the plan but still gives you no local rows. Restore the original limit before Chapter 3.

</section>

<section class="pp-book-complete" markdown="1">

## Chapter complete

You can identify the logical source, the appended carrier operations, and the missing execution call. You can also explain why a `LazyFrame` is not an in-memory `DataFrame`.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../01_typed_relation/"><small>Previous chapter</small><strong>← 1. Read a typed relation</strong></a>
  <a href="../03_inspect_plan/"><small>Next chapter</small><strong>3. Inspect the plan →</strong></a>
</nav>

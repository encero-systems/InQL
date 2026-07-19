<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 4. Collect an observed result

Let the Session bind and execute the plan, then retain evidence about that concrete attempt.
</header>

<section class="pp-book-part-context pp-book-part-context--rail" aria-label="Part II: Explain and execute it">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part II</p>
    <p class="pp-book-part-context__title"><strong>Explain and execute it</strong></p>
    <p class="pp-book-part-context__position">Chapter 2 of 3</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part II chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../03_inspect_plan/"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Inspect the plan</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../04_collect_observed/" aria-current="page"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Collect an observed result</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../05_adapter_coverage/"><span class="pp-book-part-journey__number">3</span><span class="pp-book-part-journey__title">Check adapter coverage</span></a></li>
    </ol>
  </nav>
</section>

<section class="pp-book-step" markdown="1">

## Goal

Materialize the review as a `DataFrame[Order]` and inspect the accompanying `ExecutionObservation`. Relate that runtime attempt back to the plan inspected in Chapter 3.

</section>

This chapter keeps inspection and execution visibly separate. `inspect_plan(plan.clone())` and `inspect_lineage(plan.clone())` receive clones so the original deferred `plan` remains available; neither call materializes its rows. Passing that plan to `collect_observed(...)` crosses the execution boundary: the `Session` validates and runs the plan through the selected backend, then materializes the result locally.

With this example, you are collecting at most three orders through DataFusion while retaining evidence about that specific attempt. The returned `ObservedDataFrame[Order]` always carries an `observation`; its `data` is `Some(DataFrame[Order])` only when materialization succeeds, and its optional `error` carries the typed failure otherwise. The trace keeps those artifacts separate so a runtime record never has to pretend that row data exists.

<section class="pp-book-trace" aria-labelledby="collect-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">Query under glass · one concrete attempt</p>
      <h2 id="collect-trace-title">Follow the change across its owners</h2>
    </div>
    <p><code>collect_observed(...)</code> crosses three boundaries. Each boundary answers a different technical question and produces a different artifact.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/code-braces-box.svg" alt="">
        <span class="pp-book-trace__number">01</span>
        <div><strong>Chapter change</strong><small>Describe and inspect the deferred work</small></div>
      </header>
      <div class="pp-book-trace__body pp-book-code-explainer" markdown="1">

```incan
plan = orders.limit(3)
inspection = inspect_plan(plan.clone()) # (1)!
lineage = inspect_lineage(plan.clone())
```

<ol>
  <li><p><strong>Inspect without consuming the plan.</strong> <code>clone()</code> gives the local inspection functions the same deferred work while leaving <code>plan</code> available for the later execution call. Both <code>inspect_plan(...)</code> and <code>inspect_lineage(...)</code> describe local plan evidence; neither materializes rows.</p></li>
</ol>

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>Authoring surface</dd></div>
        <div><dt>Artifact</dt><dd>Prism-backed deferred plan</dd></div>
        <div><dt>Knowable now</dt><dd>Plan identity, authored nodes, schema, and lineage</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/link-variant.svg" alt="">
        <span class="pp-book-trace__number">02</span>
        <div><strong>Session dispatch</strong><small>Lower, bind, and submit one attempt</small></div>
      </header>
      <div class="pp-book-trace__body pp-book-code-explainer" markdown="1">

```incan
observed = session.collect_observed(plan) # (1)!
```

<ol>
  <li><p><strong>Cross the execution boundary and keep its receipt.</strong> <code>Session</code> validates, lowers, binds, and submits this plan as a concrete collection attempt. The return value is an <code>ObservedDataFrame[Order]</code>: it always carries the attempt's <code>observation</code>, while <code>data</code> and <code>error</code> distinguish successful materialization from a typed failure.</p></li>
</ol>

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code></dd></div>
        <div><dt>Artifact</dt><dd><code>ObservedDataFrame[Order]</code></dd></div>
        <div><dt>Knowable now</dt><dd>A distinct attempt exists and is correlated with the plan</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/database-cog-outline.svg" alt="">
        <span class="pp-book-trace__number">03</span>
        <div><strong>DataFusion attempt</strong><small>Execute and return materialisation evidence</small></div>
      </header>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Backend</dt><dd><code>datafusion</code></dd></div>
          <div><dt>Resolved shape</dt><dd>4 columns</dd></div>
          <div><dt>Materialised rows</dt><dd>3</dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/chart-timeline-variant.svg" alt="">ExecutionObservation</span>
          <span><img src="../../../../shared/icons/table-check.svg" alt="">DataFrame[Order]</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Observation receipt">
    <header><span>Observation receipt</span><strong>Returned together, kept distinct</strong></header>
    <dl>
      <div><dt>Plan target</dt><dd>Retained for correlation</dd></div>
      <div><dt>Attempt target</dt><dd>Distinct runtime identity</dd></div>
      <div><dt>Materialised data</dt><dd>Optional; absent on a failed attempt</dd></div>
      <div><dt>Next question</dt><dd><a href="../05_adapter_coverage/">What did the adapter claim to cover? →</a></dd></div>
    </dl>
  </aside>
</section>

<div class="pp-book-chapter-clear" aria-hidden="true"></div>

The returned `data` and `observation` are deliberately separate. On success, `data` exposes the supported materialisation surface—resolved columns, row count, and preview text. IncQL does not currently expose typed `Order` iteration here, so the book does not imply that it does. On failure, the attempt can still return typed diagnostics without pretending that materialised data exists.

The observation has its own attempt identity while retaining the plan target. This allows multiple concrete attempts to remain correlated with one logical plan without collapsing the plan and its executions into the same event.

<details class="pp-book-source">
  <summary>Open the complete Chapter 4 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_04.incn"
```

  </div>
</details>

Run it from the included tutorial project:

```bash
incan run src/chapter_04.incn
```

<div class="pp-book-output" markdown="1">

**Expected evidence**

The checkpoint reports the local plan ID and lineage count, names `datafusion` as the backend, and prints four resolved columns, three materialised rows, and a compact preview. The final line confirms that DataFusion collection completed.

</div>

For all observation fields and failure behavior, see [Execution context](../../reference/execution_context.md).

<section class="pp-book-exercise" markdown="1">

## Try it

Print the observation's `attempt_target` next to its `plan_target`. Explain why the two targets must remain distinct even when this chapter performs only one attempt.

</section>

<section class="pp-book-complete" markdown="1">

## Chapter complete

You can distinguish the Prism plan, the DataFusion execution attempt, and the local `DataFrame`, and you can show how the attempt remains correlated with the plan.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../03_inspect_plan/"><small>Previous chapter</small><strong>← 3. Inspect the plan</strong></a>
  <a href="../05_adapter_coverage/"><small>Next chapter</small><strong>5. Check adapter coverage →</strong></a>
</nav>

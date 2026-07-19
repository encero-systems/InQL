<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 5. Check adapter coverage

Ask a separate question: what capabilities is the selected adapter known to cover for this plan?
</header>

<section class="pp-book-part-context" aria-label="Part II: Explain and execute it">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part II</p>
    <p class="pp-book-part-context__title"><strong>Explain and execute it</strong></p>
    <p class="pp-book-part-context__position">Chapter 3 of 3</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part II chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../03_inspect_plan/"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Inspect the plan</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../04_collect_observed/"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Collect an observed result</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../05_adapter_coverage/" aria-current="page"><span class="pp-book-part-journey__number">3</span><span class="pp-book-part-journey__title">Check adapter coverage</span></a></li>
    </ol>
  </nav>
</section>

<section class="pp-book-step" markdown="1">

## Goal

Evaluate the adapter requirements inferred from the review plan and interpret every coverage state conservatively.

</section>

## Execution success is not capability evidence

Chapter 4 showed that one plan attempt ran. `check_plan_coverage(...)` answers a different question: for requirements visible in the inspected plan, what does IncQL know about the selected adapter's capability or guarantee?

<section class="pp-book-trace" aria-labelledby="coverage-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">Two questions · two independent answers</p>
      <h2 id="coverage-trace-title">Keep execution and coverage separate</h2>
    </div>
    <p>The checkpoint first records one concrete execution attempt, then explicitly checks the requirements visible in the plan. A successful attempt cannot upgrade a conservative coverage state.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <span class="pp-book-trace__number">01</span>
        <div><strong>Concrete attempt</strong><small>Execute the review plan once</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
observed = session.collect_observed(plan.clone())
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> and selected backend</dd></div>
        <div><dt>Artifact</dt><dd><code>ObservedDataFrame[Order]</code></dd></div>
        <div><dt>Knowable now</dt><dd>This attempt ran on <code>datafusion</code> and materialised three rows</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <span class="pp-book-trace__number">02</span>
        <div><strong>Explicit coverage check</strong><small>Classify requirements inferred from the plan</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
coverage = session.check_plan_coverage(plan)
for record in coverage:
    println(f"- {record.requirement.capability.value()}: {record.state.value()}")
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> coverage evaluation</dd></div>
        <div><dt>Artifact</dt><dd><code>list[AdapterCoverageRecord]</code></dd></div>
        <div><dt>Knowable now</dt><dd>The selected adapter's classification for each plan-inferred requirement</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <span class="pp-book-trace__number">03</span>
        <div><strong>Conservative result</strong><small>Read every state literally</small></div>
      </header>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Execution</dt><dd>3 rows materialised</dd></div>
          <div><dt>Null semantics</dt><dd><code>covered</code></dd></div>
          <div><dt>Lineage preservation</dt><dd><code>uncovered</code></dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/table-check.svg" alt="">Observed result</span>
          <span><img src="../../../../shared/icons/shield-check-outline.svg" alt="">Coverage records</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Execution and coverage receipt">
    <header><span>Checkpoint receipt</span><strong>Success does not erase an uncovered capability</strong></header>
    <dl>
      <div><dt>Execution answer</dt><dd>The selected backend accepted this concrete plan attempt</dd></div>
      <div><dt>Coverage answer</dt><dd>Two plan-inferred requirements retain their own classifications</dd></div>
      <div><dt>Conservative rule</dt><dd><code>Uncovered</code> and <code>Unknown</code> never become soft success</dd></div>
      <div><dt>Decision owner</dt><dd>Caller-owned policy decides whether the result is acceptable</dd></div>
    </dl>
  </aside>
</section>

<div class="pp-book-chapter-clear" aria-hidden="true"></div>

Coverage states are deliberately conservative:

- `Covered` means the adapter is known to cover that requirement family.
- `PartiallyCovered` means support depends on the specific expression or plan shape.
- `Uncovered` means the adapter is known not to provide the guarantee.
- `Unknown` means IncQL has no classification; it is not a soft success.

The current DataFusion adapter provides the classifications printed by the checkpoint. They are not a hidden policy decision and do not replace the execution observation.

<details class="pp-book-source">
  <summary>Open the complete Chapter 5 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_05.incn"
```

  </div>
</details>

Run it from the included tutorial project:

```bash
incan run src/chapter_05.incn
```

A successful run reports the concrete DataFusion result separately from two coverage records: `null_semantics: covered` and `lineage_preservation: uncovered`.

Read the complete capability vocabulary and current DataFusion matrix in [Execution context](../../reference/execution_context.md#adapter-coverage).

<section class="pp-book-exercise" markdown="1">

## Try it

Add a `match` over the coverage states and print a separate message for `Unknown`. Make that message say “not classified,” not “supported,” then restore the checkpoint.

</section>

<section class="pp-book-complete" markdown="1">

## Chapter complete

You can explain why a successful query may still have an uncovered or unknown requirement, and why only caller-owned policy can decide whether that evidence is acceptable.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../04_collect_observed/"><small>Previous chapter</small><strong>← 4. Collect an observed result</strong></a>
  <a href="../06_quality_observations/"><small>Next chapter</small><strong>6. Observe data quality →</strong></a>
</nav>

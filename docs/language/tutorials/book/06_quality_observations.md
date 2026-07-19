<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 6. Observe data quality

Evaluate explicit assertions and keep a failed observation separate from execution errors and policy enforcement.
</header>

<section class="pp-book-part-context" aria-label="Part III: Decide what happens next">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part III</p>
    <p class="pp-book-part-context__title"><strong>Decide what happens next</strong></p>
    <p class="pp-book-part-context__position">Chapter 1 of 2</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part III chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../06_quality_observations/" aria-current="page"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Observe data quality</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../07_governed_write/"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Make the write decision</span></a></li>
    </ol>
  </nav>
</section>

<section class="pp-book-step" markdown="1">

## Goal

Evaluate one row-count assertion that passes and another that deliberately fails. Read their metrics and statuses without treating the failed check as an automatic exception or row filter.

</section>

## Assertions describe; Session observes

A quality assertion records the condition a caller wants evaluated. `session.observe_quality(...)` executes the work needed to evaluate it and returns a `QualityObservation` for each assertion.

<section class="pp-book-trace" aria-labelledby="quality-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">Three collections · two quality answers</p>
      <h2 id="quality-trace-title">Make every observation attempt visible</h2>
    </div>
    <p>The checkpoint has already called <code>collect_observed(...)</code> once. Each <code>observe_quality(...)</code> call executes and collects the plan again to evaluate its own assertion.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <span class="pp-book-trace__number">01</span>
        <div><strong>Passing observation</strong><small>Evaluate the accepted range in a fresh collection</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
passing = session.observe_quality(plan.clone(), [row_count(min_count=Some(1), max_count=Some(3))])
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> quality evaluation</dd></div>
        <div><dt>Artifact</dt><dd>One <code>QualityObservation</code> and its execution references</dd></div>
        <div><dt>Knowable now</dt><dd>The freshly collected row count satisfies the inclusive range</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <span class="pp-book-trace__number">02</span>
        <div><strong>Deliberate failing observation</strong><small>Evaluate a stricter assertion in another collection</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
failing = session.observe_quality(plan, [row_count(min_count=Some(4))])
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> quality evaluation</dd></div>
        <div><dt>Artifact</dt><dd>A separate <code>QualityObservation</code> and execution attempt</dd></div>
        <div><dt>Knowable now</dt><dd>Three rows do not satisfy a minimum of four, so the status is <code>Failed</code></dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <span class="pp-book-trace__number">03</span>
        <div><strong>Tutorial policy</strong><small>Interpret the evidence in caller-owned code</small></div>
      </header>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Owner</dt><dd><code>caller_accepts(...)</code></dd></div>
          <div><dt>Passing list</dt><dd><code>true</code></dd></div>
          <div><dt>Failing list</dt><dd><code>false</code></dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/table-check.svg" alt="">QualityObservation × 2</span>
          <span><img src="../../../../shared/icons/shield-check-outline.svg" alt="">Tutorial policy result</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Quality observation receipt">
    <header><span>Quality receipt</span><strong>Evidence is produced; enforcement is not</strong></header>
    <dl>
      <div><dt>Baseline attempt</dt><dd>The earlier <code>collect_observed(...)</code> collected once</dd></div>
      <div><dt>Passing check</dt><dd><code>observe_quality(...)</code> collected the plan again</dd></div>
      <div><dt>Failing check</dt><dd>The second quality call performed another collection</dd></div>
      <div><dt>Decision owner</dt><dd><code>caller_accepts(...)</code> is tutorial policy, not IncQL enforcement</dd></div>
    </dl>
  </aside>
</section>

<div class="pp-book-chapter-clear" aria-hidden="true"></div>

The assertion mode can express intended handling, but IncQL does not silently quarantine rows, stop a pipeline, or approve an output. A `Failed` observation means the predicate was evaluated and returned false; it is evidence, not an exception or automatic gate. `Errored` means the relational work needed by the check could not be executed.

<details class="pp-book-source">
  <summary>Open the complete Chapter 6 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_06.incn"
```

  </div>
</details>

Run it:

```bash
incan run src/chapter_06.incn
```

The run reports `passed` for the inclusive range, `failed` for the deliberate minimum of four, and the corresponding `true` and `false` results from the tutorial's `caller_accepts(...)` function.

For the assertion helpers, status vocabulary, and cross-relation path, see [Quality](../../reference/quality.md).

<section class="pp-book-exercise" markdown="1">

## Try it

Print the metrics and execution-observation references carried by both records. Then explain why the final chapter still needs caller-owned decision logic if a failed observation should prevent a write.

</section>

<section class="pp-book-complete" markdown="1">

## Chapter complete

You can distinguish `Passed`, `Failed`, and `Errored`, read the reported metrics, and state clearly that a quality observation is evidence rather than enforcement.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../05_adapter_coverage/"><small>Previous chapter</small><strong>← 5. Check adapter coverage</strong></a>
  <a href="../07_governed_write/"><small>Next chapter</small><strong>7. Make the write decision →</strong></a>
</nav>

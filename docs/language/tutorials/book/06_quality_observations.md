<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 6. Observe data quality

Evaluate explicit assertions and keep a failed observation separate from execution errors and policy enforcement.
</header>

<div class="pp-book-progress" aria-label="Chapter 6 of 7">
  <div><strong>Chapter 6 of 7</strong><span>Quality evidence</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="6"><span style="--pp-book-progress: 85.7%"></span></div>
</div>

<section class="pp-book-step" markdown="1">

## Goal

Evaluate one row-count assertion that passes and another that deliberately fails. Read their metrics and statuses without treating the failed check as an automatic exception or row filter.

</section>

## Assertions describe; Session observes

A quality assertion records the condition a caller wants evaluated. `session.observe_quality(...)` executes the work needed to evaluate it and returns a `QualityObservation` for each assertion.

The assertion mode can express intended handling, but IncQL does not silently quarantine rows, stop a pipeline, or approve an output. A `Failed` observation means the predicate was evaluated and returned false. `Errored` means the relational work needed by the check could not be executed.

<div class="pp-book-workbench" markdown="1">

**Chapter checkpoint**

```incan
--8<-- "examples/tutorial_book/src/chapter_06.incn"
```

</div>

Run it:

```bash
incan run src/chapter_06.incn
```

Using a deliberate failure makes the boundary visible: the observation records the failed expectation, while the checkpoint continues far enough to print and inspect that evidence.

<div class="pp-book-output" markdown="1">

**Expected evidence**

The same three-row review produces two row-count observations. The inclusive range from one through three reports `passed`; the deliberately impossible minimum of four reports `failed`. The checkpoint then shows that `caller_accepts(...)` returns `true` for the passing observation list and `false` for the failing one.

</div>

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

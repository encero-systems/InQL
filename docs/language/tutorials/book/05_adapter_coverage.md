<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 5. Check adapter coverage

Ask a separate question: what capabilities is the selected adapter known to cover for this plan?
</header>

<div class="pp-book-progress" aria-label="Chapter 5 of 7">
  <div><strong>Chapter 5 of 7</strong><span>Adapter evidence</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="5"><span style="--pp-book-progress: 71.4%"></span></div>
</div>

<section class="pp-book-step" markdown="1">

## Goal

Evaluate the adapter requirements inferred from the review plan and interpret every coverage state conservatively.

</section>

## Execution success is not capability evidence

Chapter 4 showed that one plan attempt ran. `check_plan_coverage(...)` answers a different question: for requirements visible in the inspected plan, what does IncQL know about the selected adapter's capability or guarantee?

<div class="pp-book-workbench" markdown="1">

**Chapter checkpoint**

```incan
--8<-- "examples/tutorial_book/src/chapter_05.incn"
```

</div>

Run it:

```bash
incan run src/chapter_05.incn
```

Coverage states are deliberately conservative:

- `Covered` means the adapter is known to cover that requirement family.
- `PartiallyCovered` means support depends on the specific expression or plan shape.
- `Uncovered` means the adapter is known not to provide the guarantee.
- `Unknown` means IncQL has no classification; it is not a soft success.

The current DataFusion adapter provides the classifications printed by the checkpoint. They are adapter evidence, not a hidden policy decision and not a replacement for the execution observation.

<div class="pp-book-output" markdown="1">

**Expected evidence**

The output reports the number of plan-inferred requirements, then prints each requirement capability and its coverage state. The earlier collection still names `datafusion`, keeping the execution adapter and the separate coverage records visible in one checkpoint.

</div>

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

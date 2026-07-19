<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 4. Collect an observed result

Let the Session bind and execute the plan, then retain evidence about that concrete attempt.
</header>

<div class="pp-book-progress" aria-label="Chapter 4 of 7">
  <div><strong>Chapter 4 of 7</strong><span>Execution observation</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="4"><span style="--pp-book-progress: 57.1%"></span></div>
</div>

<section class="pp-book-step" markdown="1">

## Goal

Materialize the review as a `DataFrame[Order]` and inspect the accompanying `ExecutionObservation`. Relate that runtime attempt back to the plan inspected in Chapter 3.

</section>

## One plan, one concrete attempt

`collect_observed(...)` asks the Session to lower, bind, execute, and materialize the lazy work. The current implemented adapter is DataFusion. The result keeps the materialized data separate from the observation so a failed attempt can still return diagnostics without pretending that data exists.

<div class="pp-book-workbench" markdown="1">

**Chapter checkpoint**

```incan
--8<-- "examples/tutorial_book/src/chapter_04.incn"
```

</div>

Run it:

```bash
incan run src/chapter_04.incn
```

On success, `data` contains a materialized `DataFrame`. The supported inspection surface is intentionally structured and small: resolved columns, row count, and preview text. The book does not invent typed row iteration that IncQL does not currently expose.

The observation has its own attempt identity while retaining the plan target. That is how one logical plan can be correlated with multiple future execution attempts without treating them as the same event.

<div class="pp-book-output" markdown="1">

**Expected evidence**

The checkpoint reports the local plan ID and lineage count, names `datafusion` as the backend, and prints four resolved columns, three materialized rows, and a compact preview. The final line confirms that DataFusion collection completed.

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

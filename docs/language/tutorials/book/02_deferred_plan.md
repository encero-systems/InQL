<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 2. Build deferred work

Transform the logical source while keeping execution behind the Session boundary.
</header>

<div class="pp-book-progress" aria-label="Chapter 2 of 7">
  <div><strong>Chapter 2 of 7</strong><span>Deferred plan</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="2"><span style="--pp-book-progress: 28.6%"></span></div>
</div>

<section class="pp-book-step" markdown="1">

## Goal

Build a review plan from the CSV-backed `LazyFrame` and run the checkpoint without collecting rows. The important result is a new logical plan, not a local table.

</section>

## Add one honest relational step

IncQL method calls append relational intent to the lazy carrier. This tutorial deliberately adds only `limit(3)`, producing a simple `ReadNamedTable → Limit` plan. A limit constrains the eventual result; it does not materialize that result by itself.

IncQL also has filter, ordering, projection, aggregation, and query-block surfaces. They remain available in [Guides](../../how-to/README.md) and [Reference](../../reference/README.md). The book keeps this first plan deliberately small so the relationship between one authored operation, its Prism representation, and the later execution evidence stays easy to inspect.

<div class="pp-book-workbench" markdown="1">

**Chapter checkpoint**

```incan
--8<-- "examples/tutorial_book/src/chapter_02.incn"
```

</div>

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

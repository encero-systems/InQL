<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 3. Inspect the plan

Use Prism-backed inspection to explain the lazy work before a backend executes it.
</header>

<div class="pp-book-progress" aria-label="Chapter 3 of 7">
  <div><strong>Chapter 3 of 7</strong><span>Plan evidence</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="3"><span style="--pp-book-progress: 42.9%"></span></div>
</div>

<section class="pp-book-step" markdown="1">

## Goal

Inspect the review plan and its lineage without executing DataFusion. Locate the plan target, output schema, Prism nodes, and lineage relationships that explain the deferred work.

</section>

## Prism is the planning layer

IncQL is the library and public data-logic surface. Prism is its internal logical planning engine; the two names are related but not interchangeable. Today, the `LazyFrame` path owns Prism state, which is why `inspect_plan(...)` and `inspect_lineage(...)` can read this plan locally.

Inspection is read-only. It does not bind a physical backend, inspect a DataFusion physical plan, or turn local evidence into a Substrait payload.

<div class="pp-book-workbench" markdown="1">

**Chapter checkpoint**

```incan
--8<-- "examples/tutorial_book/src/chapter_03.incn"
```

</div>

Run it:

```bash
incan run src/chapter_03.incn
```

`inspect_plan(...)` returns a structured `PlanInspection`. `inspect_lineage(...)` exposes the lineage graph from the same Prism-backed state when that graph is all a caller needs.

<div class="pp-book-output" markdown="1">

**Expected evidence**

The output identifies one local plan ID, the number of authored Prism nodes, and the number of lineage edges for the `ReadNamedTable → Limit` plan, followed by confirmation that inspection completed without executing it. The identifier is a local evidence anchor, not a global catalog ID.

</div>

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

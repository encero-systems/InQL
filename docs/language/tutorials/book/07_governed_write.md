<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 7. Make the write decision

Turn evidence into an explicit application decision, then retain an observation about the write attempt.
</header>

<div class="pp-book-progress" aria-label="Chapter 7 of 7">
  <div><strong>Chapter 7 of 7</strong><span>Caller-owned decision + observed write</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="7"><span style="--pp-book-progress: 100%"></span></div>
</div>

<section class="pp-book-step" markdown="1">

## Goal

Read the evidence produced by the earlier stages, decide in ordinary Incan code whether the review may be written, and use `write_observed(...)` to retain evidence about the concrete sink attempt.

</section>

## The decision belongs to the caller

IncQL exposes distinct facts:

- Prism inspection explains the deferred plan.
- Adapter coverage records what the selected adapter is known to cover.
- Quality observations report whether explicit data checks passed.
- Execution observations report what happened during a concrete attempt.

None of those records silently defines your organization's acceptance rule. This checkpoint makes the rule visible in a normal function, so readers can see exactly which evidence permits or prevents the write.

<div class="pp-book-workbench" markdown="1">

**Chapter checkpoint**

```incan
--8<-- "examples/tutorial_book/src/chapter_07.incn"
```

</div>

Run it:

```bash
incan run src/chapter_07.incn
```

`write_observed(...)` owns the sink attempt through the Session and returns an observation plus an optional error. The CSV file is the side effect; the return value is evidence about whether that attempt succeeded.

<div class="pp-book-output" markdown="1">

**Expected evidence**

The deliberate strict probe shows that the caller would reject its failed observation. The separate required check passes, so caller-owned logic permits `write_observed(...)` to write `target/tutorial-orders.csv`; the final line confirms that the observed write completed. Inspect that CSV as an output artifact, not as a collection of typed `Order` instances.

</div>

## Read the completed system path

You have now followed one real `LazyFrame` through the current IncQL path:

1. The author supplied a logical CSV source and intended row model.
2. IncQL stored deferred relational intent in a Prism-backed plan.
3. Local inspection exposed schema, plan, and lineage evidence before execution.
4. Session lowered and bound the plan, then dispatched DataFusion.
5. Execution, coverage, and quality records answered different questions about the result.
6. Caller-owned code made the acceptance decision and asked Session to write.

Substrait remains the portable logical-plan boundary in that path. The local inspection records and execution observations are correlated evidence; they are not smuggled into the Substrait payload.

<section class="pp-book-exercise" markdown="1">

## Try it

Change the decision function so an `Unknown` adapter-coverage state also blocks writing. Print the reason for the decision, run both branches, and restore the checkpoint. Notice that you changed application policy without changing the evidence record types.

</section>

<section class="pp-book-complete" markdown="1">

## Book complete

You can build, inspect, execute, evaluate, and write one IncQL plan while explaining which layer owns each decision. Continue with [Guides](../../how-to/README.md) for task-specific transformations, [Reference](../../reference/README.md) for exact contracts, or [Architecture](../../../architecture.md) for the full system story.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../06_quality_observations/"><small>Previous chapter</small><strong>← 6. Observe data quality</strong></a>
  <a href="../"><small>Book overview</small><strong>Review all 7 chapters</strong></a>
</nav>

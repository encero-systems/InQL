<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 7. Make the write decision

Turn evidence into an explicit application decision, then retain an observation about the write attempt.
</header>

<section class="pp-book-part-context" aria-label="Part III: Decide what happens next">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part III</p>
    <p class="pp-book-part-context__title"><strong>Decide what happens next</strong></p>
    <p class="pp-book-part-context__position">Chapter 2 of 2</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part III chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../06_quality_observations/"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Observe data quality</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../07_governed_write/" aria-current="page"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Make the write decision</span></a></li>
    </ol>
  </nav>
</section>

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

<section class="pp-book-trace" aria-labelledby="write-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">One narrow gate · one new write attempt</p>
      <h2 id="write-trace-title">Show exactly what permits the write</h2>
    </div>
    <p>The checkpoint prints coverage and a deliberate strict probe, but its gate reads only <code>required_quality</code>. If that gate passes, <code>write_observed(...)</code> executes the plan again.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/code-braces-box.svg" alt="">
        <span class="pp-book-trace__number">01</span>
        <div><strong>Quality inputs</strong><small>Produce the required check and an explanatory strict probe</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
required_quality = session.observe_quality(
    plan.clone(),
    [row_count(min_count=Some(1), max_count=Some(3))],
)
deliberate_probe = session.observe_quality(plan.clone(), [row_count(min_count=Some(4))])
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> quality evaluation</dd></div>
        <div><dt>Artifact</dt><dd>Passing required evidence and a failing strict probe</dd></div>
        <div><dt>Knowable now</dt><dd>Each quality call collected the plan again; neither result enforces a write rule</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/link-variant.svg" alt="">
        <span class="pp-book-trace__number">02</span>
        <div><strong>Caller gate</strong><small>Use only the required quality list</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
if not caller_accepts(required_quality):
    println("Caller decision: do not write")
    return Ok(None)
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>Tutorial application code</dd></div>
        <div><dt>Artifact</dt><dd>An explicit control-flow decision</dd></div>
        <div><dt>Knowable now</dt><dd>Coverage and the strict probe are printed for inspection but do not participate in this gate</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/database-cog-outline.svg" alt="">
        <span class="pp-book-trace__number">03</span>
        <div><strong>Observed write</strong><small>Execute the accepted plan again and attempt the sink side effect</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
output_uri = "target/tutorial-orders.csv"
written = session.write_observed(plan, csv_sink(output_uri))
match written.error:
    Some(error) => return Err(error)
    None =>
        println("Caller decision: write the plan accepted by the required policy")
        println(f"wrote: {output_uri}")
```

      </div>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Owner</dt><dd><code>Session</code> and DataFusion sink path</dd></div>
          <div><dt>Artifact</dt><dd><code>ObservedWrite</code> plus the CSV side effect</dd></div>
          <div><dt>Knowable now</dt><dd>This write attempt returned no typed error</dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/database-cog-outline.svg" alt="">tutorial-orders.csv</span>
          <span><img src="../../../../shared/icons/chart-timeline-variant.svg" alt="">ObservedWrite</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Write attempt receipt and current correlation limits">
    <header><span>Write receipt</span><strong>A focused attempt record, not a governed bundle</strong></header>
    <dl>
      <div><dt>Gate input</dt><dd>Only <code>required_quality</code></dd></div>
      <div><dt>Coverage</dt><dd>Printed, but not gated</dd></div>
      <div><dt>Write runtime</dt><dd>The plan executes again for the sink attempt</dd></div>
      <div><dt>Receipt shape</dt><dd>Observation plus optional error</dd></div>
      <div><dt>Not carried</dt><dd>No sink URI, row count, quality, or coverage references</dd></div>
      <div><dt>Correlation limit</dt><dd>Fallback Substrait-root target; no uninterrupted edge to the earlier Prism plan target</dd></div>
    </dl>
  </aside>
</section>

<div class="pp-book-chapter-clear" aria-hidden="true"></div>

`write_observed(...)` owns the sink attempt through the Session and returns an observation plus an optional error. The CSV file is the side effect. The `ObservedWrite` receipt does not currently carry the sink URI, row count, quality observations, or coverage records, and its observation uses a fallback Substrait-root target rather than the earlier Prism plan target. It therefore must not be presented as an uninterrupted correlation edge or a complete governed-output bundle.

<details class="pp-book-source">
  <summary>Open the complete Chapter 7 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_07.incn"
```

  </div>
</details>

Run it:

```bash
incan run src/chapter_07.incn
```

The run reports two coverage records—`null_semantics: covered` and `lineage_preservation: uncovered`—but does not gate on them. It reports `passed` for the required quality check and `failed` for the strict probe, then writes `target/tutorial-orders.csv` because the required list passed. Inspect that CSV as an output artifact, not as typed `Order` iteration.

## Read the completed system path

You have now followed one real `LazyFrame` through the current IncQL path:

1. The author supplied a logical CSV source and intended row model.
2. IncQL stored deferred relational intent in a Prism-backed plan.
3. Local inspection exposed schema, plan, and lineage evidence before execution.
4. Session lowered and bound the plan, then dispatched DataFusion.
5. Execution, coverage, and quality records answered different questions about the result.
6. Caller-owned code made the acceptance decision and asked Session to write.

Substrait remains the portable logical-plan boundary in that path. The earlier collection observation retains its plan correlation, and the quality observations reference their own execution attempts. The final write receipt currently starts from a fallback Substrait-root target, so the book does not draw a continuous evidence edge from the earlier Prism plan through that write.

<section class="pp-book-exercise" markdown="1">

## Try it

Pass the coverage records into a new caller-owned gate so an `Unknown` state also blocks writing. Print the reason for the decision, run both branches, and restore the checkpoint. Notice that the unmodified chapter does not gate on coverage and that you changed application policy without changing the evidence record types.

</section>

<section class="pp-book-complete" markdown="1">

## Book complete

You can build, inspect, execute, evaluate, and write one IncQL plan while explaining which layer owns each decision. Continue with [Guides](../../how-to/README.md) for task-specific transformations, [Reference](../../reference/README.md) for exact contracts, or [Architecture](../../../architecture.md) for the full system story.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../06_quality_observations/"><small>Previous chapter</small><strong>← 6. Observe data quality</strong></a>
  <a href="../"><small>Book overview</small><strong>Browse all Parts</strong></a>
</nav>

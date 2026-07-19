<header class="pp-book-header" markdown="1">
<p>GUIDED TUTORIAL</p>

# The IncQL Book

Follow one small order dataset from typed intent to an observed, deliberately governed result. The book is organised into focused Parts, so later topics can deepen or branch from the core path without turning it into one endless sequence.
</header>

<section class="pp-book-map pp-book-overview" data-book-parts aria-labelledby="book-map-title">
  <header class="pp-book-map__header">
    <div>
      <p class="pp-book-eyebrow">One project · three engineering outcomes</p>
      <h2 id="book-map-title">Choose the part of the system you want to understand</h2>
    </div>
    <p>Open one Part at a time. Every chapter names its owner, outcome, and primary artifact.</p>
  </header>

  <div class="pp-book-parts">
    <details class="pp-book-part pp-book-part--model" id="part-model" name="incql-book-parts" data-book-part="model" open>
      <summary class="pp-book-part__summary">
        <span class="pp-book-part__marker">Part I</span>
        <span class="pp-book-part__name">Model the work</span>
        <span class="pp-book-part__outcome">Typed source → deferred plan</span>
        <span class="pp-book-part__count">2 chapters</span>
      </summary>
      <div class="pp-book-part__body">
        <div class="pp-book-part__columns" aria-hidden="true">
          <span>Chapter</span><span>Outcome</span><span>Owner</span><span>Primary artifact</span>
        </div>
        <ol class="pp-book-part__chapters">
          <li>
            <a href="01_typed_relation/">
              <span class="pp-book-part__chapter"><b>01</b><strong>Read a typed relation</strong></span>
              <span>Bind a named CSV source and carry the intended row model.</span>
              <span>Author → Session</span>
              <span class="pp-book-part__artifact"><img src="../../../shared/icons/table-check.svg" alt="">Typed source</span>
            </a>
          </li>
          <li>
            <a href="02_deferred_plan/">
              <span class="pp-book-part__chapter"><b>02</b><strong>Build deferred work</strong></span>
              <span>Describe a small relational operation without backend execution.</span>
              <span>LazyFrame → Prism</span>
              <span class="pp-book-part__artifact"><img src="../../../shared/icons/source-branch.svg" alt="">Deferred plan</span>
            </a>
          </li>
        </ol>
      </div>
    </details>

    <details class="pp-book-part pp-book-part--evidence" id="part-evidence" name="incql-book-parts" data-book-part="evidence">
      <summary class="pp-book-part__summary">
        <img class="pp-book-part__prism" src="../../../shared/prismplane/process-flow-stage-v3.png" alt="">
        <span class="pp-book-part__marker">Part II</span>
        <span class="pp-book-part__name">Explain and execute it</span>
        <span class="pp-book-part__outcome">Inspection → observed attempt → coverage</span>
        <span class="pp-book-part__count">3 chapters</span>
      </summary>
      <div class="pp-book-part__body">
        <div class="pp-book-part__columns" aria-hidden="true">
          <span>Chapter</span><span>Outcome</span><span>Owner</span><span>Primary artifact</span>
        </div>
        <ol class="pp-book-part__chapters">
          <li>
            <a href="03_inspect_plan/">
              <span class="pp-book-part__chapter"><b>03</b><strong>Inspect the plan</strong></span>
              <span>Explain the Prism plan and lineage before execution.</span>
              <span>Prism inspection</span>
              <span class="pp-book-part__artifact"><img src="../../../shared/icons/vector-polyline.svg" alt="">Plan<wbr>Inspection</span>
            </a>
          </li>
          <li>
            <a href="04_collect_observed/">
              <span class="pp-book-part__chapter"><b>04</b><strong>Collect an observed result</strong></span>
              <span>Materialise through DataFusion and retain attempt evidence.</span>
              <span>Session → adapter</span>
              <span class="pp-book-part__artifact"><img src="../../../shared/icons/chart-timeline-variant.svg" alt="">Observed<wbr>DataFrame</span>
            </a>
          </li>
          <li>
            <a href="05_adapter_coverage/">
              <span class="pp-book-part__chapter"><b>05</b><strong>Check adapter coverage</strong></span>
              <span>Separate execution success from capability evidence.</span>
              <span>Session</span>
              <span class="pp-book-part__artifact"><img src="../../../shared/icons/shield-check-outline.svg" alt="">Coverage records</span>
            </a>
          </li>
        </ol>
      </div>
    </details>

    <details class="pp-book-part pp-book-part--govern" id="part-govern" name="incql-book-parts" data-book-part="govern">
      <summary class="pp-book-part__summary">
        <span class="pp-book-part__marker">Part III</span>
        <span class="pp-book-part__name">Decide what happens next</span>
        <span class="pp-book-part__outcome">Quality evidence → caller decision</span>
        <span class="pp-book-part__count">2 chapters</span>
      </summary>
      <div class="pp-book-part__body">
        <div class="pp-book-part__columns" aria-hidden="true">
          <span>Chapter</span><span>Outcome</span><span>Owner</span><span>Primary artifact</span>
        </div>
        <ol class="pp-book-part__chapters">
          <li>
            <a href="06_quality_observations/">
              <span class="pp-book-part__chapter"><b>06</b><strong>Observe data quality</strong></span>
              <span>Compare passing and failing observations without inventing enforcement.</span>
              <span>Session → caller</span>
              <span class="pp-book-part__artifact"><img src="../../../shared/icons/table-check.svg" alt="">Quality<wbr>Observation</span>
            </a>
          </li>
          <li>
            <a href="07_governed_write/">
              <span class="pp-book-part__chapter"><b>07</b><strong>Make the write decision</strong></span>
              <span>Let caller-owned policy decide whether to attempt the write.</span>
              <span>Caller → adapter</span>
              <span class="pp-book-part__artifact"><img src="../../../shared/icons/database-cog-outline.svg" alt="">Observed<wbr>Write</span>
            </a>
          </li>
        </ol>
      </div>
    </details>
  </div>

  <aside class="pp-book-dossier" aria-label="Tutorial project dossier">
    <header><span>Project dossier</span><code>tutorial_orders</code></header>
    <div class="pp-book-dossier__grid">
      <section>
        <img src="../../../shared/icons/table-check.svg" alt="">
        <div><strong>Input</strong><span><code>orders.csv</code> · intended <code>Order</code> model</span></div>
      </section>
      <section>
        <img src="../../../shared/icons/chart-timeline-variant.svg" alt="">
        <div><strong>Evidence produced</strong><span>Plan, attempt, coverage, and quality records</span></div>
      </section>
      <section>
        <img src="../../../shared/icons/shield-check-outline.svg" alt="">
        <div><strong>Decision retained</strong><span>The caller decides whether the write is attempted</span></div>
      </section>
    </div>
  </aside>
</section>

## What you will build

The project reads an included CSV through a `Session`, carries an intended `Order` row model, and builds a deferred `LazyFrame`. You will inspect that plan through Prism before asking the current DataFusion adapter to execute it. The later chapters separate adapter coverage from data-quality observations, then make the write decision explicitly in application code.

The result is deliberately modest: a bounded three-row order review written to CSV. The important part is that you can explain what IncQL knew before execution, what the backend reported afterwards, and which decision still belonged to your code.

## Before you begin

You need:

- an Incan toolchain compatible with this checkout
- a working Rust and CMake build toolchain for the local IncQL dependency; its protobuf sources are vendored, so a system `protoc` is not required
- a local IncQL checkout; the tutorial project uses a path dependency and does not claim a registry release

From the IncQL repository root, prepare the included project once:

```bash
cd examples/tutorial_book
incan lock
```

Each chapter gives one `incan run` command from that directory. The source files are cumulative checkpoints: you can run a chapter directly without reconstructing all earlier edits.

## How this book fits the site

This edition follows one bounded CSV-to-write path. Later Parts can deepen the core language or introduce a separate execution path with its own prerequisites. Use [Guides](../../how-to/README.md) for independent tasks, [Reference](../../reference/README.md) for exact signatures and record fields, and [Architecture](../../../architecture.md) for the complete boundary and ownership story.

<nav class="pp-book-pagination" aria-label="Book navigation">
  <span><small>You are here</small><strong>Book overview</strong></span>
  <a href="01_typed_relation/"><small>Start Part I</small><strong>1. Read a typed relation →</strong></a>
</nav>

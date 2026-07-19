<header class="pp-book-header" markdown="1">
<p>GUIDED TUTORIAL</p>

# The IncQL Book

Follow one small order dataset from a typed source to an inspected, observed, and deliberately written result. Every chapter advances the same runnable project, so the system boundaries stay visible instead of disappearing behind isolated snippets.
</header>

<div class="pp-book-progress" aria-label="Seven-chapter learning path">
  <div><strong>7 chapters</strong><span>Typed source → deferred plan → evidence → governed write</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="0"><span style="--pp-book-progress: 0%"></span></div>
</div>

## What you will build

The project reads an included CSV through a `Session`, carries an intended `Order` row model, and builds a deferred `LazyFrame`. You will inspect that plan through Prism before asking the current DataFusion adapter to execute it. The final chapters examine adapter coverage and data-quality observations, then make the write decision explicitly in application code.

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

## Chapters

1. [Read a typed relation](01_typed_relation.md) — create a Session-owned logical CSV source and understand what its row model does and does not guarantee.
2. [Build deferred work](02_deferred_plan.md) — add a deliberately small limit step without materializing rows.
3. [Inspect the plan](03_inspect_plan.md) — read Prism plan and lineage evidence before a backend runs.
4. [Collect an observed result](04_collect_observed.md) — materialize through DataFusion and retain one execution observation.
5. [Check adapter coverage](05_adapter_coverage.md) — distinguish successful execution from evidence about adapter capabilities.
6. [Observe data quality](06_quality_observations.md) — evaluate a passing and deliberately failing row-count assertion without inventing enforcement.
7. [Make the write decision](07_governed_write.md) — let caller-owned logic decide whether to write, then retain evidence about the write attempt.

## How this book fits the site

The book teaches one sequence. Use [Guides](../../how-to/README.md) for independent tasks such as windows, generators, nested values, and semi-structured data. Use [Reference](../../reference/README.md) for exact signatures and record fields. Use [Architecture](../../../architecture.md) when you want the complete boundary and ownership story.

<nav class="pp-book-pagination" aria-label="Book navigation">
  <span><small>You are here</small><strong>Book overview</strong></span>
  <a href="01_typed_relation/"><small>Start the book</small><strong>1. Read a typed relation →</strong></a>
</nav>

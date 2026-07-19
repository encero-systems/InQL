<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 1. Read a typed relation

Create a Session-owned logical CSV source and carry its intended row shape in `LazyFrame[Order]`.
</header>

<div class="pp-book-progress" aria-label="Chapter 1 of 7">
  <div><strong>Chapter 1 of 7</strong><span>Typed source</span></div>
  <div class="pp-book-progress__meter" role="progressbar" aria-label="Book progress" aria-valuemin="0" aria-valuemax="7" aria-valuenow="1"><span style="--pp-book-progress: 14.3%"></span></div>
</div>

<section class="pp-book-step" markdown="1">

## Goal

By the end of this chapter, the included consumer project can open `orders.csv` as a deferred `LazyFrame[Order]`. You will know which part is a checked Incan type, which part is a logical source registration, and which compatibility check is not yet performed.

</section>

## Start from a real consumer project

The book is not compiled as part of IncQL itself. It is a small downstream project whose manifest points at this checkout, which also verifies that the public `pub::incql` boundary works.

<div class="pp-book-workbench" markdown="1">

**Project manifest**

```toml
--8<-- "examples/tutorial_book/incan.toml"
```

</div>

The path dependency is the truthful setup for this checkout. It should not be read as evidence that IncQL has been published to a package registry.

## Define the intended row shape

The `Order` model gives the carrier an intended row type. Later functions can accept `LazyFrame[Order]` rather than an untyped table handle.

<div class="pp-book-workbench" markdown="1">

**Shared domain model**

```incan
--8<-- "examples/tutorial_book/src/domain.incn"
```

</div>

That type parameter is useful, but its boundary must be stated precisely: current CSV ingress does not validate every physical CSV field and type against the annotated Incan model. `LazyFrame[Order]` carries the author's intended model while IncQL's planned schema comes from the registered source.

The included data is small enough to keep every later result understandable:

<div class="pp-book-workbench" markdown="1">

**Tutorial CSV**

```csv
--8<-- "examples/tutorial_book/orders.csv"
```

</div>

## Register the source

`Session` owns source registration, backend selection, execution, materialization, and writes. `read_csv(...)` registers a logical relation name and returns deferred work; it does not hand you materialized rows.

<div class="pp-book-workbench" markdown="1">

**Chapter checkpoint**

```incan
--8<-- "examples/tutorial_book/src/chapter_01.incn"
```

</div>

Run the checkpoint from the tutorial project:

```bash
incan run src/chapter_01.incn
```

<div class="pp-book-output" markdown="1">

**Expected output**

```text
Chapter 1: created a LazyFrame[Order] without executing it
```

The checkpoint deliberately prints no schema or rows. It proves that the public consumer can register the logical source and create its lazy carrier. Later materialization exposes resolved columns, row counts, and preview text rather than typed `Order` iteration.

</div>

<section class="pp-book-exercise" markdown="1">

## Try it

Change only the logical table name passed to `read_csv(...)`, then run the checkpoint again. The physical CSV stays the same, but the name attached to the logical read changes. Restore the checkpoint before continuing.

</section>

<section class="pp-book-complete" markdown="1">

## Chapter complete

You can explain why `LazyFrame[Order]` is deferred relational intent, why the Session owns the CSV binding, and why the `Order` annotation is not yet proof that the physical CSV conforms field-for-field.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../"><small>Book overview</small><strong>All 7 chapters</strong></a>
  <a href="../02_deferred_plan/"><small>Next chapter</small><strong>2. Build deferred work →</strong></a>
</nav>

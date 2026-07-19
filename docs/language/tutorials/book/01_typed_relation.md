<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 1. Read a typed relation

Create a Session-owned logical CSV source and carry its intended row shape in `LazyFrame[Order]`.
</header>

<section class="pp-book-part-context" aria-label="Part I: Model the work">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part I</p>
    <p class="pp-book-part-context__title"><strong>Model the work</strong></p>
    <p class="pp-book-part-context__position">Chapter 1 of 2</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part I chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../01_typed_relation/" aria-current="page"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Read a typed relation</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../02_deferred_plan/"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Build deferred work</span></a></li>
    </ol>
  </nav>
</section>

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

<section class="pp-book-trace" aria-labelledby="typed-relation-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">Source registration · before backend execution</p>
      <h2 id="typed-relation-trace-title">See what <code>read_csv(...)</code> actually establishes</h2>
    </div>
    <p>The call joins an intended Incan carrier type to a Session-owned source registration. It reads the local CSV to establish a coarse planned schema, but it does not execute the relation through DataFusion.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/code-braces-box.svg" alt="">
        <span class="pp-book-trace__number">01</span>
        <div><strong>Intended row shape</strong><small>State the carrier contract in checked Incan</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
pub model Order:
    pub order_id: int
    pub customer_id: str
    pub status: str
    pub amount: float
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>Incan authoring surface</dd></div>
        <div><dt>Artifact</dt><dd><code>Order</code> and the intended <code>LazyFrame[Order]</code> type</dd></div>
        <div><dt>Knowable now</dt><dd>The row shape the consumer intends to carry</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/link-variant.svg" alt="">
        <span class="pp-book-trace__number">02</span>
        <div><strong>CSV registration</strong><small>Bind a logical name and establish a planned source schema</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
orders: LazyFrame[Order] = session.read_csv("tutorial_orders", "orders.csv")?
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> and its CSV source policy</dd></div>
        <div><dt>Artifact</dt><dd>Logical source registration plus a coarse inferred CSV schema</dd></div>
        <div><dt>Knowable now</dt><dd>Header names, primitive kinds, nullability, and source identity</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/database-cog-outline.svg" alt="">
        <span class="pp-book-trace__number">03</span>
        <div><strong>Deferred carrier</strong><small>Return intent without materialising rows</small></div>
      </header>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Logical root</dt><dd><code>ReadNamedTable("tutorial_orders")</code></dd></div>
          <div><dt>Returned carrier</dt><dd><code>LazyFrame[Order]</code></dd></div>
          <div><dt>Backend attempt</dt><dd>None</dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/file-tree-outline.svg" alt="">Session registration</span>
          <span><img src="../../../../shared/icons/vector-polyline.svg" alt="">Deferred named-table plan</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Source registration receipt">
    <header><span>Registration receipt</span><strong>A logical source exists; materialised data does not</strong></header>
    <dl>
      <div><dt>Local file I/O</dt><dd><code>orders.csv</code> is read during registration</dd></div>
      <div><dt>Schema evidence</dt><dd>Coarse CSV inference supplies the planned columns</dd></div>
      <div><dt>Contract boundary</dt><dd>The inferred schema is not compared with <code>Order</code></dd></div>
      <div><dt>Next question</dt><dd><a href="../02_deferred_plan/">How does the plan grow? →</a></dd></div>
    </dl>
  </aside>
</section>

<details class="pp-book-source">
  <summary>Open the complete Chapter 1 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_01.incn"
```

  </div>
</details>

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
  <a href="../"><small>Book overview</small><strong>Browse all Parts</strong></a>
  <a href="../02_deferred_plan/"><small>Next chapter</small><strong>2. Build deferred work →</strong></a>
</nav>

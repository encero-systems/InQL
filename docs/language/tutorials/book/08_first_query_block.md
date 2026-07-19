<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 8. Write your first query block

Shape a typed relation with SQL-familiar clauses, then cross the same explicit Session execution boundary.
</header>

<section class="pp-book-part-context pp-book-part-context--query" aria-label="Part IV: Query blocks">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part IV</p>
    <p class="pp-book-part-context__title"><strong>Query blocks</strong></p>
    <p class="pp-book-part-context__position">Chapter 1 of 2</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part IV chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../08_first_query_block/" aria-current="page"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Write your first query</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../09_summarize_query/"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Summarize and order results</span></a></li>
    </ol>
  </nav>
</section>

<section class="pp-book-step" markdown="1">

## Goal

Activate IncQL's query vocabulary, begin with a typed CSV-backed `LazyFrame[Order]`, express filtering, projection, ordering, and a limit in one `query { ... }` expression, then collect the resulting plan.

</section>

## Change the authoring surface, not the system boundary

A query block is an IncQL expression embedded in ordinary Incan code. It is not a SQL string and it does not open a file, choose an engine, or execute itself. `import pub::incql` activates the dependency-owned vocabulary, while the `Session` still owns source registration and execution. This means the source setup from the core Book remains valid: `read_csv(...)` registers a logical name and returns deferred work whose intended row shape is described by `Order`.

The block then reads top to bottom. `FROM orders` establishes the current relation. `WHERE .status == "paid"` adds a predicate against that relation. `SELECT` publishes a new three-column query schema through explicit aliases. `ORDER BY desc(.amount)` reads the projected `amount` column and requests descending order; IncQL uses the `desc(...)` helper rather than postfix SQL such as `.amount DESC`. Finally, `LIMIT 10` caps the ordered result.

With this example, you are asking for paid orders only, retaining `order_id`, `customer_id`, and `amount`, ordering the projected rows from highest to lowest amount, and returning no more than ten. Because the `FROM` value is a `LazyFrame`, the query expression also returns a `LazyFrame`. Its clauses become deferred carrier operations—`ReadNamedTable → Filter → SelectProject → OrderBy → Limit`—before `session.collect(...)` crosses the runtime boundary.

<section class="pp-book-trace" aria-labelledby="first-query-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">One typed source · one checked clause flow</p>
      <h2 id="first-query-trace-title">Follow the query from activation to rows</h2>
    </div>
    <p>The authoring syntax changes, but the ownership story does not: IncQL builds deferred intent and Session performs the concrete DataFusion collection.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/code-braces-box.svg" alt="">
        <span class="pp-book-trace__number">01</span>
        <div><strong>Activate and register</strong><small>Make the vocabulary available, then establish a typed logical source</small></div>
      </header>
      <div class="pp-book-trace__body pp-book-code-explainer" markdown="1">

```incan
import pub::incql # (1)!

orders: LazyFrame[Order] = session.read_csv(
    "tutorial_orders_query",
    "orders.csv",
)?
```

<ol>
  <li><p><strong>Activate the dependency-owned vocabulary.</strong> The plain <code>import pub::incql</code> makes <code>query</code> and its scoped helpers available to this compilation unit. The separate <code>from pub::incql import ...</code> statement in the complete source imports the ordinary types and functions that the surrounding Incan code names directly.</p></li>
</ol>

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> source registration</dd></div>
        <div><dt>Artifact</dt><dd><code>LazyFrame[Order]</code> rooted at <code>ReadNamedTable</code></dd></div>
        <div><dt>Knowable now</dt><dd>The logical source identity and intended row model; no rows have been collected</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/source-branch.svg" alt="">
        <span class="pp-book-trace__number">02</span>
        <div><strong>Author the query</strong><small>Publish a projected schema while keeping the result deferred</small></div>
      </header>
      <div class="pp-book-trace__body pp-book-code-explainer" markdown="1">

```incan
paid_orders: LazyFrame[PaidOrderReview] = query { # (1)!
    FROM orders
    WHERE .status == "paid"
    SELECT
        .order_id as order_id,
        .customer_id as customer_id,
        .amount as amount,
    ORDER BY desc(.amount) # (2)!
    LIMIT 10
}
```

<ol>
  <li><p><strong>Describe the intended output without pretending validation is stronger than it is.</strong> A current query block requires <code>FROM</code> and <code>SELECT</code>. Because <code>orders</code> is lazy, the expression returns deferred work. <code>LazyFrame[PaidOrderReview]</code> documents the intended projected row model; the current implementation checks query-schema evolution and selected aliases, while complete field-for-field and type compatibility validation against that annotation remains follow-up work.</p></li>
  <li><p><strong>Resolve fields against the clause's current schema.</strong> Leading-dot references name fields visible at that point in the query. The <code>SELECT</code> aliases publish <code>order_id</code>, <code>customer_id</code>, and <code>amount</code> for later clauses, so <code>.amount</code> in <code>ORDER BY</code> refers to the projected column. Use <code>asc(...)</code> for the opposite direction; postfix <code>ASC</code>/<code>DESC</code> tokens are not query-block syntax.</p></li>
</ol>

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>IncQL query vocabulary and carrier planning</dd></div>
        <div><dt>Artifact</dt><dd><code>LazyFrame[PaidOrderReview]</code></dd></div>
        <div><dt>Knowable now</dt><dd>The filter, projected schema, ordering, and upper row bound; execution is still absent</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/database-cog-outline.svg" alt="">
        <span class="pp-book-trace__number">03</span>
        <div><strong>Collect the result</strong><small>Bind and execute the deferred query through Session</small></div>
      </header>
      <div class="pp-book-trace__body pp-book-code-explainer" markdown="1">

```incan
result = session.collect(paid_orders)? # (1)!
println(f"columns: {result.resolved_columns():?}")
println(f"rows: {result.row_count()}")
println(result.preview_text())
```

<ol>
  <li><p><strong>Cross the execution boundary deliberately.</strong> <code>collect(...)</code> submits the deferred query through the selected backend and returns a materialized <code>DataFrame[PaidOrderReview]</code> on success. Use <code>collect_observed(...)</code> instead when the caller also needs the structured success-or-failure observation introduced earlier in the Book.</p></li>
</ol>

      </div>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Backend</dt><dd><code>datafusion</code></dd></div>
          <div><dt>Columns</dt><dd><code>order_id</code>, <code>customer_id</code>, <code>amount</code></dd></div>
          <div><dt>Rows</dt><dd>2 paid orders, highest amount first</dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/source-branch.svg" alt="">Query plan</span>
          <span><img src="../../../../shared/icons/table-check.svg" alt="">Materialized result</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="First query-block receipt">
    <header><span>Query receipt</span><strong>SQL-familiar authoring, the same typed execution path</strong></header>
    <dl>
      <div><dt>Activation</dt><dd><code>import pub::incql</code></dd></div>
      <div><dt>Input</dt><dd><code>LazyFrame[Order]</code></dd></div>
      <div><dt>Deferred plan</dt><dd><code>Filter → SelectProject → OrderBy → Limit</code></dd></div>
      <div><dt>Output intent</dt><dd><code>LazyFrame[PaidOrderReview]</code></dd></div>
      <div><dt>Execution call</dt><dd><code>session.collect(...)</code></dd></div>
      <div><dt>Materialized result</dt><dd>2 rows across 3 resolved columns</dd></div>
    </dl>
  </aside>
</section>

<div class="pp-book-chapter-clear" aria-hidden="true"></div>

The query block and an equivalent method chain converge on the same relational carrier semantics. Here, however, every relation-shaping step appears in one clause-oriented expression. That makes the current query schema especially visible: the source model supplies the fields before `SELECT`, and the aliases published by `SELECT` supply the fields seen by `ORDER BY`.

The intended output type still deserves precise language. `PaidOrderReview` is valuable documentation and gives the surrounding Incan program a typed carrier contract, but this release does not yet prove complete compatibility between every selected field/type and that annotated model. The runnable checkpoint verifies the actual resolved column names and materialized rows instead of presenting the annotation alone as physical-schema evidence.

<details class="pp-book-source">
  <summary>Open the complete Chapter 8 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_08.incn"
```

  </div>
</details>

Run it from the included tutorial project:

```bash
incan run src/chapter_08.incn
```

<div class="pp-book-output" markdown="1">

**Expected evidence**

The checkpoint reports the resolved columns `order_id`, `customer_id`, and `amount`, then reports two rows. Its preview places order `1001` before order `1003`, demonstrating that the paid-row filter and descending order both reached execution. The final line confirms that Chapter 8 completed.

</div>

For the complete clause inventory, expression operators, alias rules, and current limitations, use [Query blocks](../../reference/query_blocks.md).

<section class="pp-book-exercise" markdown="1">

## Try it

Change `desc(.amount)` to `asc(.amount)` and reduce the limit to `1`. Run the checkpoint and explain why order `1003` is now the only preview row. Restore the original ordering and limit before continuing.

</section>

<section class="pp-book-complete" markdown="1">

## Chapter complete

You can activate IncQL's query vocabulary, explain how leading-dot fields and aliases follow the current query schema, distinguish deferred query authoring from Session collection, and state the present output-model validation limit honestly.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../"><small>Previous route</small><strong>← Book overview</strong></a>
  <a href="../09_summarize_query/"><small>Next chapter</small><strong>9. Summarize and order results →</strong></a>
</nav>

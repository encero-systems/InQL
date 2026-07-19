<header class="pp-book-header" markdown="1">
<p>THE INCQL BOOK</p>

# 9. Summarize and order results

Turn order rows into a grouped, typed summary with IncQL's SQL-familiar query clauses, then collect the deferred result.
</header>

<section class="pp-book-part-context pp-book-part-context--query" aria-label="Part IV: Query blocks">
  <header class="pp-book-part-context__summary">
    <p class="pp-book-part-context__label">Part IV</p>
    <p class="pp-book-part-context__title"><strong>Query blocks</strong></p>
    <p class="pp-book-part-context__position">Chapter 2 of 2</p>
  </header>
  <nav class="pp-book-part-journey" aria-label="Part IV chapter journey">
    <ol class="pp-book-part-journey__list">
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../08_first_query_block/"><span class="pp-book-part-journey__number">1</span><span class="pp-book-part-journey__title">Write your first query</span></a></li>
      <li class="pp-book-part-journey__item"><a class="pp-book-part-journey__link" href="../09_summarize_query/" aria-current="page"><span class="pp-book-part-journey__number">2</span><span class="pp-book-part-journey__title">Summarize and order results</span></a></li>
    </ol>
  </nav>
</section>

<section class="pp-book-step" markdown="1">

## Goal

Group the tutorial orders by status, calculate a row count and amount total for every group, order those summaries by the projected total, and materialize the result through the Session.

</section>

## Turn rows into a summary relation

The first query-block chapter filtered and projected individual rows. This chapter changes the result's grain: after `GROUP BY .status`, one output row represents one distinct status rather than one input order. Every non-aggregate field selected by the query must therefore be compatible with the available group keys, while `count()` and `sum(.amount)` produce one value for the whole group.

The aggregate helpers are ordinary imported IncQL functions. The checkpoint imports `count`, `sum`, and `desc` from `pub::incql`; the query vocabulary decides where those expressions are valid and how they contribute to the relational plan. The aliases `order_count` and `total_amount` become columns in the projected schema, so the later `ORDER BY` can refer to `.total_amount` directly.

This is intentionally SQL-familiar syntax, not an embedded SQL dialect. An IncQL query block requires an explicit `SELECT`; predicates use Incan equality `==`, not SQL assignment-like `=`; descending order is expressed as `desc(.total_amount)`, not postfix `DESC`. IncQL also has no `HAVING` keyword. To filter grouped output, place a second `WHERE` after `SELECT`, where the projected aliases are in scope.

With this example, you are describing a deferred `LazyFrame[StatusSummary]` with three planned output columns—`status`, `order_count`, and `total_amount`—and then asking the Session to collect it. The `StatusSummary` annotation records the output model you intend to carry. IncQL checks the evolving query schema and the selected aliases, but full field-by-field and type-by-type compatibility validation against that annotated output model remains follow-up work; the annotation alone is not proof of complete model conformance.

<section class="pp-book-trace" aria-labelledby="grouped-query-trace-title">
  <header class="pp-book-trace__header">
    <div>
      <p class="pp-book-eyebrow">Grouped intent · projected schema · one collection</p>
      <h2 id="grouped-query-trace-title">Follow the summary from clauses to rows</h2>
    </div>
    <p>The query block first produces deferred relational work. Only <code>session.collect(...)</code> crosses the execution boundary and materializes the three grouped rows.</p>
  </header>

  <ol class="pp-book-trace__stages">
    <li class="pp-book-trace__stage pp-book-trace__stage--source">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/code-braces-box.svg" alt="">
        <span class="pp-book-trace__number">01</span>
        <div><strong>Grouped query</strong><small>Describe the grain, measures, and output order</small></div>
      </header>
      <div class="pp-book-trace__body pp-book-code-explainer" markdown="1">

```incan
summaries: LazyFrame[StatusSummary] = query {
    FROM orders
    GROUP BY .status # (1)!
    SELECT # (2)!
        .status as status,
        count() as order_count, # (3)!
        sum(.amount) as total_amount,
    ORDER BY desc(.total_amount) # (4)!
}
```

<ol>
  <li><p><strong>Choose the result grain.</strong> <code>GROUP BY .status</code> partitions the current <code>orders</code> relation by its <code>status</code> field. After this clause, a selected non-aggregate expression must be compatible with the group keys; this is why the query selects <code>.status</code> alongside aggregate measures.</p></li>
  <li><p><strong>Publish an explicit output schema.</strong> <code>SELECT</code> is required rather than implied. Its aliases name the three columns available to following clauses and to the returned carrier: <code>status</code>, <code>order_count</code>, and <code>total_amount</code>.</p></li>
  <li><p><strong>Compute measures with imported functions.</strong> <code>count()</code> counts rows in each status group; <code>sum(.amount)</code> totals that group's amount values. Both helpers must be imported from <code>pub::incql</code>. Their aliases make the measures addressable after the projection boundary.</p></li>
  <li><p><strong>Order the projected relation.</strong> <code>.total_amount</code> resolves to the alias introduced by the preceding <code>SELECT</code>. <code>desc(...)</code> constructs descending ordering intent; postfix SQL syntax such as <code>.total_amount DESC</code> is not part of the query-block grammar.</p></li>
</ol>

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd>IncQL query vocabulary and relational carrier</dd></div>
        <div><dt>Artifact</dt><dd>A deferred <code>LazyFrame[StatusSummary]</code></dd></div>
        <div><dt>Knowable now</dt><dd>Group key, projected aliases, aggregate intent, and descending order</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--session">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/link-variant.svg" alt="">
        <span class="pp-book-trace__number">02</span>
        <div><strong>Collection boundary</strong><small>Submit the deferred summary through the Session</small></div>
      </header>
      <div class="pp-book-trace__body" markdown="1">

```incan
result = session.collect(summaries)?
```

      </div>
      <dl class="pp-book-trace__facts">
        <div><dt>Owner</dt><dd><code>Session</code> and the selected DataFusion adapter</dd></div>
        <div><dt>Artifact</dt><dd>A materialized grouped result</dd></div>
        <div><dt>Knowable now</dt><dd>The query executed successfully and returned three status groups</dd></div>
      </dl>
    </li>

    <li class="pp-book-trace__stage pp-book-trace__stage--runtime">
      <header>
        <img class="pp-book-trace__stage-icon" src="../../../../shared/icons/database-cog-outline.svg" alt="">
        <span class="pp-book-trace__number">03</span>
        <div><strong>Materialized summary</strong><small>Read the projected columns and ordered group values</small></div>
      </header>
      <div class="pp-book-trace__result">
        <dl>
          <div><dt>Columns</dt><dd><code>status</code>, <code>order_count</code>, <code>total_amount</code></dd></div>
          <div><dt>Rows</dt><dd>3 grouped statuses</dd></div>
          <div><dt>First group</dt><dd><code>paid</code> with total <code>209.75</code></dd></div>
        </dl>
        <div class="pp-book-trace__artifacts">
          <span><img src="../../../../shared/icons/table-check.svg" alt="">Grouped result</span>
          <span><img src="../../../../shared/icons/chart-timeline-variant.svg" alt="">Collected through Session</span>
        </div>
      </div>
    </li>
  </ol>

  <aside class="pp-book-receipt" aria-label="Grouped query receipt">
    <header><span>Query receipt</span><strong>The grain changed before rows moved</strong></header>
    <dl>
      <div><dt>Group key</dt><dd><code>.status</code></dd></div>
      <div><dt>Measures</dt><dd><code>count()</code> and <code>sum(.amount)</code></dd></div>
      <div><dt>Ordering</dt><dd>Descending by projected <code>.total_amount</code></dd></div>
      <div><dt>Execution</dt><dd>One explicit <code>Session.collect(...)</code> call</dd></div>
    </dl>
  </aside>
</section>

<div class="pp-book-output" markdown="1">

**Result you should see**

The preview formatting is backend-facing, but its ordered values should describe these three rows:

```text
status     order_count  total_amount
paid       2            209.75
pending    1             64.00
cancelled  1             42.75
```

</div>

The order is determined by the aggregate alias, not by the alphabetical spelling of `status`. Because `ORDER BY` appears after `SELECT`, it sees the projected schema and can resolve `.total_amount`; it does not reach backward into an unrelated outer variable.

<details class="pp-book-source">
  <summary>Open the complete Chapter 9 checkpoint</summary>
  <div markdown="1">

```incan
--8<-- "examples/tutorial_book/src/chapter_09.incn"
```

  </div>
</details>

Run it from `examples/tutorial_book`:

```bash
incan run src/chapter_09.incn
```

The checkpoint prints the resolved output columns, a row count of three, and the preview. That collection is the only execution call in the chapter; building the query block itself only appends checked relational intent to the lazy carrier.

For the complete clause inventory, expression rules, and resolution contract, use the [Query blocks reference](../../reference/query_blocks.md). The tutorial keeps this chapter focused on one grouped path rather than duplicating that catalog.

<section class="pp-book-exercise" markdown="1">

## Try it

After `SELECT`, add `WHERE .total_amount > 50` and run the checkpoint again. This is IncQL's post-projection filter: it uses the projected alias where SQL might use `HAVING`, leaving the `paid` and `pending` groups. Restore the checkpoint before continuing.

</section>

<section class="pp-book-complete" markdown="1">

## Part complete

You can explain how a query block changes row grain, why grouped fields and aggregate measures obey different selection rules, how projected aliases flow into later clauses, and when deferred query intent becomes a materialized result.

</section>

<nav class="pp-book-pagination" aria-label="Book chapter navigation">
  <a href="../08_first_query_block/"><small>Previous chapter</small><strong>← 8. Write your first query</strong></a>
  <a href="../"><small>Book overview</small><strong>Browse all Parts</strong></a>
</nav>

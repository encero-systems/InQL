# InQL RFC 019: Window functions

- **Status:** Implemented
- **Created:** 2026-04-27
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 003 (`query {}` blocks and relational authoring)
  - InQL RFC 012 (scalar expressions and aggregate measures)
  - InQL RFC 013 (function catalog program)
  - InQL RFC 014 (function registry and catalog governance)
  - InQL RFC 016 (core aggregate functions)
- **Issue:** [InQL #36](https://github.com/encero-systems/InQL/issues/36)
- **RFC PR:** [InQL #48](https://github.com/encero-systems/InQL/pull/48)
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** v0.1

## Summary

This RFC defines InQL window functions and window specifications: partitioning, ordering, frames, ranking functions, offset functions, and value functions. Window functions are explicitly not ordinary aggregates; they produce one value per input row while seeing a related set of rows defined by the window specification.

## Motivation

Analytic dataframe work needs ranking, lag/lead comparisons, running totals, and first/last value access. Spark and SQL systems expose these through window functions, and DataFusion distinguishes ordered-set and aggregate behavior from window behavior. InQL should preserve that distinction instead of modeling window functions as ordinary aggregates or scalar helpers.

Window functions also force a clearer relation between row-level expressions and group-level aggregates. A windowed `sum` may produce one value per row, but it still has aggregate-like input semantics within a window frame.

## Goals

- Define window specifications with partitioning, ordering, and frame bounds.
- Define required ranking, distribution, offset, and value window functions.
- Define how aggregate functions may be used over windows.
- Require explicit typing and diagnostics for invalid window usage.

## Non-Goals

- Defining streaming event-time windows, triggers, or watermarks.
- Defining aggregate modifiers except where they interact with windowed aggregate calls.
- Defining physical execution strategies.
- Defining every backend-specific window function.

## Guide-level explanation (how authors think about it)

Authors can rank rows within a partition using the builder surface:

```incan
from pub::inql.functions import col, current_row, desc, lag, rank, sum, unbounded_preceding, window

ranked = (
    orders
        .with_window_column("customer_rank", rank().over(window().partition_by([col("customer_id")]).order_by([desc(col("amount"))])))
        .with_window_column("previous_amount", lag(col("amount")).over(window().partition_by([col("customer_id")]).order_by([desc(col("amount"))])))
        .with_window_column(
            "running_amount",
            sum(col("amount")).over(
                window()
                    .partition_by([col("customer_id")])
                    .order_by([desc(col("amount"))])
                    .rows_between(unbounded_preceding(), current_row())
            ),
        )
)
```

The exact query-block syntax may evolve, but authors should understand that a window function returns a row-level value computed with access to nearby or related rows.

## Reference-level explanation (precise rules)

InQL must define a window specification containing partition expressions, ordering expressions, and an optional frame. Partition expressions and ordering expressions must be scalar expressions.

InQL must define ranking functions `row_number`, `rank`, `dense_rank`, `percent_rank`, `cume_dist`, and `ntile`. Ranking functions must require an ordering unless a function's registry entry explicitly permits unordered use.

InQL must define offset functions `lag` and `lead`. Offset functions must accept a scalar input expression, an optional positive integer offset, and an optional default value whose type is compatible with the input expression.

InQL must define value functions `first_value`, `last_value`, and `nth_value`. Value and offset calls support explicit `RESPECT NULLS` and `IGNORE NULLS` metadata through method modifiers on the unplaced window call.

Windowed aggregate calls may reuse aggregate functions over a window specification. They must still obey aggregate input type rules, but their result is a row-level value in the surrounding projection.

Window functions must not be valid in all scalar positions. They may appear only in projection-like positions or other positions explicitly allowed by a query RFC.

## Design details

### Syntax

This RFC permits method-like `.over(...)` forms and query-block `OVER (...)` forms if both lower to the same window function model. The v0.1 package surface exposes the method-like builder form; RFC 003 query blocks will target the same registry-backed `WindowFunctionApplication` and `WindowSpec` model when the query-block syntax surface lands.

### Semantics

Window frames may be row-based or range-based. Frame start and end must be explicit or derived from a documented default. Default frames must not vary silently by backend.

Ordering null placement must follow the ordering expression rules defined by the scalar function catalog.

### Interaction with other InQL surfaces

Query blocks may expose SQL-style window syntax. Dataframe methods may expose builder-style window specs. Both must use the same function registry entries and window specification semantics.

### Compatibility / migration

No current InQL function should be reclassified silently as a window function. Aggregate names reused in window contexts must be position-sensitive and diagnosable.

## Alternatives considered

- **Treat windows as aggregates.** Rejected because window functions produce one value per input row and have different position rules.
- **Delay window functions until streaming windows exist.** Rejected because analytic windows and streaming event-time windows are distinct concepts.
- **Expose only backend SQL strings for windows.** Rejected because it loses typed window specification checking.

## Drawbacks

- Window functions add a second non-scalar expression class alongside aggregate measures.
- Frame defaults and null treatment are subtle and can differ by backend.
- Planner and tooling support becomes more complex because function validity depends on expression position.

## Layers affected

- **InQL specification** — window functions must be distinguished from scalar and aggregate functions.
- **InQL library package** — public helpers should expose window function and window specification builders.
- **Incan compiler / InQL authoring surfaces** — checked call signatures and future query syntax must enforce window function placement, partition expressions, ordering expressions, and frame bounds.
- **Execution / interchange** — Prism and Substrait lowering must preserve window partitioning, ordering, frames, and function identity.
- **Documentation** — docs should clearly separate aggregate functions from window functions.

## Design Decisions

### Resolved

- The implemented package surface exposes explicit `with_window_column(...)` projection-like placement rather than accepting window functions in arbitrary scalar-expression positions.
- Ranking helpers require explicit `order_by(...)` in the window spec. InQL does not invent a silent default ordering.
- Distribution, offset, and value helpers use the same relation-aware placement model as ranking helpers.
- Aggregate helpers may be placed over windows through `AggregateMeasure.over(...)`; invalid aggregate modifier combinations are rejected before backend execution.
- Window specs use a documented whole-partition default row frame, and explicit `rows_between(...)` / `range_between(...)` calls preserve frame bounds through Substrait lowering.
- Window relation lowering uses `ConsistentPartitionWindowRel` with registry-backed function anchors, partition/order expressions, frame bounds, invocation metadata, null-treatment options, and output aliases.
- The DataFusion session adapter executes the portable window helper surface through the Substrait adapter boundary.

### Remaining

- Query-block `OVER (...)` syntax belongs to RFC 003 and should lower to the implemented window model instead of defining separate semantics.

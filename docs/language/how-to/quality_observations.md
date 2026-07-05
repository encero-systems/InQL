# Observe data quality checks

This how-to shows how to declare quality assertions and evaluate them through a `Session`. Quality checks produce observations; they do not filter the relation, quarantine rows, or stop a pipeline unless a caller decides to enforce the observation afterwards.

## Declare checks

Use assertion helpers to describe the checks you want to observe. The first quality surface covers relation row counts, field null rates, field uniqueness, per-group row counts, and explicit cross-relation row-count equality.

```incan
from pub::inql import QualityAssertionSeverity, col, group_row_count, null_rate, row_count, unique

checks = [
    row_count(min_count=Some(1), max_count=Some(1000000)).require(),
    null_rate(col("customer_id"), max_rate=0.0).with_severity(QualityAssertionSeverity.Error),
    unique(col("order_id")).require(),
    group_row_count([col("region")], min_count=1, max_count=Some(10000)).quarantine(),
]
```

The helper options are deliberately small:

- `row_count(min_count=None, max_count=None)` checks the materialized relation row count against optional inclusive bounds.
- `null_rate(field, max_rate)` checks that the proportion of nulls in a field expression is at most `max_rate`.
- `unique(field)` checks that no field value creates a duplicate group.
- `group_row_count(group_by, min_count=1, max_count=None)` checks every group against inclusive count bounds.
- `cross_relation_row_count_equal()` checks two explicit relation inputs through `observe_quality_pair(...)`.

Use `.require()`, `.quarantine()`, `.with_mode(...)`, or `.with_severity(...)` when a caller needs to record intended handling. Session observation still reports evidence rather than enforcing policy. For example, a failed required check returns a `Failed` observation; it does not throw merely because the assertion mode is `Require`.

## Prepare the relation

There is no quality-specific vocab clause in this slice. Quality assertions are ordinary Incan helper values. The useful vocab sugar is the existing `query { ... }` block for shaping the relation before you observe it.

```incan
from pub::inql import LazyFrame, Session, col, group_row_count, null_rate, row_count, unique
from models import Order

session = Session.default()
orders: LazyFrame[Order] = session.read_csv("orders", "orders.csv")?

paid_orders = query {
    FROM orders
    WHERE .status == "paid"
    SELECT
        .order_id as order_id,
        .customer_id as customer_id,
        .region as region,
        .amount as amount
}

checks = [
    row_count(min_count=Some(1)),
    null_rate(col("customer_id"), max_rate=0.0),
    unique(col("order_id")),
    group_row_count([col("region")], min_count=1, max_count=Some(10000)),
]

observations = session.observe_quality(paid_orders, checks)
```

Inside `query { ... }`, leading-dot field references such as `.status` and `.order_id` use query-block resolution. In the assertion declarations, use ordinary InQL expressions such as `col("customer_id")` because those declarations are normal Incan code, not query clauses.

## Read the output

`session.observe_quality(...)` returns one `QualityObservation` per assertion. The important fields for most callers are the assertion name, status, metrics, diagnostics, and execution observation IDs.

```incan
from pub::inql import QualityObservationStatus

for observation in observations:
    println(f"{observation.assertion.name}: {observation.status.value()}")

    for metric in observation.metrics:
        println(f"  {metric.name}={metric.value} {metric.unit}")

    for execution_id in observation.execution_observation_ids:
        println(f"  execution={execution_id}")

    match observation.status:
        QualityObservationStatus.Passed => pass
        QualityObservationStatus.Failed => println("  quality check failed")
        QualityObservationStatus.Errored => println(observation.diagnostics[0].message)
        QualityObservationStatus.Skipped => println("  quality check skipped")
        QualityObservationStatus.Unsupported => println(observation.diagnostics[0].message)
```

A compact rendering of a mixed result set might look like this. This is an example presentation, not a fixed InQL CLI output format.

```text
row_count: passed
  row_count=42 count
  execution=execution:collect:...

null_rate:customer_id: passed
  row_count=42 count
  null_count=0 count
  null_rate=0.0 ratio
  execution=execution:collect:...
  execution=execution:collect:...

unique:order_id: failed
  duplicate_group_count=1 count
  execution=execution:collect:...

group_row_count:region: passed
  failing_group_count=0 count
  execution=execution:collect:...
  execution=execution:collect:...
```

`Passed` and `Failed` mean the assertion predicate was evaluated and returned true or false. `Errored` means the relation work needed to compute the check failed, so diagnostics carry the execution failure. `Unsupported` means the declaration/API combination is not valid for that call, such as passing a cross-relation assertion to `observe_quality(...)`. `Skipped` is part of the shared status vocabulary for callers or future evaluators that intentionally bypass a check; the session helpers in this slice do not use it for ordinary failed checks.

## Observe two explicit relations

Use `session.observe_quality_pair(...)` for cross-relation assertions. The first release includes row-count equality.

```incan
from pub::inql import cross_relation_row_count_equal
from models import SourceOrder, TargetOrder

source_orders: LazyFrame[SourceOrder] = session.read_csv("source_orders", "source_orders.csv")?
target_orders: LazyFrame[TargetOrder] = session.read_csv("target_orders", "target_orders.csv")?

cross_observations = session.observe_quality_pair(
    source_orders,
    target_orders,
    [cross_relation_row_count_equal().require()],
)
```

Cross-relation observations reference both execution attempts and expose `left_row_count` and `right_row_count` metrics. Passing a cross-relation assertion to `observe_quality(...)` returns an `Unsupported` observation with a diagnostic rather than treating the assertion as passed.

## Choose the right check

- Use `row_count(...)` when the relation itself must have an expected size.
- Use `null_rate(...)` when a field may tolerate a bounded proportion of nulls.
- Use `unique(...)` when duplicate field values should fail the check.
- Use `group_row_count(...)` when every group must stay within count thresholds.
- Use `cross_relation_row_count_equal()` when two explicit relation inputs should have equal row counts.

For the complete record and enum reference, see [Quality assertions and observations (Reference)](../reference/quality.md).

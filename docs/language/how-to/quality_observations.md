# Observe data quality checks

This how-to shows how to declare quality assertions and evaluate them through a `Session`. Quality checks produce observations; they do not filter the relation unless you separately apply a filter.

## Declare checks

Use assertion helpers to describe the checks you want to observe.

```incan
from pub::inql import group_row_count, null_rate, row_count, unique
from pub::inql.functions import col

checks = [
    row_count(min_count=Some(1)),
    null_rate(col("customer_id"), 0.0),
    unique(col("order_id")),
    group_row_count([col("region")], 1, Some(10000)),
]
```

Use `.require()` or `.quarantine()` when a caller needs to record intended handling. Session observation still reports evidence rather than enforcing policy.

```incan
required_checks = [
    row_count(min_count=Some(1)).require(),
    unique(col("order_id")).require(),
]
```

## Observe one relation

Evaluate relation, field, and group checks with `session.observe_quality(...)`.

```incan
from pub::inql import LazyFrame, QualityObservationStatus, Session
from models import Order

session = Session.default()
orders: LazyFrame[Order] = session.read_csv("orders", "orders.csv")?

observations = session.observe_quality(orders, checks)

for observation in observations:
    match observation.status:
        QualityObservationStatus.Passed => pass
        QualityObservationStatus.Failed => println(f"failed: {observation.assertion.name}")
        QualityObservationStatus.Errored => println(observation.diagnostics[0].message)
        QualityObservationStatus.Skipped => println(f"skipped: {observation.assertion.name}")
        QualityObservationStatus.Unsupported => println(observation.diagnostics[0].message)
```

Each observation includes metric records and references to the execution attempts used to compute it.

```incan
for metric in observations[0].metrics:
    println(f"{metric.name}={metric.value} {metric.unit}")

for execution_id in observations[0].execution_observation_ids:
    println(execution_id)
```

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

Cross-relation observations reference both execution attempts. Passing a cross-relation assertion to `observe_quality(...)` returns an `Unsupported` observation with a diagnostic rather than treating the assertion as passed.

## Choose the right check

- Use `row_count(...)` when the relation itself must have an expected size.
- Use `null_rate(...)` when a field may tolerate a bounded proportion of nulls.
- Use `unique(...)` when duplicate field values should fail the check.
- Use `group_row_count(...)` when every group must stay within count thresholds.
- Use `cross_relation_row_count_equal()` when two explicit relation inputs should have equal row counts.

For the complete record and enum reference, see [Quality assertions and observations (Reference)](../reference/quality.md).

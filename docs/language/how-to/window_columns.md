# Add window columns

This how-to shows how to add relation-aware window outputs to a deferred carrier.

Window helpers produce one output value per input row while reading related rows from a partition. Place them with `with_window_column(...)`.

## Rank and compare rows inside a partition

Build a window spec, call `.over(spec)` on each window helper, and attach the resulting applications as named columns.

```incan
from pub::inql import LazyFrame
from pub::inql.functions import col, current_row, desc, lag, rank, sum, unbounded_preceding, window
from models import Order

def ranked_orders(orders: LazyFrame[Order]) -> LazyFrame[Order]:
    spec = window().partition_by([col("customer_id")]).order_by([desc(col("amount"))])
    return (
        orders
            .with_window_column("customer_rank", rank().over(spec))
            .with_window_column("previous_amount", lag(col("amount")).over(spec))
            .with_window_column(
                "running_amount",
                sum(col("amount")).over(spec.rows_between(unbounded_preceding(), current_row())),
            )
    )
```

Ranking, distribution, offset, and value helpers require explicit ordering. For exact helper contracts, see [Window functions](../reference/functions/windows.md).

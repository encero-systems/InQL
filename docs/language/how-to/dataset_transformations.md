# Build deferred dataset transformations

This how-to shows how to combine common carrier methods while keeping work deferred until a Session executes it.

## Add computed columns

Use `with_column(...)` to append a new computed column or replace an existing column by name.

```incan
from pub::inql import LazyFrame
from pub::inql.functions import add, col, mul
from models import Order

def enrich(orders: LazyFrame[Order]) -> LazyFrame[Order]:
    return (
        orders
            .with_column("amount_x2", mul(col("amount"), 2))
            .with_column("amount_plus_one", add(col("amount"), 1))
    )
```

## Filter, group, and aggregate

Use scalar helpers for row predicates and aggregate helpers for grouped measures.

```incan
from pub::inql import LazyFrame
from pub::inql.functions import avg, col, count, eq, sum
from models import Order

def paid_spend_by_customer(orders: LazyFrame[Order]) -> LazyFrame[Order]:
    return (
        orders
            .filter(eq(col("status"), "paid"))
            .group_by([col("customer_id")])
            .agg([
                sum(col("amount")),
                avg(col("amount")),
                count(),
            ])
    )
```

## Sort and limit

Use ordering helpers inside `order_by(...)`, then cap rows with `limit(...)`.

```incan
from pub::inql.functions import col, desc

top_orders = (
    orders
        .order_by([desc(col("amount"))])
        .limit(10)
)
```

These transforms stay deferred for `LazyFrame[T]`. Use a `Session` to execute, collect, or write the result. For exact method signatures and schema behavior, see [Dataset methods (Reference)](../reference/dataset_methods.md).

# Work with nested row values

This how-to shows how to create and inspect nested scalar values without changing relation cardinality.

Use nested scalar helpers when each input row should remain one output row. Use generator helpers such as `explode(...)` only when an array or struct should reshape the relation.

## Add array-derived columns

Build arrays with `array(...)`, then inspect them with row-level helpers such as `cardinality(...)`, `array_contains(...)`, and `element_at(...)`.

```incan
from pub::incql.functions import array, array_contains, cardinality, col, element_at, lit

projected = (
    events
        .with_column("tags", array([lit("paid"), col("source")]))
        .with_column("tag_count", cardinality(col("tags")))
        .with_column("has_paid_tag", array_contains(col("tags"), "paid"))
        .with_column("first_tag", element_at(col("tags"), 1))
)
```

`element_at(...)`, `array_position(...)`, and `array_slice(...)` use one-based array positions. For exact helper contracts, see [Nested data functions](../reference/functions/nested.md).

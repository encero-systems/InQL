# Expand rows with generators

This how-to shows how to use generator helpers when nested values should reshape a relation.

Generators return `GeneratorApplication` values. Apply them through `generate(...)` so the relation keeps its input columns and appends the generated output aliases.

## Explode array values

Use `explode(...)` when each array element should become a generated row.

```incan
from pub::inql import LazyFrame
from pub::inql.functions import col, explode
from models import Order

def order_lines(orders: LazyFrame[Order]) -> LazyFrame[Order]:
    return orders.generate(explode(col("line_items"), "line_item"))
```

## Inline struct arrays

Use `inline(...)` when the generated rows should expose one output column per struct field.

```incan
from pub::inql import LazyFrame
from pub::inql.functions import array, inline, lit, named_struct
from models import Order

def fixed_items(orders: LazyFrame[Order]) -> LazyFrame[Order]:
    rows = array([
        named_struct(["sku", "quantity"], [lit("A"), lit(1)]),
        named_struct(["sku", "quantity"], [lit("B"), lit(2)]),
    ])
    return orders.generate(inline(rows, ["sku", "quantity"]))
```

For the full generator catalog and alias rules, see [Generator and table-valued functions](../reference/functions/generators.md).

# Generator and Table-Valued Functions (Reference)

Generators are relation-shaping operations. They are registry-backed like scalar and aggregate helpers, but they return `GeneratorApplication` values and must be applied through a relation method such as `generate(...)`.

The explicit generator surface currently includes:

| Function | Output aliases | Relation effect |
| --- | --- | --- |
| `explode(expr, as_)` | one value column | Emits one row per array element; null or empty inputs emit zero rows. |
| `explode_outer(expr, as_)` | one value column | Preserves the input row for null or empty inputs and emits a null generated value. |
| `posexplode(expr, position_as, value_as)` | position and value columns | Emits one row per array element with a zero-based position column. |
| `posexplode_outer(expr, position_as, value_as)` | position and value columns | Outer positional explode with the same zero-based position rule. |
| `inline(expr, output_columns)` | one column per struct field | Expands array-of-struct values into generated rows and declared output columns. |
| `inline_outer(expr, output_columns)` | one column per struct field | Outer inline with the same null/empty row preservation rule. |
| `flatten(expr, as_)` | one value column | Portable table-valued flatten for one array expression. |
| `stack(row_count, values, output_columns)` | declared output columns | Emits `row_count` generated rows from row-major scalar values. |

Generator applications preserve input columns and append generated columns in declaration order. Generated aliases are required, must be non-empty, and must not collide with existing input columns.

Nested scalar helpers such as `array_flatten(...)` remain scalar expressions. They do not expand rows and are documented on the [nested data functions](nested.md) page. The relation-shaping `flatten(...)` helper is intentionally separate.

For task-oriented usage, see [Expand rows with generators](../../how-to/generator_rows.md).

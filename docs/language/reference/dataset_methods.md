# Dataset methods (Reference)

This page documents the current carrier method surface. Builder-function details live under `reference/builders/`.

## Carrier method surface

| Method               | Signature                                                                       | Returns          | Contract |
| -------------------- | ------------------------------------------------------------------------------- | ---------------- | -------- |
| `filter`             | `def filter(self, predicate: ColumnExpr) -> Self`                               | Same carrier     | Restrict rows by one boolean scalar expression. |
| `join`               | `def join(self, other: Self, on: ColumnExpr, relation_name: str = "") -> Self`  | Same carrier     | Inner join with another same-carrier relation using a scalar predicate. |
| `left_join`          | `def left_join(self, other: Self, on: ColumnExpr, relation_name: str = "") -> Self` | Same carrier | Left join with another same-carrier relation using a scalar predicate. |
| `select`             | `def select[U](self, assignments: list[ProjectionAssignment] = []) -> SameCarrier[U]` | Same carrier kind with row type `U` | Project an output row shape while preserving carrier kind. |
| `with_column`        | `def with_column(self, name: str, expr: ColumnExpr) -> Self`                   | Same carrier     | Add or replace one projected column. |
| `group_by`           | `def group_by(self, columns: list[ColumnExpr]) -> Self`                        | Same carrier     | Define grouping keys for a following aggregate. |
| `agg`                | `def agg(self, measures: list[AggregateMeasure]) -> Self`                      | Same carrier     | Apply aggregate measures over the current relation or current grouping. |
| `generate`           | `def generate(self, generator: GeneratorApplication) -> Self`                  | Same carrier     | Apply a relation-shaping generator with explicit output aliases. |
| `with_window_column` | `def with_window_column(self, name: str, application: WindowFunctionApplication) -> Self` | Same carrier | Add or replace one projected column using a placed window function. |
| `order_by`           | `def order_by(self, columns: list[ColumnExpr]) -> Self`                        | Same carrier     | Sort rows by scalar expressions or ordering helpers. |
| `limit`              | `def limit(self, n: int) -> Self`                                              | Same carrier     | Cap row count. |
| `to_substrait_plan`  | `def to_substrait_plan(self) -> Plan`                                          | `Plan`           | Lower the carrier to a Substrait plan or raise on invalid lowering. |
| `try_to_substrait_plan` | `def try_to_substrait_plan(self) -> Result[Plan, SubstraitLoweringError]`   | `Result[Plan, SubstraitLoweringError]` | Lower the carrier to a Substrait plan through a structured error envelope. |

`SameCarrier[U]` means `DataFrame[U]` for `DataFrame[T]`, `LazyFrame[U]` for `LazyFrame[T]`, and `DataStream[U]` for `DataStream[T]`. The root `DataSet[T]` trait remains the common plan/schema contract; schema-changing projection is expressed on concrete carriers until Incan grows native trait type-family support.

## Method semantics

| Method               | Schema behavior |
| -------------------- | --------------- |
| `filter`             | Preserves input columns. |
| `join`               | Combines left and right output columns using the current join output-column contract. |
| `left_join`          | Combines left and right output columns using the current left-join output-column contract. |
| `select`             | Identity `select()` preserves the current planned columns; explicit assignments replace the output schema with assignment names. |
| `with_column`        | Appends a missing name at the end; replaces an existing name in place while preserving ordinal position. |
| `group_by`           | Produces grouped relation state; grouped output columns are finalized by `agg(...)`. |
| `agg`                | Emits grouping keys plus aggregate measure outputs for grouped input, or aggregate measure outputs for global input. |
| `generate`           | Preserves all input columns and appends generated output aliases. Alias collisions are rejected during planning or lowering. |
| `with_window_column` | Appends or replaces the named output column using the same add-or-replace projection semantics as `with_column(...)`. |
| `order_by`           | Preserves input columns. |
| `limit`              | Preserves input columns. |

## Carrier-specific notes

| Carrier        | Notes |
| -------------- | ----- |
| `LazyFrame[T]` | Prism-backed deferred carrier. Transform methods append Prism nodes and preserve immutable branching. |
| `DataFrame[T]` | Materialized local carrier. Transform methods invalidate stale materialization and rebuild from the stored relation tree. |
| `DataStream[T]` | Streaming carrier surface is present in the type hierarchy; streaming-specific execution semantics remain future work. |

## Expression inputs

- Row-level methods that accept `ColumnExpr` use the shared scalar-expression model documented under [Filter builders](builders/filters.md), [Projection builders](builders/projections.md), and [Functions](functions/index.md).
- Aggregate methods use `AggregateMeasure` values from [Aggregate builders](builders/aggregates.md).
- `order_by(...)` accepts scalar expressions and ordering helpers such as `asc(...)`, `desc(...)`, `asc_nulls_first(...)`, and `desc_nulls_last(...)`.
- `generate(...)` accepts generator applications from [Generator and table-valued functions](functions/generators.md).
- `with_window_column(...)` accepts placed window function applications from [Window functions](functions/windows.md).

## Capability notes

- `join(...)` and `left_join(...)` are constrained to same-carrier inputs and the `ColumnExpr` predicate surface shown in the signature.
- Query-block and scoped DSL surfaces lower into these carrier methods rather than defining separate method semantics.
- For task-oriented examples, see [Build deferred dataset transformations](../how-to/dataset_transformations.md).

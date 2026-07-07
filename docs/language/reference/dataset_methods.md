# Dataset methods (Reference)

This page documents the current carrier method surface. Builder-function details live under `reference/builders/`.

## Carrier method surface

Methods marked **all root carriers** are available through the root `DataSet[T]` contract and concrete `DataFrame[T]`, `LazyFrame[T]`, and `DataStream[T]` values. Methods marked **all concrete carriers** are available on all three concrete carrier classes, but not yet through the root trait because Incan does not have native trait type-family support for schema-changing returns. Methods marked **bounded only** are available through `BoundedDataSet[T]`, `DataFrame[T]`, and `LazyFrame[T]`; direct `DataStream[T]` calls are intentionally rejected because they require finite input or end-of-input semantics.

| Method                  | Availability | Signature                                                                       | Returns          | Contract |
| ----------------------- | ------------ | ------------------------------------------------------------------------------- | ---------------- | -------- |
| `filter`                | All root carriers | `def filter(self, predicate: ColumnExpr) -> Self`                               | Same carrier     | Restrict rows by one boolean scalar expression. |
| `where`                 | All root carriers | `def where(self, predicate: ColumnExpr) -> Self`                                | Same carrier     | Pandas/Spark-familiar alias for `filter`. |
| `join`                  | All root carriers | `def join(self, other: Self, on: ColumnExpr, relation_name: str = "") -> Self`  | Same carrier     | Inner join with another same-carrier relation using a scalar predicate. |
| `left_join`             | All root carriers | `def left_join(self, other: Self, on: ColumnExpr, relation_name: str = "") -> Self` | Same carrier | Left join with another same-carrier relation using a scalar predicate. |
| `select`                | All concrete carriers | `def select[U](self, assignments: list[ProjectionAssignment] = []) -> SameCarrier[U]` | Same carrier kind with row type `U` | Project an output row shape while preserving carrier kind. |
| `with_column`           | All root carriers | `def with_column(self, name: str, expr: ColumnExpr) -> Self`                   | Same carrier     | Add or replace one projected column. |
| `assign`                | All root carriers | `def assign(self, name: str, expr: ColumnExpr) -> Self`                         | Same carrier     | Pandas-familiar alias for `with_column`. |
| `withColumn`            | All concrete carriers | Method alias for `assign` on concrete carriers                                  | Same carrier     | Spark-familiar compatibility spelling for `assign`. |
| `generate`              | All root carriers | `def generate(self, generator: GeneratorApplication) -> Self`                  | Same carrier     | Apply a relation-shaping generator with explicit output aliases. |
| `with_window_column`    | All root carriers | `def with_window_column(self, name: str, application: WindowFunctionApplication) -> Self` | Same carrier | Add or replace one projected column using a placed window function. |
| `to_substrait_plan`     | All root carriers | `def to_substrait_plan(self) -> Plan`                                          | `Plan`           | Lower the carrier to a Substrait plan or raise on invalid lowering. |
| `try_to_substrait_plan` | All root carriers | `def try_to_substrait_plan(self) -> Result[Plan, SubstraitLoweringError]`      | `Result[Plan, SubstraitLoweringError]` | Lower the carrier to a Substrait plan through a structured error envelope. |
| `group_by`              | Bounded only | `def group_by(self, columns: list[ColumnExpr]) -> Self`                        | Same carrier     | Define grouping keys for a following aggregate. |
| `groupby`               | Bounded only | `def groupby(self, columns: list[ColumnSelector]) -> Self`                     | Same carrier     | Pandas-familiar alias for `group_by`; string selectors become `col(name)`. |
| `groupBy`               | Bounded only | Method alias for `groupby` on concrete bounded carriers                        | Same carrier     | Spark-familiar compatibility spelling for `groupby`. |
| `agg`                   | Bounded only | `def agg(self, measures: list[AggregateMeasure]) -> Self`                      | Same carrier     | Apply aggregate measures over the current relation or current grouping. |
| `order_by`              | Bounded only | `def order_by(self, columns: list[ColumnExpr]) -> Self`                        | Same carrier     | Sort rows by scalar expressions or ordering helpers. |
| `sort_values`           | Bounded only | `def sort_values(self, by: ColumnSelector, ascending: bool = true) -> Self`    | Same carrier     | Pandas-familiar one-key sort; string selectors become `col(name)`. |
| `orderBy`               | Bounded only | Method alias for `order_by` on concrete bounded carriers                       | Same carrier     | Spark-familiar compatibility spelling for canonical `order_by`. |
| `limit`                 | Bounded only | `def limit(self, n: int) -> Self`                                              | Same carrier     | Cap row count. |
| `head`                  | Bounded only | `def head(self, n: int) -> Self`                                               | Same carrier     | Pandas/Spark-familiar alias for `limit`. |

`SameCarrier[U]` means `DataFrame[U]` for `DataFrame[T]`, `LazyFrame[U]` for `LazyFrame[T]`, and `DataStream[U]` for `DataStream[T]`. The root `DataSet[T]` trait remains the common plan/schema contract; schema-changing projection is expressed on concrete carriers until Incan grows native trait type-family support.

## Method semantics

| Method               | Schema behavior |
| -------------------- | --------------- |
| `filter`             | Preserves input columns. |
| `where`              | Same as `filter`. |
| `join`               | Combines left and right output columns using the current join output-column contract. |
| `left_join`          | Combines left and right output columns using the current left-join output-column contract. |
| `select`             | Identity `select()` preserves the current planned columns; explicit assignments replace the output schema with assignment names. |
| `with_column`        | Appends a missing name at the end; replaces an existing name in place while preserving ordinal position. |
| `assign`             | Same as `with_column`. |
| `withColumn`         | Same as `assign`. |
| `group_by`           | Produces grouped relation state; grouped output columns are finalized by `agg(...)`. |
| `groupby`            | Same as `group_by`, after normalizing each `ColumnSelector` to `ColumnExpr`. |
| `groupBy`            | Same as `groupby`. |
| `agg`                | Emits grouping keys plus aggregate measure outputs for grouped input, or aggregate measure outputs for global input. |
| `generate`           | Preserves all input columns and appends generated output aliases. Alias collisions are rejected during planning or lowering. |
| `with_window_column` | Appends or replaces the named output column using the same add-or-replace projection semantics as `with_column(...)`. |
| `order_by`           | Preserves input columns. |
| `sort_values`        | Same as `order_by` for one selector. The `ascending=false` argument wraps the selector with `desc(...)`; the default wraps with `asc(...)`. |
| `orderBy`            | Same as `order_by`. |
| `limit`              | Preserves input columns. |
| `head`               | Same as `limit`. |

## Carrier-specific notes

| Carrier        | Notes |
| -------------- | ----- |
| `LazyFrame[T]` | Prism-backed deferred carrier. Transform methods append Prism nodes and preserve immutable branching. |
| `DataFrame[T]` | Materialized local carrier. Transform methods invalidate stale materialization and rebuild from the stored relation tree. |
| `DataStream[T]` | Streaming carrier surface is present in the type hierarchy. Row-local transforms are available; global grouping, global ordering, and finite row limiting are intentionally absent from the concrete stream API. |

## Expression inputs

- Row-level methods that accept `ColumnExpr` use the shared scalar-expression model documented under [Filter builders](builders/filters.md), [Projection builders](builders/projections.md), and [Functions](functions/index.md).
- `ColumnSelector` is `Union[str, ColumnExpr]`. Familiar exploration methods use it only where a string naturally means a column name. The string `"amount"` becomes `col("amount")`, while an explicit scalar expression is passed through unchanged.
- Aggregate methods use `AggregateMeasure` values from [Aggregate builders](builders/aggregates.md).
- `order_by(...)` accepts scalar expressions and ordering helpers such as `asc(...)`, `desc(...)`, `asc_nulls_first(...)`, and `desc_nulls_last(...)`.
- `sort_values(...)` accepts one `ColumnSelector` plus one shared direction flag. Use `order_by(...)` or `orderBy(...)` when each key needs its own explicit ordering helper.
- `generate(...)` accepts generator applications from [Generator and table-valued functions](functions/generators.md).
- `with_window_column(...)` accepts placed window function applications from [Window functions](functions/windows.md).

## Familiar exploration aliases

The familiar aliases are API aliases over the same InQL carrier operations; they do not introduce pandas mutable frames, eager Series values, row-position indexes, or Spark engine semantics. For bounded carriers, `orders.where(predicate).head(10)` builds the same logical filter and fetch plan as `orders.filter(predicate).limit(10)`, and `orders.groupby(["region"]).agg([...])` builds the same grouping relation as `orders.group_by([col("region")]).agg([...])`. For `DataStream[T]`, use row-local aliases such as `where(...)`, `assign(...)`, and `withColumn(...)`; bounded-only aliases remain unavailable for the same reason their canonical operations are unavailable.

Bracket syntax such as `orders["amount"]`, `orders[["id", "amount"]]`, and `orders[predicate]` is specified by RFC 039, but it is not implemented in this package slice because generic carrier support depends on Incan issue [#815][incan-815]. Until that compiler issue is fixed, use `col("amount")`, `select(...)`, and `filter(...)` or the aliases above.

## Capability notes

- `join(...)` and `left_join(...)` are constrained to same-carrier inputs and the `ColumnExpr` predicate surface shown in the signature.
- Query-block and scoped DSL surfaces lower into these carrier methods rather than defining separate method semantics.
- Incan issue [#817][incan-817] currently prevents InQL from fully enforcing the most-restrictive rule for values typed as the root `DataSet[T]`; direct `DataStream[T]` calls are gated by the current library surface.
- For task-oriented examples, see [Build deferred dataset transformations](../how-to/dataset_transformations.md).

[incan-815]: https://github.com/encero-systems/incan/issues/815
[incan-817]: https://github.com/encero-systems/incan/issues/817

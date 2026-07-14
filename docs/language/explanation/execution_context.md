# Execution context (Explanation)

This page explains how to think about IncQL's execution model as it works today.

## The mental model

There are two distinct phases:

1. Build deferred relational work in `LazyFrame[T]`
2. Ask a `Session` to bind and run that work

`LazyFrame[T]` is not local data in hand. It is deferred relational intent. `DataFrame[T]` is local materialized data.

## Why `Session` exists

`Session` owns the parts that are not just logical plan shape:

- source registration
- logical-name to physical-source binding
- backend execution
- materialization
- writing to sinks

That keeps the carrier model clean. A `LazyFrame[T]` describes work. A `Session` makes that work run.

## `execute` vs `collect`

These two APIs are related but not interchangeable.

### `session.execute(...)`

Use `execute(...)` when you want an execution checkpoint:

- the plan binds successfully
- lowering succeeds
- the backend can run it

It returns `LazyFrame[T]` again because the point is validation and execution success, not local materialization.

### `session.collect(...)`

Use `collect(...)` when you want local data:

- it runs the same backend path
- it materializes a `DataFrame[T]`
- it records structured materialization metadata such as resolved columns and row count
- it may also retain preview text for display/debugging

This is the boundary where deferred relational work becomes local data in hand.

## Why active session exists

Some convenience APIs are nicer when they do not force the session parameter through every call site. `lazy.collect()` is one of those cases.

That convenience needs a real execution context underneath, so it resolves through the active session at call time.

- `session.activate()` sets the current active session
- `lazy.collect()` uses that active session

If there is no active session, the convenience API fails clearly instead of pretending execution context can be ambient without definition.

## Writing is Session-owned

`session.write_csv(...)` and `session.write_parquet(...)` remain explicit Session methods because writing is not just a carrier concern. It requires binding, execution, and sink ownership.

The ergonomic split is:

- convenience materialization: `lazy.collect()`
- explicit writes: `session.write_csv(...)`, `session.write_parquet(...)`

This keeps materialization convenient while leaving sink ownership explicit at the session boundary.

## Runtime evidence is separate from plan evidence

Plan inspection explains the relational work IncQL has authored. Execution observations explain a concrete runtime attempt to run that work through a Session and backend adapter.

That split matters because the same plan can be attempted more than once, with different backends, bindings, diagnostics, timings, or trace IDs. The plan target remains the semantic anchor. The execution attempt target records what happened in one runtime lifecycle event.

Observed Session methods keep this separation explicit:

- `execute_observed(...)` records an execution checkpoint without local materialization.
- `collect_observed(...)` records a materialization attempt and can include row count evidence.
- `write_observed(...)` records a sink-write attempt.

The compact `execute(...)`, `collect(...)`, and `write(...)` methods still return `Result[...]` values for application code that does not need an evidence record.

## Adapter coverage is explicit evidence

Adapter coverage answers a different question from execution success. Execution success says the selected backend accepted and ran a plan attempt. Coverage says whether the selected adapter is known to provide a named capability or guarantee.

Coverage can come from two places. Tools can pass explicit `AdapterRequirement` records to `session.check_coverage(...)` when the requirement comes from policy, governance, or another caller-owned contract. For requirements that are visible in local plan evidence, `inspect_plan(...)` records inferred requirements and `session.check_inspection_coverage(...)` or `session.check_plan_coverage(...)` evaluates them against the selected adapter.

Inferred requirements are intentionally evidence-backed. IncQL infers concrete plan needs such as row filters, ordered execution, extension functions, variant semantics, baseline null semantics, and lineage-preservation evidence; it does not fabricate policy requirements such as masking, audit emission, region binding, or cryptographic proofs when no inspected evidence asks for them. Unknown coverage is therefore not a soft success; it means IncQL does not have evidence that the adapter enforces that capability.

## Typical flow

```incan
from pub::incql import LazyFrame, Session
from pub::incql.functions import col, gt, lit, mul
from models import Order

session = Session.default()

orders: LazyFrame[Order] = session.read_csv("orders", "orders.csv")?
enriched = orders.with_column("amount_x2", mul(col("amount"), 2))
filtered = enriched.filter(gt(col("amount"), 100)).limit(10)

session.activate()
preview = filtered.collect()?
session.write_csv(filtered, "orders_out.csv")?
```

This pattern is intentionally simple:

- read returns deferred work
- projection/filter/aggregate transforms stay declarative
- transforms stay deferred
- collect materializes when needed
- writes remain explicit on the session

For the exact method surface, see [Dataset methods (Reference)](../reference/dataset_methods.md).

## Materialized carrier shape

`DataFrame[T]` is the materialized carrier. The important semantic distinction is:

- `LazyFrame[T]` = deferred
- `DataFrame[T]` = local materialized

The materialized carrier exposes structured collection metadata:

- resolved columns
- row count
- preview text

For exact API shape, see [Execution context (Reference)](../reference/execution_context.md).

For a task-oriented workflow, see [Capture execution observations and adapter coverage](../how-to/execution_observations.md).

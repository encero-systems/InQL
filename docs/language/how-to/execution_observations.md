# Capture execution observations and adapter coverage

This how-to shows how to collect runtime evidence for a Session operation and how to ask the selected adapter whether it covers plan-inferred or caller-provided requirements.

Use the observed Session methods when you need an auditable execution attempt record. Use `check_coverage(...)` when a tool, policy, or review step already knows which adapter capability needs to be checked.

## Collect with an observation

Use `collect_observed(...)` when you need materialized data and execution evidence from the same attempt.

```incan
from pub::incql import ExecutionObservationStatus, LazyFrame, Session
from models import Order

session = Session.default()
orders: LazyFrame[Order] = session.read_csv("orders", "orders.csv")?

observed = session.collect_observed(orders)

match observed.data:
    Some(df) =>
        println(df.preview_text())
        println(f"rows={df.row_count()}")
    None =>
        println(observed.observation.diagnostics[0].message)

assert observed.observation.status == ExecutionObservationStatus.Success
```

The observed result always includes `observation`. On success, `data` contains the materialized `DataFrame[T]`. On failure, `data` is `None` and `error` contains the `SessionError`.

## Validate execution without materializing

Use `execute_observed(...)` when you want the same execution checkpoint as `execute(...)` but still need an observation record.

```incan
observed = session.execute_observed(orders)

match observed.error:
    Some(err) => println(err.error_message())
    None => println(observed.observation.observation_id)
```

`execute_observed(...)` returns the deferred `LazyFrame[T]` on success. It does not invent a row count because it does not materialize local rows.

## Write with an observation

Use `write_observed(...)` when the write itself is the operation you want to audit.

```incan
from pub::incql import csv_sink

write_attempt = session.write_observed(orders, csv_sink("target/orders.csv"))

match write_attempt.error:
    Some(err) => println(err.error_message())
    None => println(write_attempt.observation.observation_id)
```

The write result has no `data` field. The output artifact is the sink side effect; the returned value carries the observation and optional error.

## Check inferred adapter requirements

Use `check_plan_coverage(...)` when you want IncQL to inspect a lazy plan and evaluate the adapter requirements that are visible in that plan evidence.

```incan
from pub::incql import AdapterCoverageState
from pub::incql.functions import col, desc, eq

review = orders
    .filter(eq(col("status"), "paid"))
    .order_by([desc(col("amount"))])

coverage = session.check_plan_coverage(review)

for record in coverage:
    match record.state:
        AdapterCoverageState.Covered => pass
        AdapterCoverageState.PartiallyCovered => println(record.diagnostics[0].message)
        AdapterCoverageState.Uncovered => println(record.diagnostics[0].message)
        AdapterCoverageState.Unknown => println(record.diagnostics[0].message)
```

## Check explicit adapter requirements

Use `check_coverage(...)` when the requirement comes from a policy, workflow, or review step rather than directly from the inspected plan shape. Build the requirements that matter, then ask the selected adapter for coverage records.

```incan
from pub::incql import (
    AdapterCoverageState,
    AdapterRequirement,
    AdapterRequirementCapability,
    AdapterRequirementGuarantee,
)

observed = session.collect_observed(orders)
requirement = AdapterRequirement(
    requirement_id="orders-row-filter",
    target=observed.observation.plan_target,
    capability=AdapterRequirementCapability.RowFilter,
    guarantee=AdapterRequirementGuarantee.Required,
    reason="filtered order review requires adapter-side row filtering",
    evidence_refs=[],
)

coverage = session.check_coverage([requirement])

match coverage[0].state:
    AdapterCoverageState.Covered => println("covered")
    AdapterCoverageState.PartiallyCovered => println(coverage[0].diagnostics[0].message)
    AdapterCoverageState.Uncovered => println(coverage[0].diagnostics[0].message)
    AdapterCoverageState.Unknown => println(coverage[0].diagnostics[0].message)
```

Treat `Unknown` as non-enforcing. It means IncQL has not classified that adapter capability; it does not mean the adapter has proven support.

## Choose the right observed method

- Use `execute_observed(...)` for a validation/checkpoint boundary without local materialization.
- Use `collect_observed(...)` when a local `DataFrame[T]` and row count are part of the evidence you need.
- Use `write_observed(...)` when the sink write is the operation being audited.
- Use `check_plan_coverage(...)` or `check_inspection_coverage(...)` for adapter requirements inferred from local plan evidence.
- Use `check_coverage(...)` for explicit adapter requirements that come from policy or workflow context outside the plan.

For the complete field and enum reference, see [Execution context (Reference)](../reference/execution_context.md).

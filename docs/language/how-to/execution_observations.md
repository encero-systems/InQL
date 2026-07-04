# Capture execution observations and adapter coverage

This how-to shows how to collect runtime evidence for a Session operation and how to ask the selected adapter whether it covers explicit requirements.

Use the observed Session methods when you need an auditable execution attempt record. Use `check_coverage(...)` when a tool, policy, or review step already knows which adapter capability needs to be checked.

## Collect with an observation

Use `collect_observed(...)` when you need materialized data and execution evidence from the same attempt.

```incan
from pub::inql import ExecutionObservationStatus, LazyFrame, Session
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
from pub::inql import csv_sink

write_attempt = session.write_observed(orders, csv_sink("target/orders.csv"))

match write_attempt.error:
    Some(err) => println(err.error_message())
    None => println(write_attempt.observation.observation_id)
```

The write result has no `data` field. The output artifact is the sink side effect; the returned value carries the observation and optional error.

## Check explicit adapter requirements

`check_coverage(...)` does not infer requirements from a plan yet. Build the requirements that matter to the policy or workflow, then ask the selected adapter for coverage records.

```incan
from pub::inql import (
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

Treat `Unknown` as non-enforcing. It means InQL has not classified that adapter capability; it does not mean the adapter has proven support.

## Choose the right observed method

- Use `execute_observed(...)` for a validation/checkpoint boundary without local materialization.
- Use `collect_observed(...)` when a local `DataFrame[T]` and row count are part of the evidence you need.
- Use `write_observed(...)` when the sink write is the operation being audited.
- Use `check_coverage(...)` for explicit adapter requirements; do not use it as a plan-requirement discovery API.

For the complete field and enum reference, see [Execution context (Reference)](../reference/execution_context.md).

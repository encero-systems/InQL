# Use semantic profiles in evidence

Use semantic profiles when a plan is being evaluated for a specific environment, such as an IncQL baseline, SQL dialect, execution engine, adapter binding, catalog system, transformation project, interchange consumer, or conformance baseline. A profile records the assumptions around that environment so coverage, observations, bundles, and exchanges do not silently depend on an unnamed backend or external project.

## Create a baseline profile

```incan
from pub::incql import incql_baseline_profile

profile = incql_baseline_profile("v0.1", evidence_refs=["profile:incql"])
```

The IncQL baseline profile declares core exact dimensions such as IncQL's typed model, function registry identity, unordered relation model, and Prism inspection observability. This is useful when a bundle should state that its evidence was evaluated against IncQL's own local semantics rather than an external engine.

## Declare an external profile dimension

```incan
from pub::incql import (
    SemanticProfileDimensionKind,
    SemanticProfileDimensionState,
    semantic_dimension,
    sql_dialect_profile,
)

oracle = sql_dialect_profile(
    "oracle",
    dimensions=[
        semantic_dimension(
            SemanticProfileDimensionKind.TemporalCalendar,
            "timestamp and timezone behavior not evaluated for this plan",
            state=SemanticProfileDimensionState.Unknown,
        ),
    ],
)
```

Unknown dimensions remain unknown. IncQL does not treat an Oracle, Athena, Spark, dbt, Glue, OpenLineage, or DataHub profile as compatible merely because the profile exists. Compatibility evidence has to say which dimensions are exact, constrained, mismatched, unknown, or not applicable.

## Assess a plan target

```incan
from pub::incql import assess_profile_for_target, inspect_plan

inspection = inspect_plan(summary)
assessment = assess_profile_for_target(inspection.plan_target, oracle)

assert assessment.state.value() == "unknown"
```

`assess_profile_for_target(...)` is intentionally conservative. If any dimension is unknown, the assessment is unknown. If a dimension is constrained, the assessment is constrained. Use `profile_assessment(...)` when a caller has explicit mismatch evidence or richer diagnostics.

## Bind coverage to a profile

```incan
from pub::incql import adapter_binding_profile, coverage_record_for_profile

datafusion = adapter_binding_profile("datafusion", adapter_version=Some("53.1"))
profiled_coverage = coverage_record_for_profile(coverage, datafusion)
```

This does not change the coverage answer. It records that the answer was evaluated under the named profile, which prevents coverage for one target environment from being reused as if it applied to every target environment.

## Package profiles in a governed bundle

```incan
from pub::incql import governed_plan_bundle_from_inspection

bundle = governed_plan_bundle_from_inspection(
    inspection,
    semantic_profiles=[oracle],
    profile_assessments=[assessment],
)
```

The bundle now exposes `semantic_profiles` and `profile_assessments` sections. Its JSON summary includes profile counts, and `rule_versions` includes the semantic profile schema version when profile evidence is present.

## Review profile evidence

Typical local review flow:

1. Inspect or build a plan.
2. Create one or more semantic profiles for the target environment.
3. Assess the plan target under those profiles.
4. Bind adapter coverage records to the profile that was used for evaluation.
5. Package profiles, assessments, coverage, execution observations, and quality evidence in a governed plan bundle.
6. Export bundle or exchange artifacts while keeping profile evidence explicit.

Profiles are context, not authority. Prism remains the local relational planning model, Substrait remains the interchange boundary, and adapters remain execution bindings.

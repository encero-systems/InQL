# Substrait conformance corpus (Reference)

This page documents where IncQL's Substrait conformance scenarios live and how they are represented. It is the current reference for the conformance corpus shape used by package code and tests.

The corpus is the machine-readable validation layer for the current IncQL package implementation profile. For operator-level mappings, see the [Substrait operator catalog][ref-operator-catalog].

## Source of truth

The canonical conformance corpus is implemented in IncQL package code:

- `src/substrait/conformance.incn`
- `src/substrait/conformance_catalog.incn`
- `src/substrait/conformance_validate.incn`

The corpus uses typed models/enums (`SubstraitConformanceScenario`, `ConformanceStatus`, `ConformanceRel`, and related enums) for machine-readable contracts, and uses module/API docstrings for the human-readable contract.

Canonical operation semantics flow through `src/dataset/ops.incn`, while proto-backed Substrait relation building, plan assembly, and plan inspection now live in the focused `src/substrait/*.incn` helper modules.

For the package-level profile, conformance checks are split between:

- relation boundary facts that the package validates directly (relation kind, read kind, join variant, set operation, reference ordinal, extension URI presence)
- expression and planning semantics that are validated through package tests for the implemented method-chain surface

## Representation contract

Each scenario is selected by `CoreScenarioKey` and materialized via `core_scenario(key) -> SubstraitConformanceScenario`.

- Machine-readable fields include strongly typed enums for status/profile/relation/portability fields.
- Tag and reference collections are modeled as list-backed newtypes (`ConformanceCapabilityTags` and `ConformanceReferences`) rather than pipe-delimited strings.
- Human-readable content remains in docs plus descriptive scenario text fields (`intent`, `required_rel_shape`, and `expected_constraints`).
- Fixture plan construction is test-owned. Production conformance modules define contracts and validators.

## Scenario ID convention

`scenario_id` values must be stable and use this convention:

```text
incql.substrait.<taxonomy-group>.<capability-slug>.<nnn>
```

The numeric suffix is immutable after publication. If requirements change incompatibly, add a new scenario ID instead of mutating semantics under an existing ID.

## Current core coverage

Core scenarios currently implemented in `src/substrait/conformance_catalog.incn`:

| Scenario ID                                            | Selector                                                   | Primary core `Rel` coverage |
| ------------------------------------------------------ | ---------------------------------------------------------- | --------------------------- |
| `incql.substrait.core.read_named_table.001`             | `core_scenario(CoreScenarioKey.ReadNamedTable)`            | `ReadRel` (`NamedTable`)    |
| `incql.substrait.core.read_local_files.001`             | `core_scenario(CoreScenarioKey.ReadLocalFiles)`            | `ReadRel` (`LocalFiles`)    |
| `incql.substrait.core.read_virtual_table.001`           | `core_scenario(CoreScenarioKey.ReadVirtualTable)`          | `ReadRel` (`VirtualTable`)  |
| `incql.substrait.core.filter_rows.001`                  | `core_scenario(CoreScenarioKey.FilterRows)`                | `FilterRel`                 |
| `incql.substrait.core.project_computed_columns.001`     | `core_scenario(CoreScenarioKey.ProjectComputedColumns)`    | `ProjectRel`                |
| `incql.substrait.core.join_rel_variants.001`            | `core_scenario(CoreScenarioKey.JoinRelVariants)`           | `JoinRel`                   |
| `incql.substrait.core.cross_rel_cartesian.001`          | `core_scenario(CoreScenarioKey.CrossRelCartesian)`         | `CrossRel`                  |
| `incql.substrait.core.aggregate_grouping_sets.001`      | `core_scenario(CoreScenarioKey.AggregateGroupingSets)`     | `AggregateRel`              |
| `incql.substrait.core.sort_rel_ordering.001`            | `core_scenario(CoreScenarioKey.SortRelOrdering)`           | `SortRel`                   |
| `incql.substrait.core.fetch_rel_limit_offset.001`       | `core_scenario(CoreScenarioKey.FetchRelLimitOffset)`       | `FetchRel`                  |
| `incql.substrait.core.set_rel_operations.001`           | `core_scenario(CoreScenarioKey.SetRelOperations)`          | `SetRel`                    |
| `incql.substrait.core.reference_rel_shared_subplan.001` | `core_scenario(CoreScenarioKey.ReferenceRelSharedSubplan)` | `ReferenceRel`              |

## Taxonomy values

The same taxonomy remains in force for scenario declarations:

- `status`: `ConformanceStatus.Core`, `ConformanceStatus.Extension`, `ConformanceStatus.Gap`, `ConformanceStatus.OptionalMutation`
- `profile_tags`: `ConformanceProfileTag.ReadQueryCore`, `ConformanceProfileTag.OptionalMutation`, `ConformanceProfileTag.GapPolicy`, `ConformanceProfileTag.ReadBindingBoundary`
- `portability`: `ConformancePortability.Portable`, `ConformancePortability.ConsumerConditional`, `ConformancePortability.NonPortable`

## Tooling expectation

Downstream tooling should consume scenario catalog and validator functions from `src/substrait/conformance*.incn` modules as the machine contract, rather than JSON sidecar files.

Conformance validation for the v1 profile is expected to run against canonical operation functions in `src/dataset/ops.incn`, emitted proto-backed plans from the current `src/substrait/*.incn` helper surface, and typed model/schema helpers where needed.

`ProjectRel` and `AggregateRel` scenarios validate the Substrait relation boundary. Package tests cover the implemented scalar computed-column and grouped-aggregate method-chain behavior; windows, grouping sets, and distinct semantics have their own capability rows in the operator catalog.

Historical design context is captured in [IncQL RFC 002][rfc-002], but this page is the source of truth for the current conformance corpus representation.

<!-- References -->

[rfc-002]: ../../rfcs/002_apache_substrait_integration.md
[ref-operator-catalog]: ./operator_catalog.md

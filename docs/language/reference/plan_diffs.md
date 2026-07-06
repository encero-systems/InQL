# Plan diffs and blast-radius inputs (Reference)

Plan diffs compare structured InQL evidence artifacts. They do not compare raw source text, generated SQL, Substrait payload bytes, or backend physical plans. The diff result is a local evidence artifact that downstream tools can combine with their own dependency indexes, review workflows, or catalog data.

## Entry points

```incan
from pub::inql import diff_lazy_plans, diff_plans, diff_plan_bundles

diff = diff_lazy_plans(before_summary, after_summary)
inspection_diff = diff_plans(before_inspection, after_inspection)
bundle_diff = diff_plan_bundles(before_bundle, after_bundle)
```

| API | Input | Output |
| --- | ----- | ------ |
| `diff_lazy_plans(before, after)` | Two `LazyFrame` values | `PlanDiff` |
| `diff_plans(before, after)` | Two `PlanInspection` values | `PlanDiff` |
| `diff_plan_bundles(before, after)` | Two `GovernedPlanBundle` values | `PlanDiff` |
| `blast_radius_inputs(diff)` | One `PlanDiff` | `list[BlastRadiusInput]` |

`diff_lazy_plans(...)` inspects both lazy plans before comparing them. Use `diff_plans(...)` when inspection already happened, and use `diff_plan_bundles(...)` when caller-supplied quality, execution, coverage, or evidence-reference records should participate in the comparison.

## Record types

| Record | Purpose |
| ------ | ------- |
| `PlanDiff` | Top-level comparison result with diff metadata, records, blast-radius inputs, and diagnostics. |
| `PlanDiffRecord` | One classified evidence change. |
| `BlastRadiusInput` | Local affected-target and requirement-change input derived from one diff record. |
| `PlanDiffChangeFamily` | Evidence family being compared. |
| `PlanDiffChangeKind` | Change state: `Added`, `Removed`, `Changed`, `Renamed`, `Unchanged`, or `Unknown`. |
| `PlanDiffCompatibility` | Conservative local compatibility class: `Compatible`, `PotentiallyBreaking`, `Breaking`, or `Unknown`. |
| `PlanDiffConfidence` | Confidence class: `Exact`, `Conservative`, or `Unknown`. |

`PLAN_DIFF_SCHEMA_VERSION` and `BLAST_RADIUS_INPUT_SCHEMA_VERSION` are the current schema identifiers for these records.

## Compared evidence families

Plan diffs compare the evidence InQL owns today:

- output fields and output schema facts
- authored and rewritten plan node shape
- lineage edges
- metadata attachments
- governed attributes
- policy checkpoints
- adapter requirements
- unsupported evidence markers

Bundle diffs also compare caller-supplied or bundle-specific evidence:

- adapter coverage records
- quality assertions
- quality observations
- execution observations
- bundle section states
- bundle-level evidence references

The comparison keys are semantic where possible. For example, governed attributes are compared by target, key, and scope rather than by plan-local generated IDs. This lets equivalent evidence from separate inspected snapshots compare cleanly while still reporting real semantic changes.

## `PlanDiff`

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `schema_version` | `str` | Diff schema identifier. |
| `diff_id` | `str` | Local diff id derived from the compared artifacts. |
| `before_plan_id` | `str` | Local plan id for the before artifact. |
| `after_plan_id` | `str` | Local plan id for the after artifact. |
| `before_bundle_id` | `Option[str]` | Before bundle id when comparing bundles. |
| `after_bundle_id` | `Option[str]` | After bundle id when comparing bundles. |
| `records` | `list[PlanDiffRecord]` | Classified change and unknown-impact records. |
| `blast_radius_inputs` | `list[BlastRadiusInput]` | Local downstream-impact inputs derived from records. |
| `diagnostics` | `list[str]` | Diff-level diagnostics. |

Methods:

| Method | Output | Meaning |
| ------ | ------ | ------- |
| `diff.is_empty()` | `bool` | True when there are no change or unknown-impact records. |
| `diff.changed_output_fields()` | `list[PlanDiffRecord]` | Output-field change records. |
| `diff.changed_adapter_requirements()` | `list[PlanDiffRecord]` | Adapter requirement change records. |
| `diff.changed_lineage()` | `list[PlanDiffRecord]` | Lineage change records. |
| `diff.unknown_impacts()` | `list[PlanDiffRecord]` | Records with unknown impact or unknown compatibility. |
| `diff.has_breaking_changes()` | `bool` | True when any record is locally classified as breaking. |

## Unknown impact

Unknown impact is explicit. If inspection schema versions or bundle schema versions are incompatible, InQL emits an `ArtifactCompatibility` record with `kind = Unknown` and `compatibility = Unknown`. It does not return an empty diff merely because the comparison cannot be performed safely.

Generated or plan-local IDs are not treated as global identity. Where InQL can compare by semantic key, it does. Where identity is ambiguous, records use conservative or unknown confidence rather than silently dropping the change.

## Blast-radius boundary

`BlastRadiusInput` records name local affected targets and adapter requirement changes. They are inputs to downstream blast-radius tooling, not final global impact answers. InQL does not discover dashboards, jobs, consumers, approvals, or cross-repository dependencies in this API.

For a task-oriented workflow, see [Compare two plans](../how-to/plan_diffs.md).

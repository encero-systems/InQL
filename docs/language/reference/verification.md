# Async verification evidence (Reference)

Async verification evidence records what should be checked, what verification runs attempted, which append-only observations were emitted, and what the current derived state is for a scope. Verification evidence is separate from quality observations, execution observations, adapter coverage, and proof artifacts. Quality observations answer whether a predicate passed. Execution observations answer whether a session operation ran. Adapter coverage answers whether an adapter can satisfy a capability requirement. Verification observations answer what was checked and how strong the evidence is.

## Schema versions

| Constant | Meaning |
| -------- | ------- |
| `VERIFICATION_SCHEMA_VERSION` | Schema identifier for RFC 042 verification evidence records. |
| `VERIFICATION_PROJECTION_RULE_VERSION` | Rule identifier for the built-in current-state projection helper. |

## Record types

| Record | Purpose |
| ------ | ------- |
| `VerificationAssertion` | Stable declaration of what should be checked. It does not contain current state. |
| `VerificationRun` | Attempt to evaluate one or more verification assertions under explicit profiles, bindings, snapshots, and execution references. |
| `VerificationObservation` | Append-only event emitted by a verification run. |
| `VerificationProjection` | Current state derived from an observation stream for one assertion and scope. |
| `VerificationEvidence` | Grouped assertions, runs, observations, projections, snapshots, commitments, and waivers for bundle or exchange handoff. |
| `VerificationCoverage` | Covered and total scope counters with a unit label. |
| `VerificationAssuranceCount` | Count of selected active observations by assurance label. |
| `VerificationSnapshotReference` | Source or target snapshot reference with authority, capture basis, location, version or fingerprint, diagnostics, and evidence references. |
| `VerificationCommitmentReference` | Commitment reference with authority, capture basis, algorithm, value, diagnostics, and evidence references. |
| `VerificationWaiver` | Accepted exception for failed, missing, or weaker evidence. Waivers do not turn failed evidence into passed evidence. |

## Enums

| Enum | Values |
| ---- | ------ |
| `VerificationAssertionKind` | `RelationComparison`, `QualityAssertion`, `RowCountEquality`, `DigestEquality`, `ProofStatement`, `ExternalAttestation`, `Unknown` |
| `VerificationScopeKind` | `Relation`, `Field`, `Row`, `Partition`, `Result`, `Assertion`, `Unknown` |
| `VerificationLifecycle` | `Pending`, `Running`, `Blocked`, `Complete`, `Superseded` |
| `VerificationOutcome` | `Passed`, `Failed`, `Mixed`, `Errored`, `Skipped`, `Unsupported`, `Unknown` |
| `VerificationAssurance` | `Proven`, `Verified`, `Attested`, `Sampled`, `Waived`, `Unknown` |
| `VerificationFinality` | `Provisional`, `Final`, `Revoked` |
| `VerificationCaptureBasis` | `InternallyComputed`, `ConnectorAttested`, `ExternalArtifact`, `TrustedParty`, `TrustedExecutionEnvironment`, `UserDeclared`, `Unknown` |

## Constructors and helpers

| API | Output | Purpose |
| --- | ------ | ------- |
| `verification_assertion(...)` | `VerificationAssertion` | Declare verification intent and semantic targets. |
| `quality_verification_assertion(assertion, evidence_refs = [])` | `VerificationAssertion` | Wrap a `QualityAssertion` as verification intent without changing the quality assertion. |
| `verification_run(...)` | `VerificationRun` | Record one verification run request or attempt. |
| `verification_observation(...)` | `VerificationObservation` | Record one append-only verification event. |
| `waived_verification_observation(...)` | `VerificationObservation` | Record an accepted exception observation with `Waived` assurance. |
| `project_verification_state(assertion, observations, scope_id = "")` | `VerificationProjection` | Derive current state from active observations for one assertion and scope. |
| `verification_coverage(covered_count = 0, total_count = 0, unit = "scope")` | `VerificationCoverage` | Build coverage counters. |
| `verification_snapshot_reference(...)` | `VerificationSnapshotReference` | Build a snapshot reference. |
| `verification_commitment_reference(...)` | `VerificationCommitmentReference` | Build a commitment reference. |
| `verification_waiver(...)` | `VerificationWaiver` | Build an accepted exception record. |
| `verification_evidence(...)` | `VerificationEvidence` | Group verification records for bundles and exchange handoff. |

## Projection rules

`project_verification_state(...)` filters observations by assertion id and scope id, ignores revoked observations, ignores observations superseded by later observations, and projects the active observations into one current state. No matching observations produce `VerificationLifecycle.Pending`, `VerificationOutcome.Unknown`, zero coverage, and a diagnostic explaining that no observations matched.

If active observations have different non-error outcomes, the projection outcome is `Mixed`. If any active observation is `Errored`, the projection outcome is `Errored`. If all active observations share `Passed`, `Failed`, `Skipped`, `Unsupported`, or `Unknown`, the projection keeps that outcome. Assurance is not flattened into a single value; `VerificationProjection.assurance_summary` keeps counts for `Proven`, `Verified`, `Attested`, `Sampled`, `Waived`, and `Unknown` evidence.

Waived evidence remains separate from passed evidence. Use `waived_verification_observation(...)` when an accepted exception should supersede earlier evidence for the current projection. The projection outcome remains `Failed` unless a later non-waived observation establishes a different outcome.

## Bundle integration

`governed_plan_bundle(...)` and `governed_plan_bundle_from_inspection(...)` accept `verification_evidence`. When verification evidence is supplied, bundles include `VERIFICATION_SCHEMA_VERSION` in `rule_versions`, keep the typed `verification_evidence` records, and expose concrete optional sections:

| Section | Contents |
| ------- | -------- |
| `verification_evidence` | Supplied `VerificationEvidence` groups. |
| `verification_assertions` | Assertion ids. |
| `verification_runs` | Run ids. |
| `verification_observations` | Observation ids. |
| `verification_projections` | Projection ids. |
| `verification_snapshots` | Snapshot ids. |
| `verification_commitments` | Commitment ids. |
| `verification_waivers` | Waiver ids. |

If verification evidence is omitted, these sections are present as `Unavailable`, not `Unsupported`. Related RFC families that are still not implemented, such as canonical equality profiles and proof artifacts, remain explicit `Unsupported` sections.

## Boundaries

The current API is an evidence model and reducer. It does not run hosted async verification, define digest canonicalization profiles, implement proof systems, create approvals, or add verification block syntax. Digest and proof-backed observations can reference external profile, snapshot, commitment, and evidence ids today, but the exact canonical equality profiles and proof artifact formats belong to their owning RFCs.

For a task-oriented workflow, see [Track async verification state](../how-to/verification_evidence.md).

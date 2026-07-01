# InQL RFC 042: Async verification evidence

- **Status:** Draft
- **Created:** 2026-06-20
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 029 (typed metadata attachments)
  - InQL RFC 031 (local inspection APIs and artifacts)
  - InQL RFC 032 (execution observations)
  - InQL RFC 033 (adapter requirements and coverage)
  - InQL RFC 034 (quality assertions and observations)
  - InQL RFC 036 (governed plan bundle)
  - InQL RFC 038 (evidence exchange bridges)
  - InQL RFC 040 (interoperability semantic profiles)
  - InQL RFC 043 (canonical equality and digest profiles)
  - InQL RFC 044 (verifier statements and proof artifacts)
  - InQL RFC 045 (constraint evidence and verification-aware planning)
- **Issue:** [InQL #77](https://github.com/encero-systems/InQL/issues/77)
- **RFC PR:** —
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** —

## Summary

This RFC defines async verification evidence for InQL. Verification assertions are stable semantic targets, verification runs emit append-only observations over time, and current verification state is a projection over those observations rather than a mutable field. The model separates lifecycle, outcome, assurance, scope, and commitment context so tools can distinguish deterministic verification, external attestations, sampled checks, accepted waivers, unknown evidence, and proof-backed verification without pretending that all checks carry the same trust.

## Core model

1. A verification assertion describes what should be checked; it does not store the current result of the check.
2. A verification run records an attempt to evaluate one or more verification assertions under explicit profiles, bindings, and snapshot references.
3. A verification observation is an append-only event emitted by a run. Observations may arrive incrementally and may cover only part of the assertion scope.
4. A current verification state is a projection over observations for a specific assertion, scope, source snapshot, target snapshot, semantic profile context, and stream watermark.
5. Lifecycle, outcome, and assurance are separate axes. A check can be complete but failed, passed but only attested, or failed but waived.
6. Assurance is scoped. A relation may be sampled overall while individual partitions are verified, waived, unknown, or later proven.
7. Cryptographic proof verification plugs into the same event model through verifier statements and proof artifacts defined by InQL RFC 044. This RFC defines observation state, not proof-system mechanics.
8. Verification is always relative to recorded snapshots, stream positions, commitments, or attestations. It does not prove that those references faithfully represent reality unless their own authority and basis are also verified.
9. Privacy is a separate evidence concern. Verification assurance must not imply zero-knowledge, confidentiality, or payload redaction.

## Motivation

Migration, modernization, replicated analytics, and cross-system validation work rarely complete as one atomic yes-or-no check. Source counts may be reported by a connector before target data finishes loading. Partition digests may stream in over minutes or hours. A sampled comparison may later be replaced by a deterministic check. A mismatch may be waived for a specific partition while the rest of the relation remains verified. A proof verifier may also prove a bounded query result against committed inputs through the statement and artifact model defined by InQL RFC 044. InQL needs a vocabulary that can represent those movements without overwriting older evidence or collapsing weak and strong evidence into the same status.

The existing evidence RFCs already define execution observations, quality observations, adapter coverage, governed bundles, exchange bridges, and semantic profiles. They do not yet define a cross-cutting assurance axis or an async verification event stream. Reusing only quality status would conflate "the predicate passed" with "the evidence is independently verified." Reusing only execution status would conflate "the job succeeded" with "the migration is correct." Reusing only adapter coverage would conflate "the adapter can perform a check" with "the check has actually been performed."

## Goals

- Define verification assertions, verification runs, verification observations, and current verification projections.
- Keep lifecycle, outcome, and assurance separate.
- Support append-only async event streams where observations can upgrade, downgrade, supersede, revoke, or finalize earlier projections.
- Let verification evidence attach to semantic targets, snapshots, stream positions, watermarks, profiles, and evidence references.
- Require snapshot and commitment context to record authority, time, and basis when those facts are available.
- Define assurance labels for proven, verified, attested, sampled, waived, and unknown evidence.
- Define how proof-backed observations use the same lifecycle, outcome, assurance, scope, and commitment model while deferring statement and artifact details to InQL RFC 044.
- Require unsupported and omitted verification coverage to stay explicit in observations and projections.
- Clarify how verification evidence composes with quality observations, execution observations, adapter coverage, governed plan bundles, evidence exchange bridges, and semantic profiles.

## Non-Goals

- Defining a new authoring syntax for verification.
- Defining a full migration product, orchestration engine, approval workflow, or hosted verification service.
- Defining a cryptographic proof system, polynomial commitment scheme, proving engine, verifier implementation, or proof artifact format.
- Defining every canonical row, partition, or relation digest profile.
- Proving that a source snapshot, target snapshot, or commitment faithfully represents the underlying system of record.
- Providing zero-knowledge, data minimization, encryption, or privacy guarantees.
- Replacing quality assertions, execution observations, adapter coverage records, or semantic profile assessments.
- Treating waived evidence as equivalent to verified or proven evidence.

## Guide-level explanation (how authors think about it)

An author or tool starts with a verification assertion. The assertion says what should be checked; it is stable even while evidence is still streaming:

```incan
check = verify_relation(
    source=operational_orders,
    target=analytics_orders,
    key=[col("order_id")],
    checks=[
        row_count_equal(),
        partition_digest_equal(by=[col("order_date")]),
    ],
)

run = session.start_verification(check)
```

The names are illustrative. The same shape applies to operational tables replicated into cloud query stores, warehouse dimensions mirrored into lakehouse tables, SaaS exports loaded into analytical marts, streaming events materialized into batch stores, and outsourced query results checked against committed inputs. The important model is that verification creates evidence over time instead of returning one final boolean immediately.

```incan
for event in run.events():
    print(event.scope, event.lifecycle, event.outcome, event.assurance)
```

A stream of observations might first report an external fact, then deterministic partition matches, then a mismatch, then a waiver for that mismatch:

```text
scope=orders                         lifecycle=running   outcome=mixed   assurance=attested
scope=orders/order_date=2026-06-18   lifecycle=complete  outcome=passed  assurance=verified
scope=orders/order_date=2026-06-19   lifecycle=complete  outcome=failed  assurance=verified
scope=orders/order_date=2026-06-19   lifecycle=complete  outcome=failed  assurance=waived
projection=orders                    lifecycle=complete  outcome=mixed   assurance_summary=verified:1/2, waived:1/2
```

The waiver does not rewrite the failed deterministic check. It adds an accepted exception with its own evidence and reason. A report can then say that all non-waived partitions were verified while one partition was waived.

For streaming or incremental relations, observations can be scoped by watermark or stream position:

```text
scope=orders
watermark=2026-06-20T10:15:00Z
coverage=37/400 partitions
outcome=mixed
assurance=sampled
```

Later evidence may upgrade the current projection for the same scope:

```text
scope=orders
watermark=2026-06-20T10:15:00Z
coverage=400/400 partitions
outcome=passed
assurance=verified
```

If a proof verifier verifies a cryptographic proof for the same bounded scope, it emits another observation rather than changing the assertion model:

```text
scope=orders
source_commitment=operational_snapshot:123456789
target_commitment=target_manifest:sha256:...
outcome=passed
assurance=proven
```

## Reference-level explanation (precise rules)

A verification assertion must be a semantic target. It must include assertion identity, checked subject targets, input relation targets when applicable, comparison or predicate intent, scope model, required semantic profiles when known, severity or policy-neutral intent when applicable, and evidence references.

A verification run must include run identity, assertion identity or assertion set identity, requested source and target profile references when applicable, binding context, start time, optional end time, requested snapshot or stream position references when available, and references to execution observations when verification work was executed through a session or adapter.

A verification observation must include observation identity, run identity, assertion identity, observed scope, lifecycle state, outcome state, assurance label, basis, evidence references, diagnostics, event time or sequence, and optional coverage, source snapshot reference, target snapshot reference, source commitment reference, target commitment reference, watermark, stream position, redacted sample reference, supersedes reference, and finality marker.

Snapshot and commitment references should include authority, observed time or commit time, capture basis, source location, version or fingerprint, and diagnostics when those facts are available. Capture basis should distinguish at least internally_computed, connector_attested, external_artifact, trusted_party, trusted_execution_environment, user_declared, and unknown.

Verification assurance is relative to the recorded references. A proven or verified observation must not be presented as proving that the source reference faithfully represents the underlying system unless the observation or linked evidence also verifies the commitment authority and capture basis.

Lifecycle state must distinguish at least:

- pending: verification has been declared or scheduled but has not started for the scope
- running: verification is in progress for the scope
- blocked: verification cannot currently make progress for the scope
- complete: verification reached a terminal observation for the scope and snapshot or watermark
- superseded: a later observation or run replaces this projection for the same scope

Finality markers, when present, must distinguish provisional, final, and revoked observations.

Outcome state must distinguish at least:

- passed: the checked condition passed for the observation scope
- failed: the checked condition failed for the observation scope
- mixed: child scopes or component checks have different outcomes
- errored: verification attempted to run but encountered an execution, connector, or evaluation error
- skipped: verification was intentionally not run for the scope
- unsupported: the requested verification cannot be represented or executed by the available system

Assurance label must distinguish at least:

- proven: a cryptographic proof was verified against recorded commitments for the observation scope
- verified: a deterministic check ran against recorded source and target snapshots or stream positions for the observation scope
- attested: a connector, external tool, catalog, or runtime reported a fact that InQL did not independently verify
- sampled: only part of the population was checked, or the check was deterministic only for a sampled subset
- waived: a mismatch, missing check, or weaker evidence was explicitly accepted with a recorded reason
- unknown: no usable evidence is available for the observation scope

Assurance labels must not be treated as a single global ordering without scope and coverage. A sampled deterministic check for one partition is not stronger than an attestation for a whole table in every context; consumers must evaluate assurance together with scope, coverage, snapshots, profiles, and diagnostics.

The `waived` assurance label must not be rendered as equivalent to `verified` or `proven`. A waived observation must carry a reason, source, and evidence reference. If the underlying deterministic outcome was failed, the current projection may report an accepted exception, but the failed observation must remain available.

The `verified` assurance label requires recorded inputs. For relation, row, or partition digest checks, the observation must identify the digest algorithm and canonicalization profile used, or must report unknown or unsupported evidence rather than claiming deterministic verification.

The `proven` assurance label requires recorded public inputs sufficient for an independent verifier to understand the checked statement. At minimum, a proven observation must identify the proof system or verifier profile, source commitments, result commitments or result references, the verified statement identity, commitment authority, commitment basis, and verifier diagnostics. Statement and artifact details belong to InQL RFC 044; proof-system mathematics remain outside this RFC.

Verification observations are append-only. An implementation must not update an old observation in place to change its outcome, assurance, scope, or evidence. Corrections, revocations, upgrades, downgrades, waivers, and finalizations must be represented as later observations with explicit supersedes or diagnostic references when they affect prior evidence.

A current verification projection is derived evidence. It must identify the assertion, scope, snapshot or watermark context, selected observation set, projection rule version, lifecycle, outcome, assurance summary, coverage, and diagnostics. A projection must distinguish missing evidence from unknown evidence and unknown evidence from failed evidence.

Projection rules must preserve weaker and stronger evidence separately. If a table has verified partitions, sampled partitions, waived partitions, and unknown partitions, the table-level projection should report mixed outcome or partial coverage rather than flattening the table to verified. Unsupported operators, omitted columns, omitted predicates, profile gaps, skipped partitions, and unknown digest semantics must remain visible as coverage diagnostics.

Verification evidence may reference quality observations when the checked condition is expressed as an InQL quality assertion. In that case, the quality observation status remains the predicate outcome, while the verification observation assurance records how the predicate result was established.

Verification evidence may reference execution observations when a verification run executes through a session or adapter. Execution success must not imply verification success, and verification success must not imply that every execution detail was covered.

Verification evidence may create adapter requirements. Initial capability families should include snapshot_capture, canonical_digest, cross_relation_reconciliation, incremental_watermark, verification_event_stream, waiver_recording, and cryptographic_query_proof where applicable.

Verification evidence must carry semantic profile context when source or target behavior affects correctness. A successful comparison under one source or target profile must not be reused under a different profile unless the evidence proves that the relevant profile dimensions are equivalent.

Verification evidence must not imply privacy. If a verification process also provides payload redaction, confidentiality, encryption, or zero-knowledge properties, those properties must be represented as separate evidence or profile facts.

Inbound exchange bridges may import external verification facts, but imported facts are attested unless InQL can represent and validate the underlying evidence under this RFC. Outbound exchange bridges must preserve assertion identity, scope, outcome, assurance, coverage, and diagnostics when the target format can carry them, or must report mapping loss.

Governed plan bundles may include verification assertions, runs, observations, current projections, snapshot references, proof references, and waiver records. Bundles must distinguish unsupported verification evidence from empty verification evidence.

## Design details

### Syntax

This RFC introduces no authoring syntax. Helper APIs, inspection APIs, session APIs, and artifact contracts are the normative surface. Any authoring syntax introduced by a separate RFC must lower to the same assertion and observation model.

### Semantics

Verification is evidence-producing relational work. It may compare source and target relations, evaluate quality assertions, check digests, validate row counts, compare aggregates, track streaming watermarks, or verify externally supplied proof artifacts. The semantics of the checked relation remain owned by Prism, profiles, quality assertions, and execution/session contracts; verification observations report what was checked and how strong the evidence is.

Current state is not authoritative storage. It is a projection over append-only observations. Consumers that need auditability must retain the observation stream or a bundle that can identify the observations used to compute the projection.

### Interaction with other InQL surfaces

Verification assertions reuse semantic targets from RFC 028 and may use metadata attachments from RFC 029 for provenance, source, visibility, and evidence references.

Verification observations compose with RFC 032 execution observations but do not replace them. A verification run may have one or more execution attempts, and an execution attempt may produce zero or more verification observations.

Verification assertions may wrap or reference RFC 034 quality assertions. Quality status answers whether a predicate passed; verification assurance answers how that answer was established.

Verification checks may require RFC 033 adapter coverage. Unknown or uncovered verification capability must not be presented as verified evidence.

Verification evidence may be included in RFC 036 governed plan bundles as an evidence family with required, optional, unavailable, and unsupported section states.

RFC 038 evidence exchange bridges may import and export verification evidence. Bridge mappings must not silently upgrade attested external facts to verified or proven InQL evidence.

RFC 040 semantic profiles provide source and target context for verification. Profile mismatches or unknown dimensions must be diagnostic evidence and may prevent verified or proven assurance.

### Standards alignment

Verification observations should be bridgeable to public standards without making those standards the internal source of verification semantics. W3C PROV can represent verification runs as activities, snapshots, commitments, results, and proof artifacts as entities, and tools or authorities as agents. OpenTelemetry can carry runtime spans, events, metrics, logs, and trace correlation for verification attempts. OpenLineage can carry run, job, dataset, and facet-shaped projections when verification is attached to pipeline execution. in-toto, SLSA provenance, W3C Verifiable Credentials, JSON Web Signature, and COSE may carry signed attestations for `attested` evidence, commitment authority, capture basis, and proof-verifier outputs when a bridge profile supports them.

Open-data governance principles should inform how verification reports explain provenance, reuse constraints, privacy, redaction, and stewardship, but those principles are not substitutes for verification observations, scope, outcome, assurance, or coverage.

### Compatibility / migration

This RFC is additive. Existing quality observations, execution observations, coverage records, and bundles remain valid. Artifacts that lack verification sections must be interpreted as missing or unsupported verification evidence, not as successful verification.

Existing quality observation statuses should not be renamed. When a quality observation is used for verification, the verification observation carries the additional assurance label and scope information.

## Alternatives considered

- **Use quality observation status as verification state.** Rejected because `passed` and `failed` do not describe whether the result was independently verified, externally attested, sampled, waived, or cryptographically proven.
- **Use execution observation status as verification state.** Rejected because a successful execution can produce a failed verification result, and a failed execution can leave prior verification evidence intact.
- **Store one mutable current state per check.** Rejected because async and streaming verification needs auditability, partial coverage, supersession, downgrades, and late-arriving evidence.
- **Require cryptographic proofs for verification evidence.** Rejected because deterministic migration and reconciliation work remains useful when no proof backend is available, and proof systems still need the same scope, snapshot, profile, and projection vocabulary.
- **Treat waived checks as passed.** Rejected because accepted exceptions are operationally useful but are not evidence that data matched.
- **Define a total assurance order.** Rejected because assurance strength depends on scope, coverage, snapshots, semantic profiles, and the consumer's risk model.

## Drawbacks

- Verification evidence adds another evidence family and another status axis for authors and tools to understand.
- Append-only observations require projection logic, and projection bugs can mislead consumers even when raw observations are correct.
- Streaming and partial verification can produce reports that are more conservative than users expect.
- Canonical digest and proof-compatible evidence need careful versioning to avoid false confidence.
- Waivers are necessary for real migrations but can be misused if reporting makes them look like successful checks.

## Implementation architecture

This section is non-normative. A practical implementation can store verification observations as a local append-only artifact stream and expose a reducer that computes current projections by assertion, scope, snapshot, profile, and watermark. Session adapters can emit execution observations and verification observations separately. Bundle writers can embed both the raw event stream and a compact projection so simple consumers can read the latest state while audit consumers can replay the evidence.

## Layers affected

- **InQL specification** — verification assertion, run, observation, assurance, and projection vocabulary become part of the relational evidence program.
- **InQL library package** — inspection, quality, session, and bundle APIs should be able to expose verification assertions, observations, and projections.
- **Execution / interchange** — adapters may need capability records for snapshot capture, canonical digests, event streams, reconciliation checks, and proof verification.
- **Documentation** — docs must explain the difference between lifecycle, outcome, assurance, coverage, and waived evidence.

## Unresolved questions

- Which verification helper APIs are normative rather than illustrative?
- Which canonical row, partition, and relation digest profiles are required before deterministic verification can claim `verified` assurance?
- What minimum waiver fields are required to keep `waived` useful without defining organization-wide approval policy?
- Which InQL RFC 044 proof artifact fields are required before an implementation may emit `proven` assurance?
- Which projection rule versions should this RFC standardize for relation-level rollups over partition, sample, and watermark observations?
- Should a separate RFC define authoring syntax for verification blocks, or should verification remain an API and artifact surface?

<!-- When every question is resolved, rename this section to **Design Decisions**, group answers under ### Resolved, and remove this comment. -->

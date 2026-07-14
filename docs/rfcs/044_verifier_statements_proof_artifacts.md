# IncQL RFC 044: Verifier statements and proof artifacts

- **Status:** Draft
- **Created:** 2026-06-20
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - IncQL RFC 027 (relational evidence program)
  - IncQL RFC 028 (semantic identity and target model)
  - IncQL RFC 031 (local inspection APIs and artifacts)
  - IncQL RFC 033 (adapter requirements and coverage)
  - IncQL RFC 036 (governed plan bundle)
  - IncQL RFC 040 (interoperability semantic profiles)
  - IncQL RFC 042 (async verification evidence)
  - IncQL RFC 043 (canonical equality and digest profiles)
- **Issue:** [IncQL #79](https://github.com/encero-systems/IncQL/issues/79)
- **RFC PR:** [IncQL #83](https://github.com/encero-systems/IncQL/pull/83)
- **Written against:** Incan v0.3-era IncQL
- **Shipped in:** —

## Summary

This RFC defines verifier statements and proof artifact records for IncQL evidence. A verifier statement binds a semantic plan target, profile context, source commitments, result references, canonical equality rules, and verifier profile into a stable statement that deterministic checks and cryptographic proof systems can verify without relying on SQL text or backend-specific plan fragments as the source of meaning.

## Core model

1. Verification statements are explicit public evidence records.
2. A statement binds to IncQL semantic targets and profile context, not merely to a query string.
3. Source commitments and result commitments are separate from the proof or evidence that verifies a statement.
4. A proof artifact records what verifier profile accepted, what public inputs were checked, and which scope the result covers.
5. `proven` assurance requires a successful proof verification observation, but this RFC does not define a proof system.

## Motivation

Async verification needs a durable way to describe the thing being checked. A result can be checked by deterministic row digests or by a cryptographic proof, but both checks should point at the same kind of statement: the plan identity, semantic assumptions, commitments, result reference, and equality rules. Without a statement record, proof artifacts would be tied to whichever SQL string, backend plan, or connector payload happened to produce them.

Cryptographic query proof systems usually expose a compact verifier interface, but the surrounding application still needs to define which database commitment is trusted, which result is being opened, which query semantics apply, and which unsupported operators are outside the statement. IncQL should own that statement layer while leaving concrete proof systems pluggable.

## Goals

- Define verifier statements as versioned evidence records.
- Bind verifier statements to Prism semantic targets, semantic profiles, canonical equality profiles, and source/result commitments.
- Define proof artifact records and proof verification observations.
- Keep deterministic verification and cryptographic proof verification under one statement shape.
- Require proof coverage and unsupported semantics to be explicit.
- Keep proof systems, curves, polynomial commitments, circuits, proving services, and verifier implementations outside this RFC.

## Non-Goals

- Defining a cryptographic proof system.
- Defining polynomial commitments, SNARKs, STARKs, vector commitments, authenticated data structures, or trusted setup procedures.
- Guaranteeing privacy or zero-knowledge behavior.
- Treating SQL text, backend physical plans, or serialized Substrait alone as authoritative statement identity.
- Proving that a source commitment faithfully represents an external system of record.

## Guide-level explanation (how authors think about it)

A tool can produce a verifier statement independently of any particular proof backend:

```incan
statement = verifier_statement(
    plan=summary,
    source_commitments=[source_snapshot],
    result=result_reference,
    equality=canonical_profile,
)

observation = session.verify_statement(statement)
```

The statement is the stable object. A deterministic verifier might check digests against it, while a proof verifier might validate a proof artifact against the same statement identity.

```text
statement_id=stmt:sha256:...
plan_target=plan:...
profile=profile:cloud_analytics:v1
source_commitment=snapshot:sha256:...
result_reference=result:sha256:...
equality_profile=canonical-equality:v1:keyed_bag
```

A proof verification observation can then cite the statement:

```text
statement_id=stmt:sha256:...
proof_artifact=proof:sha256:...
verifier_profile=query-proof:v1
outcome=passed
assurance=proven
```

## Reference-level explanation (precise rules)

A verifier statement must include statement identity, statement schema version, plan target, plan fingerprint or artifact reference, semantic profile references, canonical equality or result-opening profile references when applicable, source commitment references, result reference or result commitment, public parameter references when applicable, supported scope, excluded scope, evidence references, and diagnostics.

Statement identity must be derived from normalized statement fields or otherwise be reproducible from the statement artifact. If the statement identity is assigned externally, the artifact must also carry a reproducible fingerprint.

The plan target must refer to IncQL semantic evidence. SQL text, backend physical plans, serialized Substrait, or external client protocol nodes may be included as supporting artifacts, but they must not be the sole source of statement meaning.

A source commitment reference must include commitment identity, commitment authority when known, commitment time or observed time when known, capture basis, source scope, commitment algorithm or artifact type, evidence references, and diagnostics. Unknown authority or unknown capture basis must remain explicit.

A result reference must identify the claimed result scope. When the result is materialized, the reference should include a result fingerprint, canonical equality profile, schema reference, row count when available, and redaction status. When the result is committed rather than materialized, the reference must identify the commitment artifact and opening rules.

A verifier profile must include verifier profile identity, version, supported statement schema, supported operator or evidence families, supported commitment families, supported result-opening rules, security or soundness parameters when applicable, trusted setup or parameter references when applicable, implementation identity when available, and diagnostics.

A proof artifact must include proof artifact identity, proof system or verifier profile identity, statement identity, public input references, proof payload reference or inline proof payload, proof generation context when available, producer identity when available, proof time when available, and diagnostics.

A proof verification observation must be a verification observation under RFC 042. It must include statement identity, verifier profile identity, proof artifact identity, outcome, assurance, diagnostics, and coverage. It may claim `proven` assurance only if the verifier accepted the proof for the exact statement identity and covered scope.

Proof coverage must be explicit. If a proof covers only a subset of operators, columns, rows, partitions, result fields, filters, joins, aggregates, ordering, or profile dimensions, the observation must report partial coverage, excluded scope, or unsupported evidence rather than claiming global proof coverage.

Commitment trust is not implicit. A proof verification observation proves the statement relative to recorded commitments and public inputs. It must not claim that the commitment faithfully represents the external system unless separate evidence verifies that authority and capture basis.

Verifier statements may be used by deterministic evidence. A digest verifier can report `verified` assurance against a statement when it checks the statement's source references, result references, and canonical equality profiles without a cryptographic proof artifact.

Governed plan bundles may include verifier statements, commitment records, proof artifacts, verifier profiles, and proof verification observations. Bundles must distinguish missing proof evidence from unsupported proof evidence and failed proof evidence.

## Design details

### Syntax

This RFC introduces no authoring syntax. Statement creation should be available through evidence and verification APIs. Any authoring syntax introduced by a separate RFC may reference statement profiles, but the serialized verifier statement remains the normative artifact.

### Semantics

Verifier statements describe checkable claims. They do not execute the plan, choose a backend, or define proof mathematics. A statement is valid only to the extent that its semantic targets, profiles, commitments, and result references are valid and in scope.

### Interaction with other IncQL surfaces

RFC 028 provides semantic targets for plan and result references.

RFC 040 provides semantic profiles that state source, target, and execution assumptions.

RFC 043 provides canonical equality and digest profiles for result-opening and deterministic verification.

RFC 042 provides the observation model that records proof verification outcomes.

RFC 033 adapter coverage may report whether a backend or verifier supports a requested statement family, commitment family, result-opening profile, or proof artifact type.

### Standards alignment

Verifier statements and proof artifacts should align with public signed-attestation and provenance specifications when used outside IncQL. W3C PROV can describe statement derivation, proof generation, proof verification, source commitments, result commitments, and responsible agents. in-toto and SLSA provenance can represent signed provenance over materials, subjects, builders, and reproducible verification steps. W3C Verifiable Credentials, JSON Web Signature, COSE, and JSON canonicalization specifications may be used by bridge profiles for portable signed claims and canonical signed payloads.

These standards provide envelopes, provenance vocabulary, and signature mechanics. They do not define IncQL statement semantics, Prism plan identity, canonical equality profiles, proof coverage, or `proven` assurance by themselves. A bridge must preserve statement identity, verifier profile, commitment authority, commitment basis, public inputs, proof artifact identity, and coverage diagnostics.

### Compatibility / migration

This RFC is additive. Existing verification observations can remain statement-free, but statement-free observations cannot support statement-bound proof claims. Implementations may attach statement references to existing observations only when the statement can be reconstructed without changing the checked claim.

## Alternatives considered

- **Use SQL text as the statement.** Rejected because SQL text does not capture IncQL semantic target identity, profile context, canonical equality rules, or source commitments.
- **Use backend plans as the statement.** Rejected because backend plans are execution artifacts, not the authoritative IncQL semantic contract.
- **Define proof artifacts only after choosing a proof system.** Rejected because deterministic verification and proof systems both need the same statement boundary.
- **Treat a successful proof as source truth.** Rejected because proof verification is relative to commitments and public inputs.

## Drawbacks

- Verifier statements add another artifact that tools must preserve.
- Statement identity must be versioned carefully or proofs and deterministic evidence may become hard to compare over time.
- Exposing proof coverage precisely can make reports conservative when a proof backend covers only part of a plan.
- Users may mistake `proven` for a broader claim unless commitment authority is reported clearly.

## Implementation architecture

This section is non-normative. A deterministic-digest implementation can generate statement artifacts without a cryptographic proof backend. Proof artifact support can be represented as an additional verifier profile that consumes the same statement shape and emits ordinary RFC 042 verification observations.

## Layers affected

- **IncQL specification** — verifier statements, commitment references, verifier profiles, proof artifacts, and proof verification observations become evidence vocabulary.
- **IncQL library package** — evidence APIs should be able to emit statement artifacts and attach them to verification observations.
- **Execution / interchange** — adapters and verifier integrations may report coverage for statement families and proof artifact families.
- **Documentation** — docs must explain statement identity, commitment trust, and the difference between verified and proven assurance.

## Unresolved questions

- Which fields are required for the initial statement schema, and which fields require a superseding RFC?
- Should statement fingerprints include serialized profile artifacts by value or by stable reference?
- Which verifier profile metadata is required before a proof observation may claim `proven` assurance?
- How should large result references be represented when the result is streamed or externally materialized?
- Should public/private input boundaries be represented now even though privacy is outside this RFC?

<!-- When every question is resolved, rename this section to **Design Decisions**, group answers under ### Resolved, and remove this comment. -->

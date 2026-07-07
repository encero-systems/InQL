# InQL RFC 036: Governed plan bundle

- **Status:** Implemented
- **Created:** 2026-05-29
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 002 (Apache Substrait integration)
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 029 (typed metadata attachments)
  - InQL RFC 030 (Prism lineage graph)
  - InQL RFC 033 (adapter requirements and coverage)
  - InQL RFC 034 (quality assertions and observations)
  - InQL RFC 035 (governed attributes and policy checkpoints)
  - InQL RFC 040 (interoperability semantic profiles)
  - InQL RFC 041 (Prism plan ingress and external client frontends)
  - InQL RFC 042 (async verification evidence)
  - InQL RFC 043 (canonical equality and digest profiles)
  - InQL RFC 044 (verifier statements and proof artifacts)
  - InQL RFC 045 (constraint evidence and verification-aware planning)
  - InQL RFC 046 (data contract ingress and product topology)
  - InQL RFC 047 (semantic evidence graph and agent query surface)
- **Issue:** [InQL #70](https://github.com/encero-systems/InQL/issues/70)
- **RFC PR:** [InQL #60](https://github.com/encero-systems/InQL/pull/60); [InQL #83](https://github.com/encero-systems/InQL/pull/83); [InQL #95](https://github.com/encero-systems/InQL/pull/95)
- **Written against:** Incan v0.4-era InQL
- **Shipped in:** InQL v0.1

## Summary

This RFC defines the governed plan bundle as the local InQL artifact that keeps relational computation and evidence together. A bundle contains a plan reference, schemas, lineage, governed attributes, policy checkpoints, quality assertions, verification evidence, canonical equality profiles, verifier statements, proof artifacts, constraint evidence, data contract evidence, product topology, semantic evidence graph projections, semantic profiles, ingress evidence, client session context, adapter requirements, coverage records, evidence references, and version metadata for the InQL-owned parts of governed relational computation.

## Motivation

Individual evidence artifacts are useful, but many consumers need a coherent handoff unit. A plan without its evidence can be executed without understanding requirements. Evidence without the plan cannot explain what computation it describes. The governed plan bundle gives InQL a portable local package for the facts it owns while leaving hosted storage, global policy, approvals, and cross-system reasoning outside the contract.

## Goals

- Define a bundle shape for InQL-owned relational evidence.
- Keep plan, schema, lineage, attributes, policy checkpoints, quality assertions, verification evidence, canonical equality profiles, verifier statements, proof artifacts, constraint evidence, data contract evidence, product topology, semantic evidence graph projections, semantic profiles, ingress evidence, client session context, adapter requirements, coverage, and versions together.
- Support local tooling and downstream generic consumers.
- Avoid proprietary hosted behavior in the InQL contract.

## Non-Goals

- Defining a managed control plane or global graph store.
- Defining organization-wide approval or promotion workflow.
- Replacing Substrait as the relational interchange plan.
- Requiring every bundle consumer to understand every optional evidence family.

## Guide-level explanation (how authors think about it)

An author or CI job can produce one bundle for a planned relation:

```incan
bundle = governed_plan_bundle(summary)
bundle.write("target/inql/summary.bundle.json")
```

The bundle can be inspected locally or consumed by other tools. It does not require a hosted service.

## Reference-level explanation (precise rules)

A governed plan bundle must include:

- bundle schema version
- InQL version and relevant rule versions
- plan target
- input schema references
- output schema reference
- lineage graph reference or embedded lineage graph
- metadata attachments
- governed attributes
- policy checkpoint records
- quality assertions and optional observations
- verification assertions, runs, observations, and projections when available
- canonical equality profiles and digest profiles when available
- verifier statements, proof artifacts, and proof verification observations when available
- constraint evidence and verification plans when available
- data contract artifacts, normalized contract evidence, and mapping diagnostics when available
- product topology evidence and port dependency records when available
- semantic evidence graph projection manifests, graph artifacts, and graph query result artifacts when available
- semantic profile records and profile assessments when available
- ingress origin mappings and frontend coverage when available
- client session context when it affected plan analysis
- adapter requirements
- coverage records when available
- evidence references
- export status when available

The bundle must distinguish required, optional, unavailable, and unsupported evidence sections. A missing evidence section must not be treated as an empty evidence section.

The bundle may include a Substrait plan or a reference to a Substrait artifact, but Substrait must not be the only source of InQL evidence in the bundle.

Sensitive or redacted evidence must follow attachment visibility rules.

Bundle consumers must be able to ignore optional evidence families they do not understand while still detecting unsupported required evidence.

## Design details

### Syntax

This RFC introduces no authoring syntax.

### Semantics

The bundle is an evidence package. It does not make policy decisions by itself.

### Interaction with other InQL surfaces

Inspection artifacts, execution observations, quality observations, ingress frontends, and evidence exchange bridges may all read from or write to bundle-compatible records.

### Compatibility / migration

Bundles must be versioned from the start. Early bundles may contain fewer evidence families, but they must mark unsupported families explicitly.

## Alternatives considered

- **Only emit separate artifacts.** Rejected because consumers often need a coherent handoff unit.
- **Make the bundle a hosted-service protocol.** Rejected because local InQL evidence must remain open and service-independent.
- **Embed all evidence directly into Substrait.** Rejected because Substrait is not a complete InQL evidence model.

## Drawbacks

- Bundle versioning becomes a compatibility commitment.
- Bundles can become large for complex plans.
- Consumers need clear rules for partial evidence.

## Layers affected

- **InQL specification** — bundle contents and required distinctions become normative.
- **InQL library package** — APIs must produce bundle-compatible records.
- **Execution / interchange** — Substrait may be included or referenced, but not treated as the sole evidence store.
- **Documentation** — docs must define local bundle use without implying hosted-service requirements.

## Design Decisions

### Resolved

- Bundles embed the current local InQL-owned typed evidence records in memory. The stable JSON handoff surface is a summary artifact with bundle metadata, plan/root target summaries, counts, evidence section states, input schema references, and evidence references. It intentionally does not flatten every rich nested record before InQL has a broader exchange-artifact profile.
- The stable serialization surface for this RFC is the JSON summary produced by `to_json_text()` / `write(path)`. The typed `GovernedPlanBundle` value remains the richer local API for in-process tools.
- A complete local bundle requires the core evidence families InQL can compute today: plan target, input schema references, output schema, output fields, lineage graph, metadata attachments, governed attributes, policy checkpoints, adapter requirements, and unsupported-evidence markers. Quality assertions, quality observations, execution observations, coverage records, Substrait artifact references, verification evidence, canonical equality profiles, verifier statements, proof artifacts, constraint evidence, data contract evidence, product topology, semantic graph projections, semantic profiles, ingress mappings, client session context, and exchange bridge evidence are optional and must be marked unavailable or unsupported when missing.

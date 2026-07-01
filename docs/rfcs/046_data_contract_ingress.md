# InQL RFC 046: Data contract ingress and product topology

- **Status:** Draft
- **Created:** 2026-06-20
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 029 (typed metadata attachments)
  - InQL RFC 033 (adapter requirements and coverage)
  - InQL RFC 034 (quality assertions and observations)
  - InQL RFC 035 (governed attributes and policy checkpoints)
  - InQL RFC 036 (governed plan bundle)
  - InQL RFC 038 (evidence exchange bridges)
  - InQL RFC 040 (interoperability semantic profiles)
  - InQL RFC 042 (async verification evidence)
  - InQL RFC 045 (constraint evidence and verification-aware planning)
  - InQL RFC 047 (semantic evidence graph and agent query surface)
- **Issue:** [InQL #81](https://github.com/encero-systems/InQL/issues/81)
- **RFC PR:** [InQL #83](https://github.com/encero-systems/InQL/pull/83)
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** —

## Summary

This RFC defines data contract ingress and product topology evidence for InQL. Existing contract and product formats such as Open Data Contract Standard, Open Data Product Standard, and legacy Data Contract Specification artifacts are imported as evidence, normalized onto InQL semantic targets, and lowered into metadata attachments, quality assertions, constraint evidence, source bindings, product-port dependencies, and governed bundle records without making any external contract format the internal source of InQL semantics.

## Core model

1. InQL does not define a new data contract standard.
2. Contract artifacts are imported evidence with source, format, version, status, scope, fingerprint, and diagnostics.
3. Contract clauses lower into existing InQL evidence families where possible.
4. Product topology describes ports, contracts, dependencies, management endpoints, support, ownership, and SBOM references around contract evidence.
5. Imported declarations are not verified facts unless later verification evidence proves them.
6. Contract ingress is an exchange bridge profile, but normalized contract evidence must be useful inside governed bundles and evidence graphs.

## Motivation

Data contracts already have active open formats. Open Data Contract Standard covers schema objects, properties, data quality rules, server bindings, service-level agreements, roles, teams, authoritative definitions, custom properties, and related metadata. Open Data Product Standard covers data product envelopes, input ports, output ports, contract identifiers, product dependencies, management ports, support, ownership, and SBOM references. The older Data Contract Specification remains relevant because tools and existing repositories still use it, even though its maintainers recommend migration to Open Data Contract Standard. InQL should absorb these surfaces as evidence rather than inventing a competing vocabulary.

The existing evidence RFCs already have better homes for most contract facts. Required fields, uniqueness, primary keys, foreign keys, partitioning, and referential relationships belong to constraint evidence. Quality rules belong to quality assertions. Server and platform locations belong to source binding and semantic profile evidence. Classifications and critical data elements belong to governed attributes and policy checkpoints. Contract identifiers and product ports belong to bundle and graph topology. What is missing is a normative ingress layer that records where those facts came from, how they map, and what assurance they carry.

## Goals

- Define imported contract artifacts as evidence records.
- Treat Open Data Contract Standard as the primary data-contract ingress profile.
- Treat Open Data Product Standard as the primary data-product topology ingress profile.
- Support legacy Data Contract Specification artifacts as an import and migration profile.
- Normalize contract clauses onto InQL semantic targets and existing evidence families.
- Keep imported declarations distinct from deterministic verification results.
- Preserve source artifact identity, version, fingerprint, status, mapping coverage, unsupported fields, and diagnostics.
- Allow governed plan bundles and evidence graphs to include contract and product topology evidence.

## Non-Goals

- Defining a new data contract syntax or custom InQL vocabulary for contracts.
- Replacing Open Data Contract Standard, Open Data Product Standard, or existing data-contract tooling.
- Defining legal agreement semantics, data usage agreement lifecycle, signatures, approvals, or contract negotiation workflows.
- Defining data-product hosting, catalog storage, access-request processing, or product management UI.
- Defining syntax sugar for authoring contracts inside InQL.
- Treating imported contract facts as verified evidence by default.
- Guaranteeing complete lossless import from every third-party contract format.

## Guide-level explanation (how authors think about it)

An author or CI workflow can import a contract artifact and bind it to InQL semantic targets:

```incan
contract = import_data_contract("contracts/orders.odcs.yaml")

bundle = governed_plan_bundle(
    orders_summary,
    evidence=[contract],
)
```

The names are illustrative. The contract importer records the artifact as evidence, validates the known external schema where possible, maps recognized clauses to InQL evidence records, and reports unsupported clauses instead of silently dropping them.

```text
artifact=contracts/orders.odcs.yaml
format=odcs
format_version=v3.1.0
contract_id=53581432-6c55-4ba2-a65f-72344a91553a
status=active
mapping=quality:7, constraints:12, governed_attributes:4, source_bindings:2
unsupported=pricing
assurance=attested
```

An imported field declaration does not mean the field was checked in the source system:

```text
target=orders.order_id
constraint=unique_key(order_id)
source=contract:orders.odcs.yaml
outcome=passed
assurance=attested
```

A later verification run may upgrade that constraint for a specific snapshot:

```text
target=orders.order_id
constraint=unique_key(order_id)
source_snapshot=orders:2026-06-20T10:00:00Z
outcome=passed
assurance=verified
```

Product topology works the same way. A data product may declare output ports tied to contract identifiers and input dependencies on other contract identifiers. InQL imports those as topology evidence so an evidence graph can answer dependency and impact questions without pretending the product format owns relational semantics.

```incan
product = import_data_product("products/customer.odps.yaml")
graph = evidence_graph(bundle, evidence=[product])
```

## Reference-level explanation (precise rules)

A contract artifact record must include artifact identity, source location or inline source reference, format family, format version when available, artifact fingerprint, parse time, parse status, validation status when available, contract identity when present, contract version when present, contract status when present, source authority when known, evidence references, mapping profile, mapping coverage, unsupported fields, redaction behavior, and diagnostics.

Format family must distinguish at least:

- odcs: Open Data Contract Standard
- odps: Open Data Product Standard
- datacontract: Data Contract Specification
- custom: an explicitly named custom contract format
- unknown: an unclassified contract-like artifact

Imported contract clauses must lower into InQL evidence families where the mapping is known. The importer must not create a parallel internal contract vocabulary when an existing evidence family can represent the clause.

Open Data Contract Standard ingress must map recognized clauses as follows:

- Fundamentals such as contract identity, name, version, status, domain, tenant, tags, and descriptions must lower to metadata attachments on the contract artifact and relevant semantic targets.
- Schema objects and properties must lower to semantic target bindings, schema evidence, metadata attachments, and governed bundle schema sections.
- Stable object or property identifiers should be preserved as external target aliases.
- Logical and physical names and types must remain distinct.
- Primary keys, uniqueness, required fields, partitioning, relationships, referential links, ranges, accepted values, and related schema constraints must lower to constraint evidence under RFC 045.
- Quality rules must lower to quality assertions under RFC 034 when the rule can be represented, and must remain imported custom quality evidence when it cannot.
- Server declarations must lower to source binding evidence, adapter requirement hints, and interoperability semantic profile context.
- Service-level agreements must lower to quality, timeliness, retention, availability, or operational evidence records where their property family is known, and otherwise remain imported SLA evidence with diagnostics.
- Classifications, critical data element markers, encrypted names, roles, and access-related fields must lower to governed attribute or policy-checkpoint evidence where representable.
- Authoritative definitions and custom properties must lower to metadata attachments with source and visibility information.

Open Data Product Standard ingress must map recognized clauses as follows:

- Product identity, name, version, status, domain, tenant, tags, and descriptions must lower to product topology evidence and metadata attachments.
- Input ports must lower to dependency edges from the product or port to referenced contract identities.
- Output ports must lower to promised contract outputs with port identity, port version, type, contract identity, and evidence references.
- Port-level input contract references must lower to product dependency edges.
- Management ports must lower to product management endpoint evidence, not relational execution semantics.
- Support and team sections must lower to ownership and support metadata attachments.
- SBOM references must lower to evidence references and governed bundle metadata when present.

Legacy Data Contract Specification ingress must map recognized clauses as follows:

- `info`, `servers`, `terms`, `models`, `fields`, `definitions`, `quality`, `servicelevels`, `lineage`, and `links` must lower to the same InQL evidence families used for Open Data Contract Standard where semantics match.
- Legacy `lineage` clauses may seed lineage hints or external lineage evidence, but they must not become Prism-authored lineage.
- Legacy artifacts should carry a migration diagnostic indicating that Open Data Contract Standard is the preferred primary contract format when a bridge profile can report that safely.

An imported declaration must use assurance `attested` unless another evidence record establishes stronger assurance. A contract parser successfully validating an external schema verifies only that the artifact conforms to the external schema, not that the described dataset satisfies the declared contract.

Imported schema validation, contract linting, and external CLI test results may be attached as execution, quality, or verification evidence. The assurance of those results depends on their captured inputs, engine identity, source snapshots, and diagnostics; it must not be inferred solely from the contract format.

Contract mappings must preserve unsupported fields. If a recognized format contains clauses that have no InQL mapping, the contract artifact record must report those clauses as unsupported, custom, or lossy according to the mapping profile. Unknown fields must not be silently ignored when the bridge is configured for strict evidence import.

Contract mappings must preserve target ambiguity. If an artifact describes an object or field that cannot be bound to an InQL semantic target, the importer may create an external target candidate, but it must not pretend that candidate is a resolved InQL target.

Contract artifact fingerprints should use stable canonicalization for the imported artifact when a canonicalization profile is available. If the importer cannot canonicalize the format safely, it should record a raw artifact fingerprint and a diagnostic rather than inventing semantic identity from unstable formatting.

Governed plan bundles may include imported contract artifacts, normalized contract evidence, product topology evidence, mapping coverage, unsupported fields, and target binding diagnostics. Bundles must distinguish a missing contract section from a contract section that was present but unsupported.

## Design details

### Syntax

This RFC introduces no InQL contract authoring syntax. Import APIs, bridge profiles, governed bundle sections, and evidence graph projections are the normative surface. Syntax sugar for authoring or referencing contracts inside InQL belongs to a separate RFC if it becomes necessary.

### Semantics

Contract ingress is evidence import. It records declarations, expectations, ownership, dependencies, source bindings, and external rule definitions. It does not prove that data currently satisfies those declarations.

Product topology is graph-shaped evidence around contracts and ports. It explains which contracts are promised by outputs, expected by inputs, managed by endpoints, supported by teams, and referenced by artifacts. It does not redefine relational transformations, Prism lineage, or execution observations.

### Interaction with other InQL surfaces

RFC 028 provides semantic targets that imported contract clauses may bind to.

RFC 029 provides metadata attachments for contract identity, source, authoritative definitions, custom properties, ownership, support, status, and descriptive metadata.

RFC 034 owns quality assertions and observations derived from contract quality clauses.

RFC 035 owns governed attribute and policy-checkpoint evidence derived from classifications, critical data elements, encrypted-name references, roles, and access metadata.

RFC 036 governed plan bundles may carry contract artifacts, normalized contract evidence, product topology, mapping coverage, and diagnostics.

RFC 038 evidence exchange bridges own external format mapping profiles. This RFC specializes those bridges for data contract and product formats.

RFC 040 semantic profiles provide source and target context for server declarations and format-specific semantics.

RFC 042 and RFC 045 own the distinction between declared contract facts and verified evidence.

RFC 047 may project imported contract and product topology evidence into a graph query surface.

### Standards alignment

Open Data Contract Standard is the primary source for data contract ingress. Open Data Product Standard is the primary source for data product topology ingress. Data Contract Specification should be supported as a legacy import profile when an implementation chooses to support existing artifacts, but new InQL examples should prefer Open Data Contract Standard and Open Data Product Standard.

Contract and product ingress should also remain bridgeable to W3C PROV, DCAT, DCAT-AP, schema.org Dataset, Dublin Core, W3C Data Quality Vocabulary, OpenLineage, OpenTelemetry, in-toto, SLSA provenance, W3C Verifiable Credentials, JSON Web Signature, COSE, and related bridge profiles through RFC 038 when the target standard can represent the relevant evidence.

Open-data governance principles can guide documentation around provenance, reuse, stewardship, privacy, and accessibility. They do not replace contract artifact records, semantic target bindings, quality assertions, constraint evidence, or verification observations.

### Compatibility / migration

This RFC is additive. Existing InQL evidence artifacts remain valid without contract ingress sections.

Legacy Data Contract Specification support should be treated as compatibility import. When both a legacy artifact and an Open Data Contract Standard artifact describe the same contract, a bridge must record the source of each fact and must not merge conflicting declarations without diagnostics.

Adding support for a new external contract format must add a mapping profile rather than changing the meaning of existing normalized evidence records.

## Alternatives considered

- **Define an InQL-native contract YAML.** Rejected because existing open standards already cover the contract and product surfaces InQL needs to consume.
- **Adopt Open Data Contract Standard as the internal model.** Rejected because InQL evidence needs semantic targets, assurance, verification state, bundles, and graph projections that are broader than a contract document.
- **Treat imported contracts as truth.** Rejected because contracts are declarations until checked against specific data, snapshots, or runtime observations.
- **Support only one contract format.** Rejected because product topology and legacy import needs are distinct, and existing users may arrive with older artifacts.
- **Hide unsupported fields during import.** Rejected because governance and verification workflows need to know what evidence was lost or not understood.

## Drawbacks

- Supporting external contract formats adds mapping maintenance.
- Import diagnostics may be verbose because contract formats contain operational, business, policy, and technical fields.
- Users may expect imported declarations to behave like verified facts unless reports are explicit about assurance.
- Product topology can expand the evidence graph substantially even when the relational plan is small.
- Lossless import is not always possible, especially for custom quality implementations or organization-specific properties.

## Implementation architecture

This section is non-normative. A practical implementation can start with schema validation and normalized evidence extraction for Open Data Contract Standard, then add Open Data Product Standard topology import and legacy Data Contract Specification migration import. The importer can emit a contract artifact record, normalized evidence records, and mapping diagnostics into governed bundles and evidence graph projections.

## Layers affected

- **InQL specification** — data contract artifact, normalized contract evidence, product topology, and mapping coverage vocabulary become part of the evidence model.
- **InQL library package** — import and inspection APIs should be able to ingest supported contract artifacts and expose normalized evidence records.
- **Execution / interchange** — exchange bridges may import contract tests, external CLI results, source bindings, product ports, and contract dependency evidence.
- **Documentation** — docs must explain that contract declarations are imported evidence and not verified data facts.

## Unresolved questions

- Which Open Data Contract Standard clauses are required for a conforming InQL importer?
- Which Open Data Product Standard clauses are required before product topology is considered supported?
- Should legacy Data Contract Specification import be required or optional?
- What canonical artifact fingerprint profile should be recommended for YAML contract files?
- How should conflicting declarations from multiple contract artifacts be projected into current evidence state?
- Should contract import expose author-facing APIs, CLI-only tooling, or both?

<!-- When every question is resolved, rename this section to **Design Decisions**, group answers under ### Resolved, and remove this comment. -->

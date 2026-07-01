# InQL RFC 047: Semantic evidence graph and agent query surface

- **Status:** Draft
- **Created:** 2026-06-20
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 029 (typed metadata attachments)
  - InQL RFC 030 (Prism lineage graph)
  - InQL RFC 031 (local inspection APIs and artifacts)
  - InQL RFC 032 (execution observations)
  - InQL RFC 033 (adapter requirements and coverage)
  - InQL RFC 034 (quality assertions and observations)
  - InQL RFC 035 (governed attributes and policy checkpoints)
  - InQL RFC 036 (governed plan bundle)
  - InQL RFC 037 (plan diff and blast-radius inputs)
  - InQL RFC 038 (evidence exchange bridges)
  - InQL RFC 040 (interoperability semantic profiles)
  - InQL RFC 042 (async verification evidence)
  - InQL RFC 044 (verifier statements and proof artifacts)
  - InQL RFC 045 (constraint evidence and verification-aware planning)
  - InQL RFC 046 (data contract ingress and product topology)
- **Issue:** [InQL #82](https://github.com/encero-systems/InQL/issues/82)
- **RFC PR:** —
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** —

## Summary

This RFC defines a semantic evidence graph and deterministic agent query surface for InQL. The graph is a projection over InQL evidence records, not a new source of truth: declared contracts, Prism semantic lineage, imported catalog evidence, runtime observations, adapter coverage, verification observations, proof artifacts, waivers, product topology, and governed bundle records can be queried together through stable node and edge families with provenance, assurance, coverage, time, snapshot, and diagnostic context preserved.

## Core model

1. The evidence graph is a projection over evidence records.
2. Graph nodes and edges must keep their evidence basis, source, assurance, scope, and diagnostics.
3. Declared, semantic, observed, verified, and proven relationships are different relationship layers.
4. Absence of an edge means no usable evidence was selected, not proof that no relationship exists.
5. Agent-facing tools must execute bounded deterministic queries over the graph and return evidence-backed results.
6. The graph can project to property graph stores, OpenLineage-shaped views, provenance records, or local inspection artifacts without making any projection format the semantic owner.

## Motivation

Lineage, contract, observability, quality, and verification questions are naturally graph questions. A user may need to ask where a business term or output field comes from, which products depend on a contract, which runtime jobs wrote a dataset, which outputs depend on waived evidence, which source fields contribute to a metric, or what changes if a model, field, source, contract, or profile changes. The existing RFCs define the evidence families needed to answer those questions, but they do not yet define one graph-shaped query surface that composes them.

Recent open lineage and graph-observability work reinforces the split InQL should preserve. Runtime OpenLineage events describe what jobs actually ran and which datasets they read or wrote. Semantic lineage and contract metadata describe what a field, term, model, or product is supposed to mean. Verification observations describe which claims have actually been checked and with what assurance. A graph query surface is useful precisely because it can traverse all of those layers while preserving their different evidence basis.

## Goals

- Define an InQL semantic evidence graph projection.
- Define stable node and edge families for evidence-backed graph queries.
- Preserve provenance, assurance, lifecycle, outcome, coverage, profile context, snapshot context, and diagnostics on graph elements.
- Support deterministic impact, provenance, dependency, verification, and contract-topology queries.
- Define an agent query surface that returns bounded evidence-backed answers and refuses to infer absent mappings.
- Allow projection to property graph tables, openCypher-compatible stores, OpenLineage-shaped views, W3C PROV, local artifacts, and governed bundles.
- Keep graph storage, graph database choice, hosted query services, and conversational UI outside InQL core.

## Non-Goals

- Defining a graph database, graph storage engine, or hosted graph service.
- Replacing Prism lineage, OpenLineage runtime events, contract artifacts, verification observations, or governed bundles.
- Defining natural-language agent behavior, prompt formats, chat UX, or autonomous remediation.
- Treating graph traversal as proof of data correctness.
- Treating runtime lineage as equivalent to authored semantic lineage.
- Treating declared contracts as equivalent to verified observations.
- Defining a complete graph query language.

## Guide-level explanation (how authors think about it)

An author or tool can build a graph projection from a governed bundle and selected evidence records:

```incan
graph = evidence_graph(
    bundle,
    include=[
        "semantic_lineage",
        "contracts",
        "runtime_observations",
        "verification",
        "product_topology",
    ],
)
```

The graph can answer provenance questions without asking a model to infer lineage from raw logs:

```incan
graph.where_does_field_come_from("orders.total_amount")
```

A result is a path with evidence on every hop:

```text
orders.total_amount
  <- value_lineage verified by prism-plan:...
payments.amount
  <- runtime_observed attested by openlineage-run:...
raw_payments.amount
```

If the graph has no mapping for a term or field, the query returns no evidence instead of inventing a path:

```text
query=where_does_term_come_from("Margin")
result=no_evidence
diagnostic=no selected evidence graph node matched term Margin
```

The same graph can answer impact questions:

```incan
graph.what_depends_on(target("payments.amount"))
graph.which_outputs_depend_on(assurance="waived")
graph.which_products_consume_contract("customer-contract")
graph.which_runtime_jobs_wrote(target("analytics.orders"))
```

For streaming and async verification evidence, graph queries are relative to a selected observation window, snapshot, or watermark. A graph projection can therefore show that a relation was unknown yesterday, sampled this morning, verified for one watermark, and later proven for a bounded result without overwriting the older evidence.

## Reference-level explanation (precise rules)

An evidence graph projection must include graph identity, projection profile, selected evidence artifact set, selected observation window, selected snapshot or watermark context when applicable, graph build time, graph schema version, node records, edge records, projection diagnostics, and mapping coverage.

A graph node record must include node identity, node kind, semantic target reference when applicable, evidence basis, source artifact reference, assurance summary when applicable, lifecycle or status when applicable, profile context, snapshot or watermark context when applicable, visibility and redaction metadata, and diagnostics.

A graph edge record must include edge identity, edge kind, source node identity, target node identity, direction, evidence basis, relationship layer, assurance summary when applicable, lifecycle or status when applicable, scope, coverage, profile context, snapshot or watermark context when applicable, evidence references, and diagnostics.

Node kind should include at least:

- semantic_target
- relation
- field
- expression
- plan
- result
- contract_artifact
- contract_clause
- data_product
- product_port
- source_binding
- quality_assertion
- quality_observation
- constraint
- execution_run
- runtime_lineage_event
- verification_assertion
- verification_run
- verification_observation
- verifier_statement
- proof_artifact
- profile
- adapter_capability
- waiver
- external_artifact

Edge kind should include at least:

- value_lineage
- control_lineage
- grouping_lineage
- ordering_lineage
- join_lineage
- derives_from
- reads
- writes
- consumes
- produces
- measures
- constrains
- asserts
- observes
- verifies
- proves
- waives
- depends_on
- imports_from
- exports_to
- binds_to
- requires_profile
- requires_capability
- affects

Relationship layer must distinguish at least declared, semantic, observed, verified, proven, waived, imported, and projected relationships. A declared relationship from a contract, an observed relationship from runtime lineage, a semantic relationship from Prism, and a verified relationship from a verification observation must not collapse into the same edge without preserving their layer and basis.

Graph projection rules must preserve InQL lineage kinds. Value lineage, control lineage, grouping lineage, ordering lineage, join lineage, and other Prism lineage distinctions must not be flattened to a generic dependency edge unless the projection explicitly reports mapping loss.

OpenLineage runtime events may project to run, job, dataset, read, write, input, output, and facet-backed nodes or edges. Runtime events must remain observed or attested evidence unless InQL evidence verifies the corresponding claim.

Contract and product artifacts may project to contract, clause, product, port, and dependency nodes or edges. Imported contract facts must retain their source artifact and must not become verified graph relationships by default.

Verification observations, constraint evidence, verifier statements, proof artifacts, and waivers may project to graph nodes and edges. Graph queries that summarize current state must identify the projection rule used to select current observations.

Graph projections must be open-world. A missing edge means that the selected evidence set does not contain a usable relationship for the query. It must not be reported as proof that no relationship exists unless a separate negative verification observation establishes that claim.

Agent-facing query tools must be deterministic. A tool may accept natural-language-adjacent parameters such as a term name, field path, contract identifier, or relation name, but it must resolve those parameters through graph nodes and return graph evidence records, paths, summaries, or `no_evidence`. It must not fabricate edges, infer missing mappings from names alone, or upgrade assurance.

Agent-facing query results must include enough evidence for audit. At minimum, a result should include matched nodes, traversed edges, evidence basis, source artifacts, assurance labels, coverage, diagnostics, and omitted or unsupported mappings when relevant.

Graph queries must be bounded. A query surface should require depth, target kind, scope, filter, time window, snapshot, watermark, or result-size bounds when an unbounded traversal could produce excessive or misleading results.

Graph projections must preserve redaction. Sensitive payloads, private examples, raw SQL, credentials, connector details, and restricted metadata must not be exposed through graph projection merely because a graph store or agent tool can carry string properties.

Governed plan bundles may include graph projection manifests, graph node and edge tables, graph query result artifacts, and graph projection diagnostics. Bundles must distinguish graph projection absence from a graph projection that was attempted but incomplete.

## Design details

### Syntax

This RFC introduces no InQL query syntax or graph query language. Graph construction, export, and agent query functions are inspection and artifact surfaces. Future syntax may reference graph queries, but it must lower to the same graph projection and query-result records.

### Semantics

The graph is a navigable evidence index. It does not redefine relational semantics, lineage semantics, quality semantics, verification semantics, or proof semantics. Those remain owned by their respective RFCs.

The graph may materialize edges from multiple sources that disagree. Conflict is represented as graph evidence with different basis, outcome, assurance, source, or diagnostics, not by deleting one side silently.

### Interaction with other InQL surfaces

RFC 028 provides semantic target identities for graph nodes.

RFC 030 provides Prism semantic lineage and lineage kinds that graph edges must preserve.

RFC 032 provides execution observations and runtime facts that may project to observed graph relationships.

RFC 034 provides quality assertions and observations that may project to assertion and observation graph nodes.

RFC 036 governed plan bundles may carry graph projections and query result artifacts.

RFC 037 plan diff and blast-radius inputs can consume graph traversal results for impact analysis.

RFC 038 evidence exchange bridges may import or export graph-shaped projections.

RFC 042 verification observations and RFC 045 constraint evidence provide assurance-aware graph state.

RFC 046 contract and product ingress provides contract, clause, product, port, and dependency topology for graph projection.

### Standards alignment

OpenLineage is the primary runtime lineage exchange surface for run, job, dataset, and facet-shaped observed evidence. Its model should be projected into the evidence graph without making OpenLineage the internal semantic lineage model.

W3C PROV can represent graph evidence as entities, activities, agents, derivations, generated-by relationships, used relationships, and responsibility links. OpenTelemetry can carry trace and span correlation for graph-linked execution and verification work. W3C Data Quality Vocabulary can project quality metrics and measurements. Open Data Contract Standard and Open Data Product Standard can seed contract and product topology nodes. in-toto, SLSA provenance, W3C Verifiable Credentials, JSON Web Signature, COSE, and canonical signed payload specifications can provide signed attestation envelopes when bridge profiles support them.

Property graph tables, openCypher-compatible stores, RDF-shaped stores, and graph visualization tools may be projection targets. None of those storage or query formats is the internal source of InQL evidence semantics.

### Compatibility / migration

This RFC is additive. Existing bundles and evidence records remain valid without graph projections.

If a graph projection profile changes node identities, edge identities, or mapping rules, the graph schema version or projection profile must change. Consumers must not assume that graph node identifiers from one projection profile are stable under another profile unless the profile declares that compatibility.

## Alternatives considered

- **Use OpenLineage as the whole graph model.** Rejected because runtime job and dataset events are necessary but do not carry all InQL semantic targets, declared contracts, verification assurance, proof artifacts, waivers, or Prism lineage kinds.
- **Use Prism lineage as the whole graph model.** Rejected because Prism semantic lineage does not by itself cover runtime observations, product topology, imported contracts, quality observations, or verification state.
- **Require a specific graph database.** Rejected because InQL should define evidence semantics and projections, not storage infrastructure.
- **Let agents read raw artifacts directly.** Rejected because agents should call deterministic tools over bounded evidence, not infer lineage or assurance from unstructured logs.
- **Flatten all relationships to `depends_on`.** Rejected because declared, semantic, observed, verified, proven, and waived relationships carry different meaning and risk.

## Drawbacks

- Graph projection adds another view that must stay consistent with source evidence.
- Large evidence sets can create large graph projections and require careful query bounds.
- Users may misread observed runtime edges as semantic lineage unless reports preserve relationship layer.
- Agent tool surfaces need conservative diagnostics to avoid overconfident answers.
- Projection profiles must be versioned carefully to avoid breaking graph consumers.

## Implementation architecture

This section is non-normative. A practical implementation can emit graph node and edge tables into local artifacts, expose deterministic inspection helpers for common provenance and impact questions, and optionally export to property graph stores or OpenLineage/PROV-shaped projections. Agent tools can wrap the same helpers and return evidence-backed paths rather than asking a language model to derive graph relationships.

## Layers affected

- **InQL specification** — graph node, edge, projection, and agent query-result vocabulary become part of the evidence model.
- **InQL library package** — inspection APIs should be able to construct graph projections and answer bounded graph queries.
- **Execution / interchange** — exchange bridges may import OpenLineage events and export property graph, OpenLineage, PROV, or telemetry-shaped projections.
- **Documentation** — docs must explain declared, semantic, observed, verified, proven, waived, imported, and projected relationship layers.

## Unresolved questions

- Which node and edge kinds are required for a conforming graph projection profile?
- Should graph query result artifacts use paths, tables, subgraphs, or all three?
- Which common graph queries should be standardized before this RFC advances beyond Draft?
- What redaction metadata is required on graph nodes and edges?
- Should property graph export be a required bridge profile or an optional integration profile?
- How should conflicting evidence from declared, observed, and verified layers be summarized in agent-facing answers?

<!-- When every question is resolved, rename this section to **Design Decisions**, group answers under ### Resolved, and remove this comment. -->

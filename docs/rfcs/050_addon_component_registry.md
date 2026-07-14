# IncQL RFC 050: Addon component registry and package contract

- **Status:** Draft
- **Created:** 2026-07-11
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - IncQL RFC 002 (Apache Substrait integration)
  - IncQL RFC 004 (execution context)
  - IncQL RFC 007 (Prism logical planning and optimization engine)
  - IncQL RFC 009 (session format handler registry)
  - IncQL RFC 014 (function registry and catalog governance)
  - IncQL RFC 027 (relational evidence program)
  - IncQL RFC 032 (execution observations)
  - IncQL RFC 033 (adapter requirements and coverage)
  - IncQL RFC 040 (interoperability semantic profiles)
  - IncQL RFC 041 (Prism plan ingress and external client frontends)
  - IncQL RFC 048 (cluster execution backend mode)
- **Issue:** [IncQL #101](https://github.com/encero-systems/IncQL/issues/101)
- **RFC PR:** [IncQL #102](https://github.com/encero-systems/IncQL/pull/102)
- **Written against:** Incan 0.4.0 and IncQL 0.1.0
- **Shipped in:** —

## Summary

This RFC defines the package and registry contract through which ordinary Incan packages can extend IncQL with data connectors, compute runtimes, plan-ingress frontends, and evidence providers. An addon package may provide several components, but each component must be registered, identified, selected, inspected, and versioned independently. IncQL must keep pure component descriptors separate from executable hooks, use open namespaced component identifiers instead of backend or source enums, freeze a registry snapshot at an execution or frontend boundary, and keep read/write components separate from the runtime that computes a plan. DataFusion remains the built-in default runtime and first registry-shaped implementation; DuckDB is the first external proof target rather than a privileged core backend.

## Motivation

IncQL's current execution path is appropriate for proving DataFusion integration, but it does not scale to an ecosystem. Adding another backend currently tends to require edits to core backend enums, source enums, session dispatch, public exports, the core package manifest, and source registration logic. That makes every integration a core feature and encourages one backend object to absorb source reading, sink writing, computation, capability reporting, and configuration.

The desired platform is broader. PostgreSQL may be a bounded reader and writer while DuckDB performs local computation, or PostgreSQL may also provide a SQL-pushdown runtime. Kafka is primarily a streaming connector. Spark may provide a compute runtime and a Spark Connect ingress frontend without owning the underlying storage. Snowflake may provide table connectors, warehouse compute, Snowpipe writers, streaming ingestion, catalog access, and observations as separate components in one package. Open table formats may provide connector and catalog components without providing compute at all.

Treating each platform as one monolithic adapter hides those differences and makes composition accidental. Treating Substrait as the plugin contract is also insufficient: Substrait carries logical plans, but it does not install code, bind credentials, inspect catalogs, negotiate connector/runtime compatibility, manage streams, or report component metadata.

IncQL therefore needs a stable addon boundary before more vendor integrations are implemented. The boundary must fit Incan's package, manifest, feature, and lockfile model; preserve Prism as the owner of relational meaning; and integrate with adapter coverage, semantic profiles, execution observations, and plan ingress without merging those layers.

## Goals

- Define ordinary Incan packages as the installation and sideloading unit for IncQL addons.
- Define independently registered data connector, compute runtime, plan ingress, and evidence provider component kinds.
- Replace closed backend and source identities with stable, namespaced component identifiers and open source, sink, runtime-mode, and capability keys.
- Separate pure, inspectable component descriptors from executable component hooks and live runtime state.
- Define deterministic registration, collision, compatibility, freezing, and lookup rules.
- Keep source and sink bindings independent from compute-runtime selection.
- Define how a Session owns a frozen addon registry and an explicit default runtime selection.
- Define how connector/runtime compatibility is assessed without promising that every installed connector can feed every installed runtime.
- Make built-in DataFusion components use the same contracts as external components.
- Connect component identity and declarations to RFC 033 coverage, RFC 040 semantic profiles, RFC 032 observations, and RFC 041 ingress coverage.
- Keep credentials, live handles, and backend-native objects out of descriptors, Prism plans, Substrait plans, lockfiles, and ordinary inspection artifacts.
- Leave room for path, Git, and registry-resolved addon packages without requiring runtime dynamic loading.

## Non-Goals

- Specifying DuckDB, PostgreSQL, Spark, Snowflake, Kafka, or any other vendor integration in detail.
- Implementing an Incan package registry or marketplace.
- Defining commercial packaging, billing, licensing, or Databricks Marketplace behavior.
- Defining a general-purpose native shared-library ABI or loading arbitrary code from a runtime directory.
- Guaranteeing that arbitrary connector and runtime combinations are compatible.
- Defining every source, sink, stream, CDC, catalog, or execution capability key.
- Defining the physical data-transfer implementation between every connector and runtime pair.
- Defining credential storage, IAM, secret resolution, or network policy.
- Changing Prism ownership of logical meaning or making addon descriptors authoritative semantic plans.
- Defining full streaming semantics, cluster scheduling, or external protocol coverage; sibling RFCs own those contracts.

## Guide-level explanation (how authors think about it)

### Installing an addon

An addon is an ordinary Incan package dependency. Local development and private sideloading begin with path dependencies:

```toml
[dependencies]
incql = { path = "../IncQL" }
incql-duckdb = { path = "../incql-duckdb" }
incql-postgres = { path = "../incql-postgres" }
```

The eventual registry-resolved form uses the same package contract:

```toml
[dependencies]
incql = "0.1"
incql-duckdb = { version = "0.1", features = ["httpfs", "iceberg"] }
incql-postgres = { version = "0.1", features = ["copy", "logical-replication"] }
```

Depending on or importing a package makes its checked code and descriptor metadata available. It must not silently mutate a process-global registry or change which runtime a Session uses.

### Building a registry and session

Addon packages expose typed component constructors. Authors install the components they intend to use and select the compute runtime explicitly:

```incan
from pub::incql import AddonRegistry, Session
from pub::incql_duckdb import duckdb
from pub::incql_postgres import postgres

registry = AddonRegistry.builtins()
registry.install(duckdb.files())?
registry.install(duckdb.local_runtime())?
registry.install(postgres.tables())?

session = (
    Session.builder()
    .with_registry(registry)
    .with_runtime(duckdb.local_selection())
    .build()?
)
```

The exact constructor names are illustrative. The contract is that installation and runtime selection are explicit, and `Session.build()` freezes the registry snapshot used by that Session.

A source descriptor names its connector independently from the selected runtime:

```incan
orders = postgres.table("analytics.orders")
session.register("orders", orders)?
```

This does not imply that DuckDB can consume every PostgreSQL binding. Before execution, IncQL must ask the connector and selected runtime whether they have a compatible binding path and must evaluate the plan's adapter requirements. If no compatible route exists, the Session reports structured uncovered or unknown coverage rather than silently changing runtime or materializing through an undocumented fallback.

### One package, several components

An addon package is a distribution unit, not a semantic component. For example, an `incql-snowflake` package may expose separate table connector, warehouse runtime, Snowpipe writer, Snowpipe Streaming writer, catalog inspector, and observation provider components. An `incql-spark` package may expose a Spark runtime and Spark Connect ingress frontend. Installing one component must not imply that the others are installed or selected.

This separation also allows a package to expose convenient bundles without collapsing component identity:

```incan
registry.install_all(duckdb.local_bundle())?
```

`local_bundle()` may return a file connector and local compute runtime, but inspection must still show two component descriptors and two component identities.

### Inspecting what is available

Tools should be able to distinguish package availability, component installation, runtime selection, declared capabilities, contextual coverage, and runtime readiness:

```incan
for descriptor in session.addons().components():
    print(descriptor.id, descriptor.kind, descriptor.package.version)

report = session.check_plan_coverage(summary)
```

A descriptor's capability declaration is discoverability metadata. It is not proof that one plan is covered under one binding. RFC 033 coverage remains the contextual answer.

## Reference-level explanation (precise rules)

### Terminology and ownership

An **addon package** is an Incan package that depends on IncQL and exports one or more addon components.

An **addon component** is one independently identified implementation of a known IncQL extension boundary. Components are the unit of registration, lookup, compatibility checks, inspection, and runtime selection.

A **component descriptor** is serializable metadata describing one component. A descriptor must be inspectable without opening network connections, resolving credentials, loading data, or creating backend-native runtime state.

An **executable component** is checked code that implements the hook contract for exactly one component kind. Executable hooks and live resources are not part of the descriptor.

An **addon registry** contains descriptors and executable component factories or implementations under the same component identities. A registry is scoped to the Session, frontend service, inspection operation, or other explicit owner that receives it. IncQL must not rely on an implicitly mutable process-global registry.

An **addon bundle** is a convenience value containing multiple independently registered components. A bundle is not a component kind and does not receive one combined identity.

Prism remains the owner of analyzed relational meaning. Components may supply bindings, execution, ingress decoding, compatibility evidence, and observations, but they must not replace Prism semantic targets or redefine lineage.

### Component kinds

IncQL must define these top-level component kinds:

| Component kind | Responsibility | Representative surfaces |
| --- | --- | --- |
| `data_connector` | Describe, inspect, bind, read, or write external data and catalogs | bounded reader, bounded writer, stream reader, stream writer, CDC reader, catalog inspector, schema inspector |
| `compute_runtime` | Check execution coverage and execute Prism/Substrait-backed plans | local execution, SQL pushdown, warehouse execution, cluster execution, bounded execution, streaming execution, collection |
| `plan_ingress` | Decode an external authoring or client protocol into Prism-owned unresolved ingress structures | SQL frontend, Spark Connect frontend, notebook/client protocol, command ingress |
| `evidence_provider` | Observe external or runtime facts and produce typed evidence without owning relational meaning | query/job observations, offsets, snapshots, table versions, pipeline runs, runtime profiles |

The top-level kinds are closed because each kind has a different trusted hook contract. Surface and capability identifiers within a kind are open, namespaced public vocabulary.

One component must implement one top-level kind. A package that supports several kinds must publish several descriptors. Data reading, writing, and catalog inspection may share one `data_connector` component when they share lifecycle and configuration, but those surfaces must remain individually declared.

Plan ingress is not a compute runtime. Evidence provision is not plan analysis. A connector is not automatically a runtime merely because its target system can execute SQL.

### Component identity and versions

Each component descriptor must contain a stable component id. Component ids must be lowercase, dot-separated, namespaced ASCII identifiers such as `incql.datafusion.local`, `incql.duckdb.files`, or `vendor.postgres.tables`. Package names and component ids need not be identical because one package may publish several components.

A component id identifies a contract across compatible package releases. A package must not reuse an id for a component of another kind or for behavior that violates the previous component contract.

Versioning must distinguish:

- addon package version
- IncQL addon API version required by the component
- descriptor schema version
- component or provider version when it differs from the package version
- external engine or protocol version, which belongs in semantic profiles or runtime observations rather than package identity

The registry must reject a component whose required addon API version is incompatible with the IncQL version constructing the registry.

### Component descriptor

The normative descriptor shape is conceptually:

```incan
pub model AddonPackageDescriptor:
    pub name: str
    pub version: str
    pub source_identity: str
    pub enabled_features: list[str]
    pub requires_incql: str

pub enum AddonComponentKind(str):
    DataConnector = "data_connector"
    ComputeRuntime = "compute_runtime"
    PlanIngress = "plan_ingress"
    EvidenceProvider = "evidence_provider"

pub model AddonComponentDescriptor:
    pub id: str
    pub kind: AddonComponentKind
    pub display_name: str
    pub package: AddonPackageDescriptor
    pub addon_api_version: str
    pub descriptor_schema_version: str
    pub component_version: str
    pub surfaces: list[str]
    pub capabilities: list[str]
    pub binding_protocols_produced: list[str]
    pub binding_protocols_consumed: list[str]
    pub semantic_profiles: list[str]
    pub evidence_target_kinds: list[str]
    pub configuration_schema: str
```

Field names may be adjusted to fit established IncQL naming conventions, but implementations must preserve these facts and distinctions.

Descriptor surfaces say which hook families a component exposes. Capability declarations say which RFC 033 capability families the component knows how to assess or may cover. They must not use `supported` as a substitute for contextual coverage. Stability labels such as experimental, preview, and stable may qualify a surface, but they must remain distinct from covered, partially covered, uncovered, and unknown.

Binding protocol identifiers describe data-plane contracts a connector can produce or consume and a runtime can consume or produce. They are compatibility declarations, not live bindings. Protocol ids must be stable public vocabulary when serialized or used for routing.

`configuration_schema` identifies an inspectable schema for non-secret configuration and secret-reference fields. The descriptor must not contain credentials, resolved secrets, connection handles, callbacks, backend-native objects, or mutable runtime state.

Descriptor facts must be deterministic for a resolved package and feature set. Tooling must be able to compute or record a descriptor fingerprint.

### Executable component contracts

IncQL must expose a distinct executable hook contract for each component kind rather than one optional-method object that can do everything.

A data connector contract must be able to expose the surfaces it declares, including as applicable:

- validate a source or sink descriptor
- inspect catalog and schema information
- prepare a bounded or streaming source binding
- prepare a bounded or streaming sink binding
- expose the binding protocol used by a prepared binding
- read, subscribe, write, commit, abort, or close according to the declared surface
- report connector-specific requirements, coverage evidence, diagnostics, and observations

A compute runtime contract must be able to expose the surfaces it declares, including as applicable:

- validate a runtime selection
- evaluate plan and binding requirements under a semantic profile
- report RFC 033 coverage before execution when possible
- prepare or lower a Prism/Substrait-backed plan for the runtime
- execute bounded or streaming work
- collect bounded results
- return execution handles and RFC 032 observations
- cooperate with connector-owned sink commit behavior without taking ownership of the sink descriptor

A plan ingress contract must follow RFC 041. It may decode transport or protocol requests, preserve origin and client-session evidence, and produce Prism-owned unresolved ingress structures or structured diagnostics. It must not execute the plan or make the external protocol the semantic owner.

An evidence provider contract may observe declared target classes and emit typed evidence records. It must identify the source and lifecycle of its evidence and must not mutate Prism plans, silently change runtime selection, or convert an observation into authoritative semantic meaning.

The exact Incan mechanism for executable hooks may be nominal interfaces, checked protocols, generated dispatch records, or another typed mechanism. It must preserve the kind-specific contracts and must not reduce them to untyped callback maps.

### Registry lifecycle and registration

`AddonRegistry.builtins()` must return a registry containing IncQL's built-in component descriptors and executable implementations. `AddonRegistry.empty()` may be provided for tooling or controlled environments.

Installing a component must:

1. validate descriptor structure and component id
2. validate addon API compatibility
3. validate that the executable hook kind matches the descriptor kind
4. compute or accept the deterministic descriptor fingerprint
5. reject an identity collision when the same id is already registered with a different kind, package identity, version, feature set, or descriptor fingerprint
6. treat exact reinstallation of the same component identity and fingerprint as idempotent
7. record the package and feature provenance needed for inspection

Installation must not open external connections, resolve secrets, scan catalogs, read data, or initialize a compute engine. Resource initialization occurs only when a registry owner prepares or uses the component.

Importing an addon package must not auto-install a component into a hidden global registry. Package code may expose a bundle or helper that explicitly installs several components into a caller-owned registry.

`Session.build()` must freeze the supplied registry and store a stable snapshot or snapshot identity. A component may maintain session-scoped mutable runtime state after initialization, but the set of registered component ids and descriptor facts must not change for that Session. Adding or replacing components requires building a new Session.

Frontend services and inspection tools may own registry snapshots without constructing an execution Session. They must follow the same registration and freezing rules for the lifetime of one reproducible operation or service configuration.

### Open source, sink, and runtime descriptors

Core IncQL must replace closed source and backend enums with open descriptors. The normative conceptual shapes are:

```incan
pub model AddonOption:
    pub key: str
    pub value_schema: str
    pub value: str

pub model SourceDescriptor:
    pub connector_id: str
    pub source_kind: str
    pub locator: str
    pub options: list[AddonOption]

pub model SinkDescriptor:
    pub connector_id: str
    pub sink_kind: str
    pub locator: str
    pub options: list[AddonOption]

pub model RuntimeSelection:
    pub runtime_id: str
    pub runtime_mode: str
    pub options: list[AddonOption]
```

`value_schema` must make option interpretation explicit. A future typed configuration-value carrier may replace the textual storage field without changing the requirement that values have declared schemas.

`source_kind`, `sink_kind`, and `runtime_mode` are component-owned open keys. Core IncQL must not add an enum variant for every external format, table type, topic type, warehouse mode, or runtime.

A source or sink descriptor must identify the connector that owns its interpretation. A descriptor must not select the compute runtime. A runtime selection must identify an installed `compute_runtime` component and must not imply installation of any connector from the same package.

Logical relation names remain Session/Prism identities and are not fields of the physical source descriptor. Session registration maps a logical name to a source descriptor and keeps the resulting live binding outside Prism and Substrait.

### Connector and runtime compatibility

Installing a connector and runtime in the same registry does not establish that they can interoperate.

A connector must resolve a source or sink descriptor into a session-private prepared binding. The binding must declare a stable binding protocol id and the schema, boundedness, and relevant capability facts needed for compatibility checks. Live binding handles must remain outside serializable plans and descriptors.

A compute runtime must declare which binding protocols it can consume or produce and must evaluate compatibility for the concrete binding, plan, runtime mode, and semantic profile. Compatibility may be direct and backend-native, mediated through Arrow or another interchange, or unavailable.

When a package provides both a connector and compute runtime, the runtime may consume a package-native binding protocol. That does not merge the two components. For example, a PostgreSQL table connector and PostgreSQL SQL-pushdown runtime may cooperate directly while remaining separately selectable and inspectable.

If no compatible binding path is available, execution must fail before data movement when possible with a structured binding or coverage diagnostic. IncQL must not assume an Arrow materialization fallback, silently choose another runtime, or ask the connector to select a runtime.

Sink compatibility must include commit and failure semantics. A runtime that can compute a result is not automatically able to commit it to an installed sink. Connector-owned commit, abort, retry, replay, and streaming guarantees must remain visible in coverage and observations.

### Runtime selection and routing

A Session must have one explicit default `RuntimeSelection`. `Session.default()` must select the built-in DataFusion local runtime through the registry-shaped path.

An execution API may accept an explicit runtime override. The override must reference an installed compute runtime and must be recorded in inspection or execution evidence.

Future routing policy may choose among several installed runtimes, but it must evaluate connector/runtime compatibility and RFC 033 requirements, record the selected component and reasons, and never change logical meaning. Silent fallback after an uncovered requirement or runtime failure is forbidden unless an explicit policy permits it and records the attempt and fallback as evidence.

The connector that owns a source or sink must not implicitly become the default compute runtime. SQL pushdown is a compute-runtime mode, not an automatic property of reading from a SQL source.

### Capabilities, profiles, and evidence

Descriptor capability declarations are static discoverability metadata. RFC 033 adapter requirements and coverage records are contextual evidence for a plan, binding, component version, runtime mode, and semantic profile.

Coverage records must identify the component id, package or component version, descriptor fingerprint when available, and semantic profile when relevant. Unknown coverage must remain unknown.

RFC 040 semantic profiles may be declared or consumed by components, but profile declarations do not let a component redefine Prism semantics. Requested and observed runtime profiles must remain distinguishable.

RFC 032 execution observations must identify the compute runtime and relevant connector components that produced the observation. Connector observations such as offsets, snapshots, table versions, and sink commits must remain attributable to the connector or evidence provider that observed them.

RFC 041 ingress coverage is distinct from execution adapter coverage. A plan-ingress component accepting a Spark Connect node does not imply that the selected compute runtime can execute the resulting Prism plan.

Evidence providers are non-authoritative sources under RFC 027. Registration grants them no right to create Prism semantic identities, redefine lineage, or mark requirements covered without evidence.

### Package, feature, and lockfile contract

Addon distribution must use Incan package resolution. Local path dependencies are the first required sideloading mechanism. Git and registry-resolved dependencies may be added by the Incan package system without changing the IncQL component contract.

Addon-specific Rust dependencies, native build requirements, and generated bindings belong to the addon package rather than core IncQL unless they are required by a built-in component.

Package features may enable or disable component surfaces, optional components, or capability implementations. A resolved descriptor must reflect the actual enabled feature set. Core IncQL should not become the primary feature bundle for provider-specific integrations such as `spark`, `snowflake`, or `postgres`.

The resolved dependency and lock model must eventually preserve enough information to reproduce addon availability:

- package name, version, and source identity
- enabled package features
- transitive package and Rust dependency resolution
- required IncQL addon API version
- component ids and descriptor fingerprints
- native or system requirements when the package manager can represent them

The component registry must still function for path-based packages before every future registry and lockfile feature is implemented.

### Security and resource lifecycle

Descriptors, manifests, lockfiles, Prism plans, Substrait plans, and ordinary evidence exports must not contain passwords, access tokens, private keys, credential-bearing connection strings, or live credential values.

Configuration schemas may declare secret-reference fields, environment variable names, credential profile ids, or opaque storage-profile ids. Runtime initialization resolves those references through an explicitly supplied operational facility outside this RFC.

Component installation must be side-effect free with respect to external systems. Component initialization, connection creation, subscriptions, background tasks, and native resources must be scoped to an explicit Session or frontend lifecycle and must be released when that owner closes.

Inspection must be able to report that required configuration or credentials are unavailable without exposing secret values.

### Errors, diagnostics, and inspection

The registry and Session must distinguish at least:

- invalid component descriptor
- invalid or duplicate component id
- incompatible addon API version
- component identity collision
- executable hook kind mismatch
- missing component
- wrong component kind
- invalid component configuration
- unavailable credential or configuration reference
- unsupported binding protocol
- connector/runtime incompatibility
- uncovered or unknown required capability
- component initialization failure
- connector, runtime, ingress, and evidence-provider operation failures

Diagnostics must preserve component id, component kind, package identity and version, operation stage, and relevant source, sink, runtime mode, or protocol key. Backend-native error context should be retained without leaking secrets.

Inspection APIs must distinguish:

- package dependency available to the build
- component descriptor available to tooling
- executable component installed in one registry
- component selected as a default or override
- component initialized and runtime-ready
- declared capability or binding protocol
- contextual RFC 033 coverage
- missing configuration or credentials
- registry snapshot identity or fingerprint

## Design details

### Syntax

This RFC introduces no IncQL query syntax. It defines IncQL package and library contracts around Session, Prism frontends, and evidence tooling.

API names in examples are illustrative where the reference-level rules do not prescribe an exact name. The component kinds, identity distinctions, descriptor/runtime separation, explicit registration, frozen registry lifecycle, open binding descriptors, and connector/runtime split are normative.

### Semantics

Installing a component changes available implementation capability; it does not change the meaning of an existing Prism plan. Selecting a compute runtime changes execution placement and available coverage, not logical semantics.

Addon metadata is evidence and configuration. It is not a truth store for fields, expressions, lineage, or query meaning.

Component composition must be explicit. A package relationship, shared vendor name, or shared connection configuration must not be used as an implicit signal that connector, runtime, ingress, or evidence components are installed or compatible.

### Interaction with other IncQL surfaces

- RFC 002 remains the logical interchange boundary. Component registration and physical bindings must not be encoded as ad hoc Substrait semantics.
- RFC 004 remains the Session and execution-context contract. This RFC refines its backend reference into a registry-owned runtime selection and its source/sink identifiers into connector-owned descriptors.
- RFC 007 keeps Prism as semantic owner. Compute and ingress components feed or execute Prism plans without redefining them.
- RFC 009's format-handler contract, if retained, becomes an implementation strategy or subordinate surface of a data connector. IncQL must not maintain a second independent plugin root that can bypass component identity, package provenance, registry freezing, or connector/runtime compatibility checks.
- RFC 014's declaration-side function registry is prior art for stable ids and inspectable metadata, but addon registration is explicitly owner-scoped because components carry resources and external behavior.
- RFC 032 observations must identify the components involved in execution and I/O.
- RFC 033 owns requirement and coverage semantics; this RFC supplies stable component identity and declarations used by those records.
- RFC 040 profiles contextualize ingress and execution compatibility without becoming component identity.
- RFC 041 plan ingress uses a distinct `plan_ingress` component kind and remains separate from execution adapters.
- RFC 048 cluster mode is a compute-runtime mode or component capability under this registry, not a separate semantic model.

### Compatibility / migration

`Session.default()` remains source-compatible and continues to use DataFusion. Internally it must build or receive the built-in registry, install `incql.datafusion.files` and `incql.datafusion.local`, and select the local runtime.

Existing `csv_source`, `parquet_source`, `arrow_source`, `read_csv`, `read_parquet`, `read_arrow`, `write_csv`, and `write_parquet` helpers may remain as compatibility conveniences. They must construct connector-owned source or sink descriptors and route through the registry path.

Closed `BackendKind` and `SourceKind` enums may remain during migration, but external addon registration must not require new variants. They should be deprecated once all built-ins use open descriptors.

Backend-specific root exports and methods such as a core `SessionBuilder.with_duckdb(...)` must not be the addon model. Typed provider helpers belong in the addon package and produce core registry components, descriptors, and selections.

DataFusion must be migrated first as a built-in file connector and local compute runtime. DuckDB should then prove that the same contracts work from a path-resolved external package with separate file connector and local runtime descriptors.

## Alternatives considered

- **One monolithic adapter object per platform.** Rejected because source, sink, compute, ingress, and evidence responsibilities compose differently and have different trust and lifecycle boundaries.
- **Continue adding core enum variants and dispatch branches.** Rejected because external packages cannot extend closed enums and every provider would remain a core change.
- **Use RFC 009 format handlers as the only plugin system.** Rejected because format handlers do not model sinks, streams, catalogs, compute runtimes, ingress, evidence, package provenance, or connector/runtime compatibility.
- **Use Substrait as the addon API.** Rejected because plan interchange does not install code or define binding, lifecycle, credentials, coverage, and package contracts.
- **Auto-register components when a package is imported.** Rejected because import order and hidden global mutation make sessions difficult to reproduce, inspect, test, and isolate.
- **Load arbitrary shared libraries or addon directories at runtime.** Rejected for the initial contract because it bypasses Incan package resolution, checked types, lockfiles, and ordinary dependency review.
- **Put every integration behind features on core `incql`.** Rejected because it centralizes provider dependencies and release cadence in core and prevents independent addon packages.
- **Assume Arrow makes all connectors and runtimes interchangeable.** Rejected because streaming, pushdown, catalogs, native types, transactionality, sink commits, and operational constraints require contextual compatibility checks.

## Drawbacks

- The component model adds more explicit configuration than a single backend switch.
- Descriptor, API, capability, and binding-protocol versions require governance.
- Connector/runtime composition introduces a compatibility matrix that tools and tests must expose honestly.
- Frozen registry snapshots require rebuilding Sessions when components change.
- Addon packages with native dependencies may still face platform-specific build and distribution constraints.
- The initial Incan implementation may need compiler or runtime support for typed executable hook dispatch and richer package metadata.

## Layers affected

- **IncQL specification** — addon component kinds, identities, descriptors, registration, selection, and composition become normative contracts.
- **IncQL library package** — Session, source/sink descriptors, runtime selection, inspection, and built-in DataFusion integration must use the registry-shaped path.
- **Incan compiler and package tooling** — package dependencies, feature resolution, checked component metadata, hook dispatch, and lockfile facts must support addon packages as the implementation matures.
- **Execution / interchange** — connectors and runtimes must negotiate bindings and report coverage without changing Prism or Substrait semantics.
- **Documentation** — execution, addon authoring, sideloading, capability inspection, and migration docs must explain package availability, component installation, and runtime selection separately.

## Unresolved questions

- Which typed Incan mechanism should carry executable component hooks: nominal interfaces, checked protocols, generated dispatch records, or another representation?
- What is the minimum first set of binding protocol ids needed to prove DataFusion files, external DuckDB files, Arrow transfer, and one backend-native pushdown route?
- Should checked component descriptors be authored in Incan source, declared partly in `incan.toml`, or generated from declaration-side metadata?
- Which descriptor and feature facts can the current Incan lockfile preserve, and which require package-tooling changes?
- How should a future multi-runtime routing policy be represented and fingerprinted without making routing part of Prism logical meaning?
- How should native addon artifacts be distributed when a package cannot be built from Rust dependencies alone on a target platform?

<!-- When every question is resolved, rename this section to **Design Decisions**, group answers under ### Resolved, and remove this comment. -->

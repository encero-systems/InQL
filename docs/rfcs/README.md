<header class="pp-rfc-index-header" markdown="1">
<div class="pp-rfc-index-intro" markdown="1">
# IncQL RFCs

<p class="pp-rfc-index-lede">Search and inspect IncQL's durable design records.</p>
</div>

<nav class="pp-rfc-index-links" aria-label="RFC resources"><a href="../contributing/writing_rfcs/">Write an RFC</a><a href="#how-the-rfc-lifecycle-works">Lifecycle guide</a></nav>
</header>

<div class="pp-rfc-reader-host" data-rfc-reader hidden></div>

<!-- BEGIN GENERATED RFC CATALOG -->
<script type="application/json" data-rfc-catalog>
[
  {
    "authors": "Danny Meijer",
    "created": "2026-03-18",
    "href": "000_incql_syntax/",
    "id": "000",
    "issue": "[IncQL #1](https://github.com/encero-systems/IncQL/issues/1)",
    "issue_label": "IncQL #1",
    "issue_links": [
      {
        "label": "IncQL #1",
        "url": "https://github.com/encero-systems/IncQL/issues/1"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/1",
    "lifecycle": "active",
    "motivation": "Relational code in Incan must resolve field access and column names deterministically and statically where the language promises checking. Without a single foundational specification, query {} and method-chain surfaces would drift, schema-shape rules would be inconsistent across carriers, and the boundary between data logic and execution would blur. This RFC consolidates that model so every companion RFC can cite it rather than redefine it, and so that completion of RFCs 000–004 constitutes a usable IncQL v0.1.",
    "related": [],
    "related_ids": [],
    "rfc_pr": "-",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "-",
    "source_path": "000_incql_syntax.md",
    "status": "Planned",
    "status_key": "planned",
    "summary": "IncQL is the typed data logic plane for the Incan ecosystem: relational queries, schema-parameterized DataFrame transformations, and backend-neutral logical planning. This RFC is the foundational specification for IncQL v0.1. It defines what IncQL is and what it owns, the core semantic model, naming forms and resolution rules, schema shapes, the compilation model, and layer boundaries. Companion RFCs address dataset types, plan interchange, query grammar, execution context, and pipe-forward syntax.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Language Specification",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-03-22",
    "href": "001_incql_dataset/",
    "id": "001",
    "issue": "[IncQL #2](https://github.com/encero-systems/IncQL/issues/2)",
    "issue_label": "IncQL #2",
    "issue_links": [
      {
        "label": "IncQL #2",
        "url": "https://github.com/encero-systems/IncQL/issues/2"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/2",
    "lifecycle": "active",
    "motivation": "Typed pipelines need a first-class carrier for columnar data indexed by T. Without DataSet[T], relational authoring surfaces would lack a stable primary relation and schema flow for FROM-style entry points. The bounded/unbounded distinction — inspired by Spark Structured Streaming's principle that a stream is an unbounded table — must be expressed at the type level so the compiler can enforce streaming constraints statically rather than at runtime. An intermediate trait layer (BoundedDataSet / UnboundedDataSet) gives authors clean type signatures for consumers that accept \"any batch data\" or \"any streaming data\" without listing concrete types.",
    "related": [
      "IncQL RFC 000 (language specification — naming, schema shapes, layer boundaries)",
      "Incan compiler — static capability gating enforcement: incan#187",
      "IncQL follow-up when enforcement lands: IncQL #10",
      "IncQL aggregate helper semantics follow-up: IncQL #23"
    ],
    "related_ids": [
      "000"
    ],
    "rfc_pr": "-",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "001_incql_dataset.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC specifies the dataset type hierarchy for IncQL: the traits and concrete types that carry schema-parameterized tabular data through relational pipelines. The hierarchy is rooted in the DataSet[T] trait, split into BoundedDataSet[T] (finite extent) and UnboundedDataSet[T] (streaming/unbounded), with three concrete types: DataFrame[T] (materialized/eager), LazyFrame[T] (deferred plan), and DataStream[T] (streaming). The bounded/unbounded split enables static capability gating: operations that require unbounded state are rejected at compile time when the target is unbounded, without requiring a separate streaming API. This RFC also defines the relational operation API on DataSet[T] and the execution backend boundary so implementations can delegate without exposing engine internals as the author contract.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "planning",
        "label": "Planning"
      },
      {
        "key": "types",
        "label": "Types"
      }
    ],
    "title": "Dataset types and carriers (DataSet[T])",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-03-23",
    "href": "002_apache_substrait_integration/",
    "id": "002",
    "issue": "[IncQL #3](https://github.com/encero-systems/IncQL/issues/3)",
    "issue_label": "IncQL #3",
    "issue_links": [
      {
        "label": "IncQL #3",
        "url": "https://github.com/encero-systems/IncQL/issues/3"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/3",
    "lifecycle": "active",
    "motivation": "Without a dedicated specification, Substrait lowering risks drifting between front-ends (query {}, APIs on DataSet[T]) and emitters, and risks smuggling execution concerns (storage URIs, credentials, engine choice) into the query IR. Substrait is the ecosystem's portable relational algebra serialization; IncQL needs a single Rel-level contract, version pinning rules, and an explicit boundary between plan semantics and operational binding.",
    "related": [
      "IncQL RFC 000 (language specification — naming, schema shapes, compilation model)",
      "IncQL RFC 001 (dataset types — DataSet[T] carriers and schema parameter)"
    ],
    "related_ids": [
      "000",
      "001"
    ],
    "rfc_pr": "-",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "002_apache_substrait_integration.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC defines Apache Substrait as the normative logical interchange for IncQL relational plans: which Rel and expression shapes implementations produce, how read roots remain backend-agnostic while environment binding (adapters, credentials, runner choice) stays outside IncQL, and how extensions cover capabilities that lack a stable logical Rel in core Substrait. The query {} surface requires lowering to Substrait; this RFC owns the cross-surface contract so method-chain APIs (IncQL RFC 001), query {} blocks, and optional pipe-forward do not diverge at emission time.",
    "tags": [
      {
        "key": "extensibility",
        "label": "Extensibility"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Apache Substrait integration",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-03-22",
    "href": "closed/implemented/003_incql_query_blocks/",
    "id": "003",
    "issue": "[IncQL #4](https://github.com/encero-systems/IncQL/issues/4)",
    "issue_label": "IncQL #4",
    "issue_links": [
      {
        "label": "IncQL #4",
        "url": "https://github.com/encero-systems/IncQL/issues/4"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/4",
    "lifecycle": "implemented",
    "motivation": "A SQL-familiar surface inside Incan improves readability and enables compile-time validation of relational work against model schemas. query {} is the checked authoring form; it lowers to operations on DataSet values (IncQL RFC 001) and/or directly to Substrait (IncQL RFC 002) for portability.",
    "related": [
      "IncQL RFC 000 (language specification — naming and query schema; must stay consistent)",
      "IncQL RFC 001 (dataset types — prerequisite; FROM sources must conform to DataSet[T])",
      "IncQL RFC 002 (Apache Substrait — normative Rel-level contract for lowering)"
    ],
    "related_ids": [
      "000",
      "001",
      "002"
    ],
    "rfc_pr": "[IncQL #59](https://github.com/encero-systems/IncQL/pull/59)",
    "rfc_pr_label": "IncQL #59",
    "rfc_pr_links": [
      {
        "label": "IncQL #59",
        "url": "https://github.com/encero-systems/IncQL/pull/59"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/59",
    "shipped_in": "IncQL v0.1",
    "source_path": "closed/implemented/003_incql_query_blocks.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC specifies the query { ... } expression: grammar, typechecking (including clause-level use of .column, relation.column, bare identifiers, and aggregate rules), vocabulary activation for the query keyword (IncQL package as dependency), and lowering to Apache Substrait. IncQL also accepts the expression-position colon spelling query: for consistency with Incan vocabulary declarations. Naming-form semantics and current query schema are defined in IncQL RFC 000; this RFC must remain consistent with that document. It depends on IncQL RFC 001: FROM sources must conform to IncQL RFC 001's DataSet[T] trait (DataFrame[T], LazyFrame[T], or DataStream[T]) so that T supplies fields for resolution. IncQL RFC 002 owns the Substrait Rel and expression contract, mapping catalog, and read vs binding boundaries; this RFC must conform to IncQL RFC 002 for serialized plan semantics. SELECT DISTINCT is part of the minimum clause surface defined here.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "query {} blocks — syntax, typing, Substrait",
    "written_against": "Incan v0.3"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-03-24",
    "href": "004_incql_execution_context/",
    "id": "004",
    "issue": "[IncQL #5](https://github.com/encero-systems/IncQL/issues/5)",
    "issue_label": "IncQL #5",
    "issue_links": [
      {
        "label": "IncQL #5",
        "url": "https://github.com/encero-systems/IncQL/issues/5"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/5",
    "lifecycle": "active",
    "motivation": "IncQL RFCs 000–003 define a typed query language that produces portable logical plans. Without an execution context, those plans are inert: there is no way to read data in, execute the relational work, or write results out. The execution context completes the pipeline from authored intent to running workload.",
    "related": [
      "IncQL RFC 000 (language specification — compilation model, layer boundaries)",
      "IncQL RFC 001 (dataset types — DataSet[T] carriers; DataFrame[T] as materialized result)",
      "IncQL RFC 002 (Apache Substrait — plan interchange; ReadRel and logical reads)",
      "IncQL RFC 003 (query DSL — query {} produces plans this RFC executes)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 008 (optimizer boundary, statistics, cost-based optimization, and adaptive execution)"
    ],
    "related_ids": [
      "000",
      "001",
      "002",
      "003",
      "007",
      "008"
    ],
    "rfc_pr": "-",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "004_incql_execution_context.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC specifies the execution context: the session object that bridges IncQL's typed logical plans and real execution. It defines how authors read data into DataSet[T] values, execute plans (lowered to Substrait per IncQL RFC 002), and write results back to storage. Apache DataFusion is the reference (and default) execution backend for plan optimization and execution: it consumes Substrait plans, applies query optimizations (predicate pushdown, projection pruning, join reordering, constant folding), and executes against registered data sources, returning Apache Arrow record batches that IncQL wraps in typed DataFrame[T] carriers. This RFC standardizes the explicit core Session contract; higher operational layers may compose, scope, or inject sessions and adapter conveniences on top, but they do not redefine IncQL execution semantics. With RFCs 000–004, IncQL is usable for read → transform → write workflows.",
    "tags": [
      {
        "key": "data-access",
        "label": "Data access"
      },
      {
        "key": "execution",
        "label": "Execution"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Execution context and DataFusion",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-03-18",
    "href": "005_incql_pipe_forward/",
    "id": "005",
    "issue": "[IncQL #6](https://github.com/encero-systems/IncQL/issues/6)",
    "issue_label": "IncQL #6",
    "issue_links": [
      {
        "label": "IncQL #6",
        "url": "https://github.com/encero-systems/IncQL/issues/6"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/6",
    "lifecycle": "active",
    "motivation": "Some authors prefer a linear, left-to-right pipeline over clause blocks or method chains. In Incan specifically, pipe-forward becomes useful when authors already have a DataSet[T] value in scope and want concise shorthand for a few relational steps without switching into a larger query {} block. A dedicated RFC keeps IncQL RFC 003 focused on query {} while still committing to one relational semantic core across surfaces (IncQL RFC 000 §6).",
    "related": [
      "IncQL RFC 000 (language specification — naming and query schema; must stay aligned)",
      "IncQL RFC 001 (dataset types — carriers and method APIs)",
      "IncQL RFC 003 (query {} — primary clause surface)",
      "Incan RFC 040 (Scoped DSL Glyph Surfaces — prerequisite for |\u003e support)"
    ],
    "related_ids": [
      "000",
      "001",
      "003",
      "040"
    ],
    "rfc_pr": "-",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "-",
    "source_path": "005_incql_pipe_forward.md",
    "status": "Blocked",
    "status_key": "blocked",
    "summary": "This RFC specifies an optional pipe-forward surface for IncQL relational pipelines: |\u003e-chained stages applied to an existing DataSet[T] expression, with grammar, precedence, and desugaring to the same relational semantics as query {} and collection method chains. Identifier resolution and current query schema behavior must match IncQL RFC 000 §§2–4; this RFC does not redefine naming rules.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Pipe-forward relational syntax (|\u003e)",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-03-27",
    "href": "006_unnest_core_substrait/",
    "id": "006",
    "issue": "[IncQL #14](https://github.com/encero-systems/IncQL/issues/14)",
    "issue_label": "IncQL #14",
    "issue_links": [
      {
        "label": "IncQL #14",
        "url": "https://github.com/encero-systems/IncQL/issues/14"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/14",
    "lifecycle": "active",
    "motivation": "The current extension encoding for unnest adds extension URI maintenance burden to every conforming IncQL toolchain release and limits plan portability to consumers that happen to support the same registered extension. The gap classification is not a permanent design choice; it reflects a gap in Substrait at the time of RFC 002. Once upstream closes that gap with a stable logical Rel, there is no reason for IncQL to keep the extension path as the normative encoding. Reclassifying promptly gives authors core-portable EXPLODE semantics without requiring consumers to register or recognize IncQL-specific URIs.",
    "related": [
      "IncQL RFC 002 (Apache Substrait — normative gap classification for unnest; prerequisite)",
      "IncQL RFC 003 (query {} — EXPLODE clause; no surface change required)",
      "IncQL RFC 001 (dataset types — explode method on DataSet[T]; no surface change required)"
    ],
    "related_ids": [
      "002",
      "003",
      "001"
    ],
    "rfc_pr": "-",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "- \u003e Blocked on upstream Apache Substrait standardizing a portable logical unnest/explode Rel in a revision IncQL can pin to. See Substrait operator catalog — Gap profiles: Unnest / explode.",
    "source_path": "006_unnest_core_substrait.md",
    "status": "Blocked",
    "status_key": "blocked",
    "summary": "IncQL RFC 002 classifies EXPLODE/unnest as a gap capability: no stable logical Rel exists in core Substrait, so implementations must lower through a registered extension relation with a declared URI. This RFC records the intent to promote that capability from gap to core — updating the operator catalog, retiring the extension encoding requirement, and updating Incan compiler lowering — once upstream Substrait ships a portable unnest Rel that IncQL can adopt.",
    "tags": [
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Promote unnest/explode to core Substrait lowering",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-04-02",
    "href": "007_prism_planning_engine/",
    "id": "007",
    "issue": "[IncQL #16](https://github.com/encero-systems/IncQL/issues/16)",
    "issue_label": "IncQL #16",
    "issue_links": [
      {
        "label": "IncQL #16",
        "url": "https://github.com/encero-systems/IncQL/issues/16"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/16",
    "lifecycle": "active",
    "motivation": "IncQL already has a strong external story around typed carriers, Substrait emission, and the execution boundary, but it lacks a dedicated specification for the internal planning layer that sits between authored logic and emitted plans. Without that layer being named and scoped, plan construction, optimization, lineage, interactive behavior, and future explain/debug tooling risk becoming an accidental mix of implementation details spread across IncQL RFC 001, IncQL RFC 002, and IncQL RFC 004.",
    "related": [
      "IncQL RFC 001 (dataset types and carriers — Prism-backed carriers must remain consistent with DataSet[T] semantics)",
      "IncQL RFC 002 (Apache Substrait integration — Substrait remains the normative emitted contract at the boundary)",
      "IncQL RFC 003 (query {} — lowers through Prism-managed logical work before Substrait emission)",
      "IncQL RFC 004 (execution context — session executes Prism-backed plans but does not define Prism)",
      "IncQL RFC 005 (optional pipe-forward — must stay Prism-consistent with equivalent surfaces)"
    ],
    "related_ids": [
      "001",
      "002",
      "003",
      "004",
      "005"
    ],
    "rfc_pr": "—",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "007_prism_planning_engine.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC defines Prism as IncQL's immutable internal logical planning and optimization engine. Prism owns persistent plan storage, cheap branching through structural sharing, lineage-preserving rewrites, and logical optimization prior to Substrait emission or session execution. Prism is an internal planning substrate, not the normative interchange contract: Apache Substrait remains the boundary format per IncQL RFC 002. LazyFrame, DataFrame, and DataStream are carrier experiences over Prism-managed plan state; Session and SessionContext bind and execute those plans per IncQL RFC 004.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Prism logical planning and optimization engine",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer",
    "created": "2026-04-07",
    "href": "008_optimizer_boundary_stats_cbo_aqe/",
    "id": "008",
    "issue": "[IncQL #18](https://github.com/encero-systems/IncQL/issues/18)",
    "issue_label": "IncQL #18",
    "issue_links": [
      {
        "label": "IncQL #18",
        "url": "https://github.com/encero-systems/IncQL/issues/18"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/18",
    "lifecycle": "active",
    "motivation": "RFC 007 was intentionally written to get Prism named, scoped, and implemented as a real planning substrate. That was the right move for the first Prism adoption slice. However, once IncQL aims for stronger optimization, the remaining ambiguity becomes a liability:",
    "related": [
      "IncQL RFC 004 (execution context — Session remains the execution and backend boundary)",
      "IncQL RFC 007 (Prism planning engine — this RFC narrows optimizer-boundary ownership without replacing Prism adoption)"
    ],
    "related_ids": [
      "004",
      "007"
    ],
    "rfc_pr": "—",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "008_optimizer_boundary_stats_cbo_aqe.md",
    "status": "Planned",
    "status_key": "planned",
    "summary": "This RFC defines the optimizer boundary between Prism and Session as IncQL grows beyond the first Prism adoption slice. Prism remains the owner of analyzed logical planning, semantic rewrites, canonicalization, schema-preserving logical optimization, and any static planning facts that do not depend on runtime feedback. Session remains the owner of backend capabilities, physical planning, backend pushdown policy, runtime statistics, execution metrics, and adaptive re-planning during execution. This RFC does not replace RFC 007's role in establishing Prism as the internal planning substrate; it settles the ownership boundary needed for RFC 004 and defers deeper statistics, CBO, and AQE mechanics until the execution side is better grounded.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "execution",
        "label": "Execution"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Optimizer boundary, statistics, cost-based optimization, and adaptive execution",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-18",
    "href": "009_session_format_handler_registry/",
    "id": "009",
    "issue": "—",
    "issue_label": null,
    "issue_links": [],
    "issue_url": null,
    "lifecycle": "active",
    "motivation": "Today, Session format support is effectively hardcoded (csv, parquet, arrow). That works for initial delivery but scales poorly: each new format requires internal edits across Session and backend code paths.",
    "related": [
      "RFC 004, RFC 007"
    ],
    "related_ids": [
      "004",
      "007"
    ],
    "rfc_pr": "—",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "009_session_format_handler_registry.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC introduces a Session-owned format handler registry so IncQL can support built-in and third-party source formats through one stable contract, instead of hardcoding format-specific branches in Session and backend integration code.",
    "tags": [
      {
        "key": "data-access",
        "label": "Data access"
      },
      {
        "key": "extensibility",
        "label": "Extensibility"
      }
    ],
    "title": "Session Format Handler Registry",
    "written_against": "Incan v0.2-rc1"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-19",
    "href": "010_csv_ingestion_contract/",
    "id": "010",
    "issue": "—",
    "issue_label": null,
    "issue_links": [],
    "issue_url": null,
    "lifecycle": "active",
    "motivation": "CSV is deceptively simple. In practice, a read surface that says \"read CSV\" without a precise contract leaves critical behavior undefined: quoting, embedded delimiters, multiline fields, header handling, null tokens, numeric grouping, timestamp recognition, and malformed-row policy. That creates two problems for IncQL.",
    "related": [
      "IncQL RFC 001 (dataset types and carrier schema surfaces)",
      "IncQL RFC 004 (execution context and session read boundaries)",
      "IncQL RFC 009 (session format handler registry)"
    ],
    "related_ids": [
      "001",
      "004",
      "009"
    ],
    "rfc_pr": "—",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "010_csv_ingestion_contract.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines IncQL's north-star CSV dialect and interpretation contract. It standardizes how authors describe CSV dialect, header policy, malformed-row behavior, and schema or type inference so that the csv format behaves predictably across execution backends and future format-handler implementations. The core claim is that CSV parsing semantics must be expressed as stable structured IncQL configuration and validated as part of the IncQL contract, rather than being left to whatever parser quirks a specific backend happens to expose.",
    "tags": [
      {
        "key": "data-access",
        "label": "Data access"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "CSV dialect and interpretation contract",
    "written_against": "Incan v0.2-rc5"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-19",
    "href": "011_source_discovery_contract/",
    "id": "011",
    "issue": "—",
    "issue_label": null,
    "issue_links": [],
    "issue_url": null,
    "lifecycle": "active",
    "motivation": "IncQL already needs a clean distinction between \"what is a CSV\" and \"what does this path mean.\" Those are not the same question. A folder, prefix, archive, or compressed object changes how input is enumerated, but it says nothing by itself about delimiter rules, headers, null tokens, or numeric inference. If those concerns are collapsed into a single format-specific options bag, the API becomes harder to reason about and portability becomes fragile.",
    "related": [
      "IncQL RFC 004 (execution context and session read boundaries)",
      "IncQL RFC 009 (session format handler registry)",
      "IncQL RFC 010 (CSV dialect and interpretation contract)"
    ],
    "related_ids": [
      "004",
      "009",
      "010"
    ],
    "rfc_pr": "—",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "011_source_discovery_contract.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines IncQL's north-star source-discovery contract for file-backed reads. It standardizes how a logical input target becomes one or more parse units before any format-specific handler such as csv, parquet, or arrow interprets those units. The core claim is that input discovery must be its own contract layer, separate from format dialect or schema inference, so that IncQL can describe single-file reads, directory or prefix expansion, and future container-aware discovery without mixing storage semantics into format semantics.",
    "tags": [
      {
        "key": "data-access",
        "label": "Data access"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Source discovery and parse-unit expansion",
    "written_against": "Incan v0.2-rc5"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-22",
    "href": "closed/implemented/012_unified_scalar_expression_surface/",
    "id": "012",
    "issue": "[IncQL #25](https://github.com/encero-systems/IncQL/issues/25)",
    "issue_label": "IncQL #25",
    "issue_links": [
      {
        "label": "IncQL #25",
        "url": "https://github.com/encero-systems/IncQL/issues/25"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/25",
    "lifecycle": "implemented",
    "motivation": "IncQL has reached the point where split builder surfaces are becoming a design liability rather than a harmless implementation detail. Filters, computed projections, grouping keys, and aggregate arguments all describe row-level meaning, but they are currently easy to model as separate families because features landed incrementally. That split creates three problems.",
    "related": [
      "IncQL RFC 001 (dataset carriers and method-chain API surface)",
      "IncQL RFC 003 (query {} blocks and relational authoring)",
      "IncQL RFC 004 (execution context and backend execution boundary)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "Incan RFC 025 (multi-instantiation trait dispatch)",
      "Incan RFC 028 (trait-based operator overloading)",
      "Incan RFC 029 (union types and type narrowing)",
      "Incan RFC 040 (scoped DSL glyph surfaces)",
      "Incan RFC 045 (scoped DSL symbol surfaces)"
    ],
    "related_ids": [
      "001",
      "003",
      "004",
      "007",
      "025",
      "028",
      "029",
      "040",
      "045"
    ],
    "rfc_pr": "—",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/012_unified_scalar_expression_surface.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines a single canonical scalar expression model for row-level relational meaning in IncQL. Filter predicates, computed projection values, grouping keys, and aggregate arguments must all be expressed through the same scalar expression surface, while aggregate outputs remain a distinct aggregate-measure layer. The goal is to replace split mini-DSLs for predicates, literals, and projection expressions with one coherent authoring and lowering contract that all IncQL surfaces share.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "planning",
        "label": "Planning"
      },
      {
        "key": "types",
        "label": "Types"
      }
    ],
    "title": "Unified scalar expression surface",
    "written_against": "Incan v0.3.0"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/013_function_catalog_program/",
    "id": "013",
    "issue": "[IncQL #30](https://github.com/encero-systems/IncQL/issues/30)",
    "issue_label": "IncQL #30",
    "issue_links": [
      {
        "label": "IncQL #30",
        "url": "https://github.com/encero-systems/IncQL/issues/30"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/30",
    "lifecycle": "implemented",
    "motivation": "IncQL currently exposes only a small number of functions relative to mature dataframe, warehouse, and SQL systems. Spark, DataFusion, Arrow, Beam, Snowflake, dbt, and standard SQL references show that a credible relational data surface needs many more functions, but adding them without structure would create catalog sprawl and inconsistent semantics.",
    "related": [
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 015 (core scalar functions and operators)",
      "IncQL RFC 016 (core aggregate functions)",
      "IncQL RFC 017 (aggregate modifiers)",
      "IncQL RFC 018 (common scalar function catalog)",
      "IncQL RFC 019 (window functions)",
      "IncQL RFC 020 (nested data functions)",
      "IncQL RFC 021 (generator and table-valued functions)",
      "IncQL RFC 022 (semi-structured and format functions)",
      "IncQL RFC 023 (approximate and sketch functions)",
      "IncQL RFC 024 (function extension policy)",
      "IncQL RFC 025 (typed sketch logical values)",
      "IncQL RFC 026 (semi-structured variant logical values)"
    ],
    "related_ids": [
      "012",
      "014",
      "015",
      "016",
      "017",
      "018",
      "019",
      "020",
      "021",
      "022",
      "023",
      "024",
      "025",
      "026"
    ],
    "rfc_pr": "[IncQL #59](https://github.com/encero-systems/IncQL/pull/59)",
    "rfc_pr_label": "IncQL #59",
    "rfc_pr_links": [
      {
        "label": "IncQL #59",
        "url": "https://github.com/encero-systems/IncQL/pull/59"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/59",
    "shipped_in": "IncQL v0.1",
    "source_path": "closed/implemented/013_function_catalog_program.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC is the umbrella tracking RFC for IncQL's function catalog expansion. It defines the target shape and acceptance boundary for the related child RFCs that turn IncQL from a small builder-first function surface into a typed, registry-backed dataframe and query function catalog. This RFC is complete only when the child RFCs needed for the catalog program are implemented or deliberately rejected.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "extensibility",
        "label": "Extensibility"
      },
      {
        "key": "functions",
        "label": "Functions"
      }
    ],
    "title": "Function catalog program",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/014_function_registry/",
    "id": "014",
    "issue": "[IncQL #31](https://github.com/encero-systems/IncQL/issues/31)",
    "issue_label": "IncQL #31",
    "issue_links": [
      {
        "label": "IncQL #31",
        "url": "https://github.com/encero-systems/IncQL/issues/31"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/31",
    "lifecycle": "implemented",
    "motivation": "Spark and similar systems expose a very large function surface. Copying that surface one helper at a time would make IncQL harder to reason about, because related decisions such as null semantics, overflow policy, aliases, aggregate modifiers, and backend fallbacks would be scattered across individual additions. IncQL needs a registry-level contract first so later RFCs can add catalog breadth without reopening the same foundational questions.",
    "related": [
      "IncQL RFC 000 (language specification and layer boundaries)",
      "IncQL RFC 002 (Substrait lowering and extension policy)",
      "IncQL RFC 003 (query {} blocks and relational authoring)",
      "IncQL RFC 007 (Prism planning and optimization)",
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 013 (function catalog program)",
      "Incan RFC 048 (contract-backed models, emit, and interrogation tooling)",
      "Incan issue #437 (top-level callable aliases)",
      "Incan issue #438 (incan docs API documentation extraction)",
      "Incan issue #636 / PR #637 (decorated function source signatures in checked API metadata)",
      "Incan issue #638 / PR #641 (decorator string argument materialization)",
      "Incan issue #640 / PR #643 (generic function references for decorator factories)",
      "Incan issue #645 (method-call decorators for registry registration)",
      "Incan issue #658 / PR #660 (const model constructor initializers for typed version constants)",
      "Incan issue #659 / PR #660 (lowercase exported static import/codegen mismatch)"
    ],
    "related_ids": [
      "000",
      "002",
      "003",
      "007",
      "012",
      "013",
      "048"
    ],
    "rfc_pr": "[IncQL #42](https://github.com/encero-systems/IncQL/pull/42)",
    "rfc_pr_label": "IncQL #42",
    "rfc_pr_links": [
      {
        "label": "IncQL #42",
        "url": "https://github.com/encero-systems/IncQL/pull/42"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/42",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/014_function_registry.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines the IncQL function registry: the single source of truth for scalar, aggregate, window, generator, and extension functions across query blocks, dataframe method chains, planning, diagnostics, generated documentation, and Substrait interchange. The registry records canonical names, compatibility aliases, arity, type rules, null and error behavior, determinism, function class, boundedness restrictions, documentation metadata, lifecycle metadata, and Substrait mapping strategy so that future function expansion is coherent rather than a pile of ad hoc helpers.",
    "tags": [
      {
        "key": "extensibility",
        "label": "Extensibility"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Function registry and catalog governance",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/015_core_scalar_functions/",
    "id": "015",
    "issue": "[IncQL #32](https://github.com/encero-systems/IncQL/issues/32)",
    "issue_label": "IncQL #32",
    "issue_links": [
      {
        "label": "IncQL #32",
        "url": "https://github.com/encero-systems/IncQL/issues/32"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/32",
    "lifecycle": "implemented",
    "motivation": "IncQL currently has a split helper surface for filters and projections. That is enough for early examples but too narrow for real dataframe work. Authors need one predictable core scalar vocabulary that can express common predicates, computed columns, grouping keys, aggregate arguments, and sort keys across all IncQL authoring surfaces.",
    "related": [
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 003 (query {} blocks and relational authoring)"
    ],
    "related_ids": [
      "012",
      "013",
      "014",
      "003"
    ],
    "rfc_pr": "[IncQL #43](https://github.com/encero-systems/IncQL/pull/43)",
    "rfc_pr_label": "IncQL #43",
    "rfc_pr_links": [
      {
        "label": "IncQL #43",
        "url": "https://github.com/encero-systems/IncQL/pull/43"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/43",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/015_core_scalar_functions.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines the first required scalar function and operator slice for IncQL: column references, literals, casts, comparisons, boolean logic, null checks, basic arithmetic, conditionals, membership predicates, range predicates, and ordering expressions. These functions are the minimum scalar vocabulary needed for credible typed dataframe and query-block authoring before broader math, string, and date/time catalogs are added.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Core scalar functions and operators",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/016_core_aggregate_functions/",
    "id": "016",
    "issue": "[IncQL #33](https://github.com/encero-systems/IncQL/issues/33)",
    "issue_label": "IncQL #33",
    "issue_links": [
      {
        "label": "IncQL #33",
        "url": "https://github.com/encero-systems/IncQL/issues/33"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/33",
    "lifecycle": "implemented",
    "motivation": "IncQL already exposes sum and argument-free count, but real grouped analysis needs a stable minimum aggregate family. Beam's SQL aggregate surface centers on COUNT, AVG, SUM, MAX, and MIN; DataFusion, Spark, and Snowflake also support these as foundational aggregates. IncQL should define these before broader statistical, collection, approximate, or ordered aggregates.",
    "related": [
      "IncQL RFC 001 (dataset carriers and aggregation surface)",
      "IncQL RFC 003 (query {} aggregate rules)",
      "IncQL RFC 012 (scalar expressions and aggregate measures)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)"
    ],
    "related_ids": [
      "001",
      "003",
      "012",
      "013",
      "014"
    ],
    "rfc_pr": "[IncQL #44](https://github.com/encero-systems/IncQL/pull/44)",
    "rfc_pr_label": "IncQL #44",
    "rfc_pr_links": [
      {
        "label": "IncQL #44",
        "url": "https://github.com/encero-systems/IncQL/pull/44"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/44",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/016_core_aggregate_functions.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines IncQL's core aggregate function set: count, sum, avg, min, and max, including argument forms, input type rules, null behavior, empty-input behavior, result type rules, aliases, and required diagnostics. These aggregates form the minimum portable aggregate surface for dataframe and query-block work.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Core aggregate functions",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/017_aggregate_modifiers/",
    "id": "017",
    "issue": "[IncQL #34](https://github.com/encero-systems/IncQL/issues/34)",
    "issue_label": "IncQL #34",
    "issue_links": [
      {
        "label": "IncQL #34",
        "url": "https://github.com/encero-systems/IncQL/issues/34"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/34",
    "lifecycle": "implemented",
    "motivation": "Many useful aggregate forms are not truly new aggregate functions. count_distinct, sum_distinct, count_if, and ordered string/list aggregates are better understood as an aggregate plus a modifier. If IncQL implements each spelling as an unrelated function, the catalog becomes larger and less coherent while still failing to represent SQL's compositional aggregate shape.",
    "related": [
      "IncQL RFC 003 (query {} aggregate rules)",
      "IncQL RFC 012 (scalar expressions and aggregate measures)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 016 (core aggregate functions)"
    ],
    "related_ids": [
      "003",
      "012",
      "013",
      "014",
      "016"
    ],
    "rfc_pr": "[IncQL #45](https://github.com/encero-systems/IncQL/pull/45)",
    "rfc_pr_label": "IncQL #45",
    "rfc_pr_links": [
      {
        "label": "IncQL #45",
        "url": "https://github.com/encero-systems/IncQL/pull/45"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/45",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/017_aggregate_modifiers.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines aggregate modifiers for IncQL: DISTINCT, aggregate-local FILTER, ordered aggregate input, and compatibility helpers such as count_if. These are modeled as modifiers on aggregate measures rather than as a separate function for every combination, so IncQL can support SQL-style aggregate semantics without multiplying the catalog unnecessarily.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Aggregate modifiers",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/018_common_scalar_function_catalog/",
    "id": "018",
    "issue": "[IncQL #35](https://github.com/encero-systems/IncQL/issues/35)",
    "issue_label": "IncQL #35",
    "issue_links": [
      {
        "label": "IncQL #35",
        "url": "https://github.com/encero-systems/IncQL/issues/35"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/35",
    "lifecycle": "implemented",
    "motivation": "After the core scalar vocabulary exists, authors still need everyday data cleaning and feature engineering functions. Spark, Snowflake, DataFusion, Arrow, dbt, and SQL systems all provide broad scalar coverage because real tabular work needs string normalization, date extraction, numeric transforms, regex predicates, and parsing helpers. IncQL should add that breadth deliberately rather than through scattered helper additions.",
    "related": [
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 015 (core scalar functions and operators)"
    ],
    "related_ids": [
      "012",
      "013",
      "014",
      "015"
    ],
    "rfc_pr": "[IncQL #44](https://github.com/encero-systems/IncQL/pull/44) (initial math slice); [IncQL #54](https://github.com/encero-systems/IncQL/pull/54) (full implementation)",
    "rfc_pr_label": "IncQL #44",
    "rfc_pr_links": [
      {
        "label": "IncQL #44",
        "url": "https://github.com/encero-systems/IncQL/pull/44"
      },
      {
        "label": "IncQL #54",
        "url": "https://github.com/encero-systems/IncQL/pull/54"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/44",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/018_common_scalar_function_catalog.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines the common scalar function catalog beyond the core scalar slice: practical math, string, encoding, regex, and date/time functions that authors expect in a dataframe system. The catalog is standards-led where possible, preserves compatibility aliases where semantics match, and leaves specialist or format-specific families to their owning RFCs.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Common scalar function catalog",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/019_window_functions/",
    "id": "019",
    "issue": "[IncQL #36](https://github.com/encero-systems/IncQL/issues/36)",
    "issue_label": "IncQL #36",
    "issue_links": [
      {
        "label": "IncQL #36",
        "url": "https://github.com/encero-systems/IncQL/issues/36"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/36",
    "lifecycle": "implemented",
    "motivation": "Analytic dataframe work needs ranking, lag/lead comparisons, running totals, and first/last value access. Spark and SQL systems expose these through window functions, and DataFusion distinguishes ordered-set and aggregate behavior from window behavior. IncQL should preserve that distinction instead of modeling window functions as ordinary aggregates or scalar helpers.",
    "related": [
      "IncQL RFC 003 (query {} blocks and relational authoring)",
      "IncQL RFC 012 (scalar expressions and aggregate measures)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 016 (core aggregate functions)"
    ],
    "related_ids": [
      "003",
      "012",
      "013",
      "014",
      "016"
    ],
    "rfc_pr": "[IncQL #48](https://github.com/encero-systems/IncQL/pull/48)",
    "rfc_pr_label": "IncQL #48",
    "rfc_pr_links": [
      {
        "label": "IncQL #48",
        "url": "https://github.com/encero-systems/IncQL/pull/48"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/48",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/019_window_functions.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines IncQL window functions and window specifications: partitioning, ordering, frames, ranking functions, offset functions, and value functions. Window functions are explicitly not ordinary aggregates; they produce one value per input row while seeing a related set of rows defined by the window specification.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Window functions",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/020_nested_data_functions/",
    "id": "020",
    "issue": "[IncQL #37](https://github.com/encero-systems/IncQL/issues/37)",
    "issue_label": "IncQL #37",
    "issue_links": [
      {
        "label": "IncQL #37",
        "url": "https://github.com/encero-systems/IncQL/issues/37"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/37",
    "lifecycle": "implemented",
    "motivation": "Modern dataframe and warehouse systems routinely handle nested data. Spark has a large array/map/struct catalog, Snowflake has ARRAY/OBJECT/MAP and semi-structured VARIANT-oriented functions, Arrow and DataFusion support nested physical types, and Beam schemas support nested rows and collections. IncQL needs nested data functions for realistic semi-structured data without confusing scalar nested values with relation-shaping generators.",
    "related": [
      "IncQL RFC 000 (schema shapes and model-driven typing)",
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 021 (generator and table-valued functions)"
    ],
    "related_ids": [
      "000",
      "012",
      "013",
      "014",
      "021"
    ],
    "rfc_pr": "[IncQL #46](https://github.com/encero-systems/IncQL/pull/46)",
    "rfc_pr_label": "IncQL #46",
    "rfc_pr_links": [
      {
        "label": "IncQL #46",
        "url": "https://github.com/encero-systems/IncQL/pull/46"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/46",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/020_nested_data_functions.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines IncQL functions for nested scalar values: arrays, maps, and structs. It covers construction, element access, cardinality, containment, overlap checks, sorting, set-like array operations, scalar array flattening, map entry access, and higher-order collection functions as a later extension point. Nested functions remain scalar when they produce one value per input row; cardinality-changing operations such as explode belong to a separate generator RFC.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Nested data functions",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/021_generator_table_functions/",
    "id": "021",
    "issue": "[IncQL #38](https://github.com/encero-systems/IncQL/issues/38)",
    "issue_label": "IncQL #38",
    "issue_links": [
      {
        "label": "IncQL #38",
        "url": "https://github.com/encero-systems/IncQL/issues/38"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/38",
    "lifecycle": "implemented",
    "motivation": "Spark exposes generators near functions, and Snowflake exposes FLATTEN as a table function, but their semantics are fundamentally different from scalar functions. explode and flatten turn one input row into zero or more output rows. inline can turn nested fields into multiple output columns. stack constructs multiple rows. Treating these as scalar functions would make planning, typing, and lowering unsound.",
    "related": [
      "IncQL RFC 001 (dataset carriers and relation operations)",
      "IncQL RFC 003 (query {} clause inventory)",
      "IncQL RFC 006 (unnest/explode Substrait lowering)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 020 (nested data functions)"
    ],
    "related_ids": [
      "001",
      "003",
      "006",
      "013",
      "014",
      "020"
    ],
    "rfc_pr": "[IncQL #47](https://github.com/encero-systems/IncQL/pull/47)",
    "rfc_pr_label": "IncQL #47",
    "rfc_pr_links": [
      {
        "label": "IncQL #47",
        "url": "https://github.com/encero-systems/IncQL/pull/47"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/47",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/021_generator_table_functions.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines generator and table-valued functions for IncQL, including explode, explode_outer, posexplode, posexplode_outer, inline, inline_outer, flatten, stack, and selected tuple-producing extraction helpers. These functions change relation shape or cardinality and therefore must be modeled as relation operations, not scalar expressions.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Generator and table-valued functions",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/022_semi_structured_format_functions/",
    "id": "022",
    "issue": "[IncQL #39](https://github.com/encero-systems/IncQL/issues/39)",
    "issue_label": "IncQL #39",
    "issue_links": [
      {
        "label": "IncQL #39",
        "url": "https://github.com/encero-systems/IncQL/issues/39"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/39",
    "lifecycle": "implemented",
    "motivation": "Real data pipelines frequently parse JSON strings, emit JSON values, inspect CSV-shaped payloads, hash identifiers, and normalize URLs. Spark and Snowflake expose many of these as functions, while IncQL already has separate source-format RFCs. The design should preserve that boundary: reading a CSV file is an I/O concern, but parsing a CSV-encoded scalar value is a scalar format function.",
    "related": [
      "IncQL RFC 009 (session format handler registry)",
      "IncQL RFC 010 (CSV dialect and interpretation contract)",
      "IncQL RFC 011 (source discovery and parse-unit expansion)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 020 (nested data functions)",
      "IncQL RFC 026 (semi-structured variant logical values)"
    ],
    "related_ids": [
      "009",
      "010",
      "011",
      "013",
      "014",
      "020",
      "026"
    ],
    "rfc_pr": "[IncQL #49](https://github.com/encero-systems/IncQL/pull/49)",
    "rfc_pr_label": "IncQL #49",
    "rfc_pr_links": [
      {
        "label": "IncQL #49",
        "url": "https://github.com/encero-systems/IncQL/pull/49"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/49",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/022_semi_structured_format_functions.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines IncQL's semi-structured and format-oriented function families: JSON value functions, CSV value functions, schema inference helpers, URL helpers, and hashing functions. These functions are practical data-engineering tools, but they should live in explicit format families rather than the core scalar catalog. Semi-structured variant values and their type predicates are defined separately by IncQL RFC 026.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Semi-structured and format functions",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/023_approximate_sketch_functions/",
    "id": "023",
    "issue": "[IncQL #40](https://github.com/encero-systems/IncQL/issues/40)",
    "issue_label": "IncQL #40",
    "issue_links": [
      {
        "label": "IncQL #40",
        "url": "https://github.com/encero-systems/IncQL/issues/40"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/40",
    "lifecycle": "implemented",
    "motivation": "Spark exposes many approximate and sketch functions because large-scale analytics often trades exactness for bounded memory or faster execution. IncQL should support the portable part of that direction, but sketch functions require more than names: they need accuracy parameters, merge semantics, serialization formats, determinism rules, and typed opaque state values.",
    "related": [
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 016 (core aggregate functions)",
      "IncQL RFC 017 (aggregate modifiers)",
      "IncQL RFC 024 (function extension policy)",
      "IncQL RFC 025 (typed sketch logical values)"
    ],
    "related_ids": [
      "013",
      "014",
      "016",
      "017",
      "024",
      "025"
    ],
    "rfc_pr": "[IncQL #53](https://github.com/encero-systems/IncQL/pull/53)",
    "rfc_pr_label": "IncQL #53",
    "rfc_pr_links": [
      {
        "label": "IncQL #53",
        "url": "https://github.com/encero-systems/IncQL/pull/53"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/53",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/023_approximate_sketch_functions.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines the portable approximate aggregate boundary for IncQL and records the sketch-state policy decision. IncQL exposes explicit approximate aggregates for distinct counts and percentiles. It delegates sketch-state construction, merge, estimate, serialization, and deserialization helpers to IncQL RFC 025 because those helpers require typed sketch logical values rather than ordinary string or binary payloads.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Approximate and sketch functions",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-04-27",
    "href": "closed/implemented/024_function_extension_policy/",
    "id": "024",
    "issue": "[IncQL #41](https://github.com/encero-systems/IncQL/issues/41)",
    "issue_label": "IncQL #41",
    "issue_links": [
      {
        "label": "IncQL #41",
        "url": "https://github.com/encero-systems/IncQL/issues/41"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/41",
    "lifecycle": "implemented",
    "motivation": "Spark's and Snowflake's function catalogs include useful portable functions, but they also include APIs tied to a specific runtime, physical execution model, warehouse type system, or specialist domain. dbt adds a different kind of pressure: cross-database names that need adapter-specific rendering. IncQL needs a deliberate answer for those functions. Some should become registered extensions. Some should be table metadata transforms rather than scalar functions. Some should be rejected from portable IncQL core.",
    "related": [
      "IncQL RFC 002 (Substrait lowering and extension policy)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 022 (semi-structured and format functions)",
      "IncQL RFC 023 (approximate and sketch functions)"
    ],
    "related_ids": [
      "002",
      "013",
      "014",
      "022",
      "023"
    ],
    "rfc_pr": "[IncQL #44](https://github.com/encero-systems/IncQL/pull/44)",
    "rfc_pr_label": "IncQL #44",
    "rfc_pr_links": [
      {
        "label": "IncQL #44",
        "url": "https://github.com/encero-systems/IncQL/pull/44"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/44",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/024_function_extension_policy.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines how IncQL handles functions that should not live in the portable core catalog: geospatial functions, cryptographic functions, engine-specific physical metadata, UDF and UDTF hooks, JVM/reflection-style escape hatches, partition transforms, and dialect-specific compatibility families. It establishes extension registration, namespacing, capability reporting, and rejection rules.",
    "tags": [
      {
        "key": "extensibility",
        "label": "Extensibility"
      },
      {
        "key": "functions",
        "label": "Functions"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Function extension policy",
    "written_against": "Incan v0.2"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-28",
    "href": "closed/implemented/025_typed_sketch_logical_values/",
    "id": "025",
    "issue": "[IncQL #51](https://github.com/encero-systems/IncQL/issues/51)",
    "issue_label": "IncQL #51",
    "issue_links": [
      {
        "label": "IncQL #51",
        "url": "https://github.com/encero-systems/IncQL/issues/51"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/51",
    "lifecycle": "implemented",
    "motivation": "Approximate aggregates such as approx_count_distinct(...) and approx_percentile(...) are useful when authors only need a scalar result. Sketch state is different: authors may want to materialize a sketch, merge sketches across partitions or files, estimate from a stored sketch later, or serialize sketch state for transport. Those operations require compatibility rules that cannot be represented by bytes or str alone.",
    "related": [
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 023 (approximate and sketch functions)",
      "IncQL RFC 024 (function extension policy)"
    ],
    "related_ids": [
      "002",
      "013",
      "014",
      "023",
      "024"
    ],
    "rfc_pr": "[IncQL #55](https://github.com/encero-systems/IncQL/pull/55)",
    "rfc_pr_label": "IncQL #55",
    "rfc_pr_links": [
      {
        "label": "IncQL #55",
        "url": "https://github.com/encero-systems/IncQL/pull/55"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/55",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/025_typed_sketch_logical_values.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines typed sketch logical values for IncQL. Sketch helpers must not be modeled as ordinary strings or binary blobs; they must produce and consume logical sketch values that record sketch family, input value domain, parameterization, merge compatibility, and serialization format identity.",
    "tags": [
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "types",
        "label": "Types"
      }
    ],
    "title": "Typed sketch logical values",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-28",
    "href": "closed/implemented/026_semi_structured_variant_values/",
    "id": "026",
    "issue": "[IncQL #52](https://github.com/encero-systems/IncQL/issues/52)",
    "issue_label": "IncQL #52",
    "issue_links": [
      {
        "label": "IncQL #52",
        "url": "https://github.com/encero-systems/IncQL/issues/52"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/52",
    "lifecycle": "implemented",
    "motivation": "JSON and semi-structured payloads are common in data pipelines, but predicates such as is_array(...) and typeof(...) are ambiguous if IncQL only has string payloads. is_array(col(\"payload\")) could mean \"parse this string as JSON and inspect the root value\", or it could mean \"inspect a typed semi-structured value that was already parsed by the logical plan.\" Those are different contracts with different null behavior, error behavior, and backend portability.",
    "related": [
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 020 (nested data functions)",
      "IncQL RFC 022 (semi-structured and format functions)",
      "IncQL RFC 024 (function extension policy)"
    ],
    "related_ids": [
      "002",
      "014",
      "020",
      "022",
      "024"
    ],
    "rfc_pr": "[IncQL #56](https://github.com/encero-systems/IncQL/pull/56)",
    "rfc_pr_label": "IncQL #56",
    "rfc_pr_links": [
      {
        "label": "IncQL #56",
        "url": "https://github.com/encero-systems/IncQL/pull/56"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/56",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/026_semi_structured_variant_values.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines semi-structured variant logical values for IncQL. A variant value is distinct from ordinary str and bytes payloads: it carries a logical kind such as null, boolean, integer, floating point, string, timestamp, array, or object, and IncQL predicates inspect that logical value rather than reparsing arbitrary JSON text.",
    "tags": [
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "types",
        "label": "Types"
      }
    ],
    "title": "Semi-structured variant logical values",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "027_relational_evidence_program/",
    "id": "027",
    "issue": "[IncQL #61](https://github.com/encero-systems/IncQL/issues/61)",
    "issue_label": "IncQL #61",
    "issue_links": [
      {
        "label": "IncQL #61",
        "url": "https://github.com/encero-systems/IncQL/issues/61"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/61",
    "lifecycle": "active",
    "motivation": "IncQL already has the pieces of a stronger relational evidence layer: typed carriers, Prism planning, Substrait lowering, registry-backed expressions, aggregate/window/generator semantics, and a session boundary. What is missing is a coherent contract for the evidence that tools need to answer questions such as which source fields produced an output field, which plan rewrite changed a relation, which backend capability was required, which quality assertion failed, and which execution attempt produced a result.",
    "related": [
      "IncQL RFC 000 (core language model and layer boundaries)",
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 034 (quality assertions and observations)",
      "IncQL RFC 035 (governed attributes and policy checkpoints)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 037 (plan diff and blast-radius inputs)",
      "IncQL RFC 038 (evidence exchange bridges)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 043 (canonical equality and digest profiles)",
      "IncQL RFC 044 (verifier statements and proof artifacts)",
      "IncQL RFC 045 (constraint evidence and verification-aware planning)",
      "IncQL RFC 046 (data contract ingress and product topology)",
      "IncQL RFC 047 (semantic evidence graph and agent query surface)"
    ],
    "related_ids": [
      "000",
      "002",
      "004",
      "007",
      "012",
      "013",
      "028",
      "029",
      "030",
      "031",
      "032",
      "033",
      "034",
      "035",
      "036",
      "037",
      "038",
      "040",
      "041",
      "042",
      "043",
      "044",
      "045",
      "046",
      "047"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      },
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "027_relational_evidence_program.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC is the umbrella tracking RFC for IncQL's relational evidence program. The program defines the local, open semantic evidence contracts that make typed relational computation inspectable before execution and reviewable after execution: stable semantic targets, metadata attachments, Prism lineage, inspection artifacts, execution observations, adapter coverage, quality observations, governed attributes, plan bundles, plan diffs, evidence exchange bridges, interoperability semantic profiles, Prism plan ingress, async verification evidence, canonical equality profiles, verifier statements, proof artifacts, constraint evidence, verification-aware planning, data contract ingress, product topology, semantic evidence graph projections, and agent query surfaces. This RFC is complete only when the child RFCs are implemented, rejected, or explicitly superseded by design decision.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "governance",
        "label": "Governance"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "verification",
        "label": "Verification"
      }
    ],
    "title": "Relational evidence program",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "028_semantic_identity_targets/",
    "id": "028",
    "issue": "[IncQL #62](https://github.com/encero-systems/IncQL/issues/62)",
    "issue_label": "IncQL #62",
    "issue_links": [
      {
        "label": "IncQL #62",
        "url": "https://github.com/encero-systems/IncQL/issues/62"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/62",
    "lifecycle": "active",
    "motivation": "Lineage, metadata attachments, quality observations, policy decisions, execution observations, adapter coverage, and plan diffs all need something precise to attach to. If evidence attaches only to display names or backend plan fragments, it becomes fragile under aliases, rewrites, projections, and execution adapter differences. IncQL needs a semantic target model before it can produce trustworthy evidence.",
    "related": [
      "IncQL RFC 000 (core language model and layer boundaries)",
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)"
    ],
    "related_ids": [
      "000",
      "004",
      "007",
      "027",
      "041"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "028_semantic_identity_targets.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC defines the semantic identity and target model required by IncQL's relational evidence program. It establishes stable, typed targets for plans, Prism nodes, plan ingress requests, client sessions, relation outputs, fields, scalar expressions, aggregate measures, window expressions, generator outputs, read roots, quality assertions, policy decisions, adapter requirements, coverage records, and execution attempts.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      }
    ],
    "title": "Semantic identity and target model",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "029_metadata_attachments/",
    "id": "029",
    "issue": "[IncQL #63](https://github.com/encero-systems/IncQL/issues/63)",
    "issue_label": "IncQL #63",
    "issue_links": [
      {
        "label": "IncQL #63",
        "url": "https://github.com/encero-systems/IncQL/issues/63"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/63",
    "lifecycle": "active",
    "motivation": "Relational evidence needs more than lineage edges. A field may carry a redacted label, a source assertion, a planner diagnostic, a session observation, an adapter capability result, or an exported catalog reference. Without a typed attachment model, each feature will invent its own string map and lifecycle rules, making evidence inconsistent and difficult to export.",
    "related": [
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)"
    ],
    "related_ids": [
      "007",
      "027",
      "028"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "029_metadata_attachments.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC defines typed metadata attachments for IncQL semantic targets. Attachments provide a common way to associate lifecycle, source, visibility, typed payloads, provenance, and evidence references with plans, fields, expressions, requirements, observations, and other semantic targets without hardcoding every evidence family into one model.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "extensibility",
        "label": "Extensibility"
      }
    ],
    "title": "Typed metadata attachments",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "030_prism_lineage_graph/",
    "id": "030",
    "issue": "[IncQL #64](https://github.com/encero-systems/IncQL/issues/64)",
    "issue_label": "IncQL #64",
    "issue_links": [
      {
        "label": "IncQL #64",
        "url": "https://github.com/encero-systems/IncQL/issues/64"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/64",
    "lifecycle": "active",
    "motivation": "Lineage reconstructed from backend SQL, backend plans, or Substrait alone is too late and too lossy. Prism sees typed relational intent before backend lowering and before execution. That makes Prism the right source for local lineage evidence, provided lineage is modeled explicitly instead of inferred later from display names or emitted plans.",
    "related": [
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 019 (window functions)",
      "IncQL RFC 020 (nested data functions)",
      "IncQL RFC 021 (generator and table-valued functions)",
      "IncQL RFC 022 (semi-structured and format functions)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)"
    ],
    "related_ids": [
      "002",
      "007",
      "012",
      "019",
      "020",
      "021",
      "022",
      "027",
      "028",
      "041"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "030_prism_lineage_graph.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC defines the Prism lineage graph for IncQL. The graph records relation-level, field-level, and expression-level dependencies over authored and rewritten Prism plans, including reads, projections, filters, joins, aggregates, windows, generators, ordering, limits, nested data access, and semi-structured or format parsing.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Prism lineage graph",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "031_inspection_artifacts/",
    "id": "031",
    "issue": "[IncQL #65](https://github.com/encero-systems/IncQL/issues/65)",
    "issue_label": "IncQL #65",
    "issue_links": [
      {
        "label": "IncQL #65",
        "url": "https://github.com/encero-systems/IncQL/issues/65"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/65",
    "lifecycle": "active",
    "motivation": "Relational evidence is only useful if authors and tools can inspect it without scraping logs or formatted explanations. IncQL needs local APIs and artifacts that work without a hosted service, without a catalog product, and without executing the plan. This keeps plan inspection open, reproducible, and testable.",
    "related": [
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)"
    ],
    "related_ids": [
      "007",
      "027",
      "028",
      "029",
      "030",
      "040",
      "041"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "031_inspection_artifacts.md",
    "status": "In Progress",
    "status_key": "in-progress",
    "summary": "This RFC defines local inspection APIs and deterministic evidence artifacts for IncQL plans. The APIs expose plan structure, schema flow, lineage, metadata attachments, semantic profile evidence, ingress evidence, and diagnostics as typed records, while artifacts provide versioned serialized views suitable for CI, IDEs, agents, documentation, and downstream integrations.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Local inspection APIs and artifacts",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "closed/implemented/032_execution_observations/",
    "id": "032",
    "issue": "[IncQL #66](https://github.com/encero-systems/IncQL/issues/66)",
    "issue_label": "IncQL #66",
    "issue_links": [
      {
        "label": "IncQL #66",
        "url": "https://github.com/encero-systems/IncQL/issues/66"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/66",
    "lifecycle": "implemented",
    "motivation": "After a plan executes, users and tools need evidence about what was attempted and what happened. A result table alone cannot explain which plan version ran, which adapter executed it, which diagnostics occurred, or how runtime observations attach to semantic targets. IncQL needs a lightweight execution observation model that is structural, redacted by default, and independent of any particular telemetry backend.",
    "related": [
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 040 (interoperability semantic profiles)"
    ],
    "related_ids": [
      "004",
      "027",
      "028",
      "031",
      "040"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #85](https://github.com/encero-systems/IncQL/pull/85); [IncQL #87](https://github.com/encero-systems/IncQL/pull/87)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      },
      {
        "label": "IncQL #85",
        "url": "https://github.com/encero-systems/IncQL/pull/85"
      },
      {
        "label": "IncQL #87",
        "url": "https://github.com/encero-systems/IncQL/pull/87"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/032_execution_observations.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines execution observations for IncQL sessions. Execution observations correlate runtime attempts with semantic plan targets and record backend, adapter, semantic profile context, status, timing, diagnostics, row counts, and optional trace identifiers without making runtime logs the source of relational semantics.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "execution",
        "label": "Execution"
      }
    ],
    "title": "Execution observations",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "closed/implemented/033_adapter_requirements_coverage/",
    "id": "033",
    "issue": "[IncQL #67](https://github.com/encero-systems/IncQL/issues/67)",
    "issue_label": "IncQL #67",
    "issue_links": [
      {
        "label": "IncQL #67",
        "url": "https://github.com/encero-systems/IncQL/issues/67"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/67",
    "lifecycle": "implemented",
    "motivation": "Backend neutrality only works when backend limits are visible. A plan may require extension functions, precise decimal behavior, variant semantics, lineage preservation, audit emission, masking, aggregation thresholding, or other capabilities. If IncQL hides adapter uncertainty, downstream systems may assume a guarantee that the selected backend cannot provide.",
    "related": [
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 024 (function extension policy)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 043 (canonical equality and digest profiles)",
      "IncQL RFC 044 (verifier statements and proof artifacts)",
      "IncQL RFC 045 (constraint evidence and verification-aware planning)"
    ],
    "related_ids": [
      "002",
      "004",
      "024",
      "027",
      "028",
      "032",
      "040",
      "041",
      "042",
      "043",
      "044",
      "045"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #83](https://github.com/encero-systems/IncQL/pull/83); [IncQL #86](https://github.com/encero-systems/IncQL/pull/86); [IncQL #87](https://github.com/encero-systems/IncQL/pull/87)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      },
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      },
      {
        "label": "IncQL #86",
        "url": "https://github.com/encero-systems/IncQL/pull/86"
      },
      {
        "label": "IncQL #87",
        "url": "https://github.com/encero-systems/IncQL/pull/87"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/033_adapter_requirements_coverage.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines adapter requirements and coverage states for IncQL. Requirements describe backend capabilities needed by a plan or evidence contract, while coverage states report whether a specific adapter can satisfy those requirements under the relevant binding and semantic profile. Unknown coverage is not enforcement.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "execution",
        "label": "Execution"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Adapter requirements and coverage",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "closed/implemented/034_quality_assertions_observations/",
    "id": "034",
    "issue": "[IncQL #68](https://github.com/encero-systems/IncQL/issues/68)",
    "issue_label": "IncQL #68",
    "issue_links": [
      {
        "label": "IncQL #68",
        "url": "https://github.com/encero-systems/IncQL/issues/68"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/68",
    "lifecycle": "implemented",
    "motivation": "Data quality needs to participate in typed relational planning without collapsing into ad hoc post-run tests or silent filters. IncQL can express many quality checks as relational work: row counts, null rates, accepted values, uniqueness, ranges, group thresholds, and aggregate conditions. Those checks should produce observations that sessions, CI, and pipeline layers can consume.",
    "related": [
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 016 (core aggregate functions)",
      "IncQL RFC 017 (aggregate modifiers)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 042 (async verification evidence)"
    ],
    "related_ids": [
      "004",
      "012",
      "016",
      "017",
      "027",
      "028",
      "032",
      "033",
      "042"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #83](https://github.com/encero-systems/IncQL/pull/83); [IncQL #88](https://github.com/encero-systems/IncQL/pull/88)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      },
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      },
      {
        "label": "IncQL #88",
        "url": "https://github.com/encero-systems/IncQL/pull/88"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/034_quality_assertions_observations.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines IncQL quality assertions, quality assertion syntax, and quality observations. Quality assertions are typed relational checks over datasets, fields, groups, or explicit multi-relation inputs. Quality observations are runtime results produced by executing those assertions. A quality assertion is not an ordinary filter unless the author explicitly asks to filter rows.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "execution",
        "label": "Execution"
      }
    ],
    "title": "Quality assertions and observations",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "closed/implemented/035_governed_attributes_policy_checkpoints/",
    "id": "035",
    "issue": "[IncQL #69](https://github.com/encero-systems/IncQL/issues/69)",
    "issue_label": "IncQL #69",
    "issue_links": [
      {
        "label": "IncQL #69",
        "url": "https://github.com/encero-systems/IncQL/issues/69"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/69",
    "lifecycle": "implemented",
    "motivation": "Relational plans often need to carry facts such as classification, origin, purpose, jurisdiction, derivation, masking status, or coverage state. Those facts may be supplied by model metadata, user declarations, imported artifacts, catalogs, policy engines, or prior plans. IncQL should preserve and propagate them through relational semantics without pretending that inferred attributes are automatically authoritative policy truth.",
    "related": [
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 033 (adapter requirements and coverage)"
    ],
    "related_ids": [
      "004",
      "027",
      "028",
      "029",
      "030",
      "033"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #89](https://github.com/encero-systems/IncQL/pull/89)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      },
      {
        "label": "IncQL #89",
        "url": "https://github.com/encero-systems/IncQL/pull/89"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "v0.1",
    "source_path": "closed/implemented/035_governed_attributes_policy_checkpoints.md",
    "status": "Implemented",
    "status_key": "implemented",
    "summary": "This RFC defines how IncQL carries governed attributes and records policy checkpoints as local relational evidence. Governed attributes are typed facts attached to semantic targets with provenance, confidence, authority, and lifetime. Policy checkpoints are decision records attached at authoring, planning, binding, or execution boundaries. IncQL carries and propagates evidence; it does not define an organization-wide policy engine.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "governance",
        "label": "Governance"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Governed attributes and policy checkpoints",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "036_governed_plan_bundle/",
    "id": "036",
    "issue": "[IncQL #70](https://github.com/encero-systems/IncQL/issues/70)",
    "issue_label": "IncQL #70",
    "issue_links": [
      {
        "label": "IncQL #70",
        "url": "https://github.com/encero-systems/IncQL/issues/70"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/70",
    "lifecycle": "active",
    "motivation": "Individual evidence artifacts are useful, but many consumers need a coherent handoff unit. A plan without its evidence can be executed without understanding requirements. Evidence without the plan cannot explain what computation it describes. The governed plan bundle gives IncQL a portable local package for the facts it owns while leaving hosted storage, global policy, approvals, and cross-system reasoning outside the contract.",
    "related": [
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 034 (quality assertions and observations)",
      "IncQL RFC 035 (governed attributes and policy checkpoints)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 043 (canonical equality and digest profiles)",
      "IncQL RFC 044 (verifier statements and proof artifacts)",
      "IncQL RFC 045 (constraint evidence and verification-aware planning)",
      "IncQL RFC 046 (data contract ingress and product topology)",
      "IncQL RFC 047 (semantic evidence graph and agent query surface)"
    ],
    "related_ids": [
      "002",
      "027",
      "028",
      "029",
      "030",
      "033",
      "034",
      "035",
      "040",
      "041",
      "042",
      "043",
      "044",
      "045",
      "046",
      "047"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      },
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "036_governed_plan_bundle.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines the governed plan bundle as the local IncQL artifact that keeps relational computation and evidence together. A bundle contains a plan reference, schemas, lineage, governed attributes, policy checkpoints, quality assertions, verification evidence, canonical equality profiles, verifier statements, proof artifacts, constraint evidence, data contract evidence, product topology, semantic evidence graph projections, semantic profiles, ingress evidence, client session context, adapter requirements, coverage records, evidence references, and version metadata for the IncQL-owned parts of governed relational computation.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "governance",
        "label": "Governance"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Governed plan bundle",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "037_plan_diff_blast_radius_inputs/",
    "id": "037",
    "issue": "[IncQL #71](https://github.com/encero-systems/IncQL/issues/71)",
    "issue_label": "IncQL #71",
    "issue_links": [
      {
        "label": "IncQL #71",
        "url": "https://github.com/encero-systems/IncQL/issues/71"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/71",
    "lifecycle": "active",
    "motivation": "Typed relational evidence should help users understand change before it reaches production. If a query changes, tools should know whether output fields changed, dependencies changed, adapter requirements changed, or quality checks changed. IncQL can produce accurate local diff evidence because it owns the plan and lineage, but it should not claim to know every downstream consumer in every organization.",
    "related": [
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 040 (interoperability semantic profiles)"
    ],
    "related_ids": [
      "007",
      "027",
      "028",
      "030",
      "031",
      "036",
      "040"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "037_plan_diff_blast_radius_inputs.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines local IncQL plan diffs and blast-radius input artifacts. A plan diff compares two IncQL evidence artifacts and classifies changes in output schema, field identity, lineage, joins, filters, aggregates, windows, generators, quality assertions, semantic profiles, adapter requirements, and coverage. The result is a local input to downstream impact analysis, not an organization-wide blast-radius service.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Plan diff and blast-radius inputs",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-29",
    "href": "038_evidence_exchange_bridges/",
    "id": "038",
    "issue": "[IncQL #72](https://github.com/encero-systems/IncQL/issues/72)",
    "issue_label": "IncQL #72",
    "issue_links": [
      {
        "label": "IncQL #72",
        "url": "https://github.com/encero-systems/IncQL/issues/72"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/72",
    "lifecycle": "active",
    "motivation": "IncQL evidence should be useful outside IncQL, and external project artifacts should be usable as evidence inputs when they are explicit about their source and scope. CI systems, lineage tools, telemetry pipelines, catalogs, notebooks, transformation frameworks, orchestrators, and agents may all consume or produce different formats. Systems such as dbt, Airflow, MWAA, Dagster, Prefect, Glue Data Catalog, Hive Metastore, DataHub, OpenMetadata, OpenLineage, and Great Expectations are useful ecosystem examples, but none of them should become IncQL's internal evidence model. If each integration reconstructs evidence independently, semantics will drift. IncQL should provide exchange bridges that preserve its local evidence model while acknowledging that external formats may be less expressive or may represent facts at a different semantic layer.",
    "related": [
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 043 (canonical equality and digest profiles)",
      "IncQL RFC 044 (verifier statements and proof artifacts)",
      "IncQL RFC 045 (constraint evidence and verification-aware planning)",
      "IncQL RFC 046 (data contract ingress and product topology)",
      "IncQL RFC 047 (semantic evidence graph and agent query surface)"
    ],
    "related_ids": [
      "002",
      "027",
      "029",
      "030",
      "031",
      "032",
      "036",
      "040",
      "042",
      "043",
      "044",
      "045",
      "046",
      "047"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      },
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "038_evidence_exchange_bridges.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines evidence exchange bridges between IncQL's internal evidence model and external or adjacent formats. Exchange bridges map IncQL plan, lineage, schema-flow, execution, quality, verification, canonical equality, proof artifact, constraint, contract, product topology, evidence graph, coverage, semantic profile, and bundle records into downstream views such as OpenLineage events, telemetry signals, semantic inspection fragments, transformation-project artifacts, data-contract artifacts, product-topology artifacts, graph projections, and catalog/governance integration artifacts. They may also ingest external evidence artifacts such as transformation manifests, source catalogs, schema catalogs, run results, verification results, proof results, constraint metadata, contract artifacts, product artifacts, runtime lineage events, and orchestration metadata. Representative artifact families include dbt manifests and run results, Open Data Contract Standard artifacts, Open Data Product Standard artifacts, legacy Data Contract Specification artifacts, Glue Data Catalog or Hive Metastore snapshots, Airflow or MWAA DAG metadata, Dagster assets, Prefect deployment metadata, OpenLineage events, DataHub or OpenMetadata catalog records, and Great Expectations-style quality results. Inbound artifacts and outbound projections are evidence exchange records, not the internal source of truth.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "extensibility",
        "label": "Extensibility"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Evidence exchange bridges",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-30",
    "href": "039_pandas_familiar_exploration_api/",
    "id": "039",
    "issue": "[IncQL #73](https://github.com/encero-systems/IncQL/issues/73)",
    "issue_label": "IncQL #73",
    "issue_links": [
      {
        "label": "IncQL #73",
        "url": "https://github.com/encero-systems/IncQL/issues/73"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/73",
    "lifecycle": "active",
    "motivation": "IncQL's cleaner relational APIs are good for production authoring, but data exploration has a different adoption problem. Authors coming from pandas need a familiar fallback surface for the workflows they reach for reflexively: selecting a column, filtering a frame, projecting a few columns, adding a derived column, grouping, sorting, and previewing rows. If IncQL only exposes its cleanest API, it forces those users to learn IncQL before they can inspect data, which is a poor fit for exploratory work.",
    "related": [
      "IncQL RFC 000 (language specification, naming, schema shapes, and relational positions)",
      "IncQL RFC 001 (dataset carriers and method-chain API surface)",
      "IncQL RFC 003 (query {} blocks and relational authoring)",
      "IncQL RFC 005 (pipe-forward relational syntax)",
      "IncQL RFC 012 (unified scalar expression surface)"
    ],
    "related_ids": [
      "000",
      "001",
      "003",
      "005",
      "012"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "039_pandas_familiar_exploration_api.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines a pandas-familiar exploration API for IncQL dataset carriers. The API provides dictionary-like column access through data[\"column\"], projection through data[[\"a\", \"b\"]], boolean filtering through data[predicate], and a small set of familiar method aliases such as where, assign, groupby, sort_values, and head. These forms are ergonomic aliases over IncQL's existing typed relational model; they must not introduce pandas row-indexing, mutable frame, eager execution, or index-alignment semantics.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      }
    ],
    "title": "Pandas-familiar exploration API",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-30",
    "href": "040_interoperability_semantic_profiles/",
    "id": "040",
    "issue": "[IncQL #74](https://github.com/encero-systems/IncQL/issues/74)",
    "issue_label": "IncQL #74",
    "issue_links": [
      {
        "label": "IncQL #74",
        "url": "https://github.com/encero-systems/IncQL/issues/74"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/74",
    "lifecycle": "active",
    "motivation": "Interoperability requires more than lowering a plan and asking whether an adapter has a support flag. Different target environments can share the same relational vocabulary while differing on edge semantics: type coercion, decimal overflow, timestamp and timezone behavior, identifier resolution, null and NaN ordering, collation, case sensitivity, function definitions, aggregate edge cases, window defaults, nested data behavior, row ordering, and fallback execution.",
    "related": [
      "IncQL RFC 000 (core language model and layer boundaries)",
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 008 (optimizer boundary, statistics, cost-based optimization, and adaptive execution)",
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 024 (function extension policy)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 038 (evidence exchange bridges)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)"
    ],
    "related_ids": [
      "000",
      "002",
      "004",
      "007",
      "008",
      "012",
      "013",
      "024",
      "027",
      "028",
      "029",
      "030",
      "031",
      "032",
      "033",
      "036",
      "038",
      "041"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "040_interoperability_semantic_profiles.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines interoperability semantic profiles for IncQL evidence. A profile describes the semantic environment a plan is being received from, compared with, targeted at, or observed under: an IncQL baseline, client protocol, plan ingress frontend, execution engine, adapter binding, SQL dialect, catalog/schema system, transformation project, interchange consumer, or conformance baseline. Profiles give ingress coverage records, adapter requirements, coverage records, execution observations, plan diffs, bundles, and exchanges a shared context without making any external system the owner of IncQL relational meaning.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Interoperability semantic profiles",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-05-30",
    "href": "041_prism_plan_ingress_frontends/",
    "id": "041",
    "issue": "[IncQL #75](https://github.com/encero-systems/IncQL/issues/75)",
    "issue_label": "IncQL #75",
    "issue_links": [
      {
        "label": "IncQL #75",
        "url": "https://github.com/encero-systems/IncQL/issues/75"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/75",
    "lifecycle": "active",
    "motivation": "IncQL should be able to interoperate with established client APIs without pretending that those APIs own IncQL's semantics. Spark Connect is the clearest pressure: a PySpark client can submit plan-shaped calls over a protocol boundary, and those calls may depend on client session state such as configuration, current catalog, temporary views, or function aliases. IncQL should not route those calls through Spark just to recover meaning later. Prism should receive an unresolved representation, resolve names and functions, apply IncQL semantic rules under an explicit profile and session context, and then continue through the normal planning, evidence, Substrait, and execution paths.",
    "related": [
      "IncQL RFC 000 (core language model and layer boundaries)",
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 012 (unified scalar expression surface)",
      "IncQL RFC 013 (function catalog program)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 040 (interoperability semantic profiles)"
    ],
    "related_ids": [
      "000",
      "004",
      "007",
      "012",
      "013",
      "027",
      "028",
      "029",
      "030",
      "031",
      "033",
      "040"
    ],
    "rfc_pr": "[IncQL #60](https://github.com/encero-systems/IncQL/pull/60)",
    "rfc_pr_label": "IncQL #60",
    "rfc_pr_links": [
      {
        "label": "IncQL #60",
        "url": "https://github.com/encero-systems/IncQL/pull/60"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/60",
    "shipped_in": "—",
    "source_path": "041_prism_plan_ingress_frontends.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines Prism plan ingress and external client frontends for IncQL. A frontend receives an external authoring or client protocol such as Spark Connect, SQL, or another unresolved relational plan surface, decodes it into a Prism-owned unresolved ingress plan, and asks Prism to analyze that plan into ordinary IncQL relational semantics. The frontend may preserve client-origin evidence, client-session evidence, protocol diagnostics, and ingress coverage records, but it must not make the external protocol, Spark, Substrait, DataFusion, or any backend adapter the semantic owner of the plan.",
    "tags": [
      {
        "key": "authoring",
        "label": "Authoring"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "planning",
        "label": "Planning"
      }
    ],
    "title": "Prism plan ingress and external client frontends",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-06-20",
    "href": "042_async_verification_evidence/",
    "id": "042",
    "issue": "[IncQL #77](https://github.com/encero-systems/IncQL/issues/77)",
    "issue_label": "IncQL #77",
    "issue_links": [
      {
        "label": "IncQL #77",
        "url": "https://github.com/encero-systems/IncQL/issues/77"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/77",
    "lifecycle": "active",
    "motivation": "Migration, modernization, replicated analytics, and cross-system validation work rarely complete as one atomic yes-or-no check. Source counts may be reported by a connector before target data finishes loading. Partition digests may stream in over minutes or hours. A sampled comparison may later be replaced by a deterministic check. A mismatch may be waived for a specific partition while the rest of the relation remains verified. A proof verifier may also prove a bounded query result against committed inputs through the statement and artifact model defined by IncQL RFC 044. IncQL needs a vocabulary that can represent those movements without overwriting older evidence or collapsing weak and strong evidence into the same status.",
    "related": [
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 034 (quality assertions and observations)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 038 (evidence exchange bridges)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 043 (canonical equality and digest profiles)",
      "IncQL RFC 044 (verifier statements and proof artifacts)",
      "IncQL RFC 045 (constraint evidence and verification-aware planning)"
    ],
    "related_ids": [
      "027",
      "028",
      "029",
      "031",
      "032",
      "033",
      "034",
      "036",
      "038",
      "040",
      "043",
      "044",
      "045"
    ],
    "rfc_pr": "[IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #83",
    "rfc_pr_links": [
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/83",
    "shipped_in": "—",
    "source_path": "042_async_verification_evidence.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines async verification evidence for IncQL. Verification assertions are stable semantic targets, verification runs emit append-only observations over time, and current verification state is a projection over those observations rather than a mutable field. The model separates lifecycle, outcome, assurance, scope, and commitment context so tools can distinguish deterministic verification, external attestations, sampled checks, accepted waivers, unknown evidence, and proof-backed verification without pretending that all checks carry the same trust.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "verification",
        "label": "Verification"
      }
    ],
    "title": "Async verification evidence",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-06-20",
    "href": "043_canonical_equality_digest_profiles/",
    "id": "043",
    "issue": "[IncQL #78](https://github.com/encero-systems/IncQL/issues/78)",
    "issue_label": "IncQL #78",
    "issue_links": [
      {
        "label": "IncQL #78",
        "url": "https://github.com/encero-systems/IncQL/issues/78"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/78",
    "lifecycle": "active",
    "motivation": "Async verification can say that a partition, relation, or result was checked, but it cannot responsibly say that the check was deterministic unless both sides agree on what equality means. Real systems differ on decimal scale, timestamp precision, time zones, Unicode normalization, string collation, null ordering, NaN handling, duplicate rows, binary encoding, and nested value serialization. Without a canonical profile, a row digest can match or fail for reasons unrelated to the relational claim being verified.",
    "related": [
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 034 (quality assertions and observations)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 042 (async verification evidence)"
    ],
    "related_ids": [
      "027",
      "028",
      "032",
      "033",
      "034",
      "036",
      "040",
      "042"
    ],
    "rfc_pr": "[IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #83",
    "rfc_pr_links": [
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/83",
    "shipped_in": "—",
    "source_path": "043_canonical_equality_digest_profiles.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines canonical equality and digest profiles for IncQL verification evidence. A profile records how rows, fields, relations, partitions, and result tables are normalized, ordered, compared, and hashed so deterministic verification can claim verified assurance without relying on hidden engine-specific equality rules.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      },
      {
        "key": "verification",
        "label": "Verification"
      }
    ],
    "title": "Canonical equality and digest profiles",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-06-20",
    "href": "044_verifier_statements_proof_artifacts/",
    "id": "044",
    "issue": "[IncQL #79](https://github.com/encero-systems/IncQL/issues/79)",
    "issue_label": "IncQL #79",
    "issue_links": [
      {
        "label": "IncQL #79",
        "url": "https://github.com/encero-systems/IncQL/issues/79"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/79",
    "lifecycle": "active",
    "motivation": "Async verification needs a durable way to describe the thing being checked. A result can be checked by deterministic row digests or by a cryptographic proof, but both checks should point at the same kind of statement: the plan identity, semantic assumptions, commitments, result reference, and equality rules. Without a statement record, proof artifacts would be tied to whichever SQL string, backend plan, or connector payload happened to produce them.",
    "related": [
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 043 (canonical equality and digest profiles)"
    ],
    "related_ids": [
      "027",
      "028",
      "031",
      "033",
      "036",
      "040",
      "042",
      "043"
    ],
    "rfc_pr": "[IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #83",
    "rfc_pr_links": [
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/83",
    "shipped_in": "—",
    "source_path": "044_verifier_statements_proof_artifacts.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines verifier statements and proof artifact records for IncQL evidence. A verifier statement binds a semantic plan target, profile context, source commitments, result references, canonical equality rules, and verifier profile into a stable statement that deterministic checks and cryptographic proof systems can verify without relying on SQL text or backend-specific plan fragments as the source of meaning.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "verification",
        "label": "Verification"
      }
    ],
    "title": "Verifier statements and proof artifacts",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-06-20",
    "href": "045_constraint_evidence_verification_planning/",
    "id": "045",
    "issue": "[IncQL #80](https://github.com/encero-systems/IncQL/issues/80)",
    "issue_label": "IncQL #80",
    "issue_links": [
      {
        "label": "IncQL #80",
        "url": "https://github.com/encero-systems/IncQL/issues/80"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/80",
    "lifecycle": "active",
    "motivation": "Real verification work often depends on facts such as \"this key is unique,\" \"this table covers every partition in this range,\" \"this relation is sorted by this field,\" or \"this join key is referentially complete.\" Those facts may come from model declarations, catalogs, source metadata, target metadata, connector attestations, prior checks, or deterministic verification runs. Treating them as ordinary assumptions would make verification overconfident. Ignoring them entirely would make verification too expensive or too weak.",
    "related": [
      "IncQL RFC 008 (optimizer boundary, statistics, cost-based optimization, and adaptive execution)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 034 (quality assertions and observations)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 043 (canonical equality and digest profiles)",
      "IncQL RFC 044 (verifier statements and proof artifacts)"
    ],
    "related_ids": [
      "008",
      "027",
      "028",
      "030",
      "033",
      "034",
      "040",
      "042",
      "043",
      "044"
    ],
    "rfc_pr": "[IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #83",
    "rfc_pr_links": [
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/83",
    "shipped_in": "—",
    "source_path": "045_constraint_evidence_verification_planning.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines constraint evidence and verification-aware planning for IncQL. Constraints such as uniqueness, primary-key shape, foreign-key relationships, non-nullness, sortedness, partition coverage, and row-count bounds must be represented as evidence with assurance, and verification planners may use those constraints only when their preconditions are recorded and strong enough for the requested assurance.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "planning",
        "label": "Planning"
      },
      {
        "key": "verification",
        "label": "Verification"
      }
    ],
    "title": "Constraint evidence and verification-aware planning",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-06-20",
    "href": "046_data_contract_ingress/",
    "id": "046",
    "issue": "[IncQL #81](https://github.com/encero-systems/IncQL/issues/81)",
    "issue_label": "IncQL #81",
    "issue_links": [
      {
        "label": "IncQL #81",
        "url": "https://github.com/encero-systems/IncQL/issues/81"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/81",
    "lifecycle": "active",
    "motivation": "Data contracts already have active open formats. Open Data Contract Standard covers schema objects, properties, data quality rules, server bindings, service-level agreements, roles, teams, authoritative definitions, custom properties, and related metadata. Open Data Product Standard covers data product envelopes, input ports, output ports, contract identifiers, product dependencies, management ports, support, ownership, and SBOM references. The older Data Contract Specification remains relevant because tools and existing repositories still use it, even though its maintainers recommend migration to Open Data Contract Standard. IncQL should absorb these surfaces as evidence rather than inventing a competing vocabulary.",
    "related": [
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 034 (quality assertions and observations)",
      "IncQL RFC 035 (governed attributes and policy checkpoints)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 038 (evidence exchange bridges)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 045 (constraint evidence and verification-aware planning)",
      "IncQL RFC 047 (semantic evidence graph and agent query surface)"
    ],
    "related_ids": [
      "027",
      "028",
      "029",
      "033",
      "034",
      "035",
      "036",
      "038",
      "040",
      "042",
      "045",
      "047"
    ],
    "rfc_pr": "[IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #83",
    "rfc_pr_links": [
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/83",
    "shipped_in": "—",
    "source_path": "046_data_contract_ingress.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines data contract ingress and product topology evidence for IncQL. Existing contract and product formats such as Open Data Contract Standard, Open Data Product Standard, and legacy Data Contract Specification artifacts are imported as evidence, normalized onto IncQL semantic targets, and lowered into metadata attachments, quality assertions, constraint evidence, source bindings, product-port dependencies, and governed bundle records without making any external contract format the internal source of IncQL semantics.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "governance",
        "label": "Governance"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Data contract ingress and product topology",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-06-20",
    "href": "047_semantic_evidence_graph_agent_surface/",
    "id": "047",
    "issue": "[IncQL #82](https://github.com/encero-systems/IncQL/issues/82)",
    "issue_label": "IncQL #82",
    "issue_links": [
      {
        "label": "IncQL #82",
        "url": "https://github.com/encero-systems/IncQL/issues/82"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/82",
    "lifecycle": "active",
    "motivation": "Lineage, contract, observability, quality, and verification questions are naturally graph questions. A user may need to ask where a business term or output field comes from, which products depend on a contract, which runtime jobs wrote a dataset, which outputs depend on waived evidence, which source fields contribute to a metric, or what changes if a model, field, source, contract, or profile changes. The existing RFCs define the evidence families needed to answer those questions, but they do not yet define one graph-shaped query surface that composes them.",
    "related": [
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 028 (semantic identity and target model)",
      "IncQL RFC 029 (typed metadata attachments)",
      "IncQL RFC 030 (Prism lineage graph)",
      "IncQL RFC 031 (local inspection APIs and artifacts)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 034 (quality assertions and observations)",
      "IncQL RFC 035 (governed attributes and policy checkpoints)",
      "IncQL RFC 036 (governed plan bundle)",
      "IncQL RFC 037 (plan diff and blast-radius inputs)",
      "IncQL RFC 038 (evidence exchange bridges)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 042 (async verification evidence)",
      "IncQL RFC 044 (verifier statements and proof artifacts)",
      "IncQL RFC 045 (constraint evidence and verification-aware planning)",
      "IncQL RFC 046 (data contract ingress and product topology)"
    ],
    "related_ids": [
      "027",
      "028",
      "029",
      "030",
      "031",
      "032",
      "033",
      "034",
      "035",
      "036",
      "037",
      "038",
      "040",
      "042",
      "044",
      "045",
      "046"
    ],
    "rfc_pr": "[IncQL #83](https://github.com/encero-systems/IncQL/pull/83)",
    "rfc_pr_label": "IncQL #83",
    "rfc_pr_links": [
      {
        "label": "IncQL #83",
        "url": "https://github.com/encero-systems/IncQL/pull/83"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/83",
    "shipped_in": "—",
    "source_path": "047_semantic_evidence_graph_agent_surface.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines a semantic evidence graph and deterministic agent query surface for IncQL. The graph is a projection over IncQL evidence records, not a new source of truth: declared contracts, Prism semantic lineage, imported catalog evidence, runtime observations, adapter coverage, verification observations, proof artifacts, waivers, product topology, and governed bundle records can be queried together through stable node and edge families with provenance, assurance, coverage, time, snapshot, and diagnostic context preserved.",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Semantic evidence graph and agent query surface",
    "written_against": "Incan v0.3-era IncQL"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-07-05",
    "href": "048_cluster_execution_backend_mode/",
    "id": "048",
    "issue": "—",
    "issue_label": null,
    "issue_links": [],
    "issue_url": null,
    "lifecycle": "active",
    "motivation": "IncQL started with a local DataFusion reference backend. That is enough for v0.1 read, transform, collect, and write workflows, but it is not enough for larger analytical work where data lives in object stores, catalogs, warehouses, or lakehouse tables and execution must happen near the data. Cluster execution is therefore not optional product polish; it is part of the credible execution story.",
    "related": [
      "IncQL RFC 001 (dataset types and execution backend boundary)",
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 007 (Prism planning engine)",
      "IncQL RFC 008 (optimizer boundary, statistics, CBO, and adaptive execution)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)"
    ],
    "related_ids": [
      "001",
      "002",
      "004",
      "007",
      "008",
      "032",
      "033",
      "041"
    ],
    "rfc_pr": "—",
    "rfc_pr_label": null,
    "rfc_pr_links": [],
    "rfc_pr_url": null,
    "shipped_in": "—",
    "source_path": "048_cluster_execution_backend_mode.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines cluster execution as a backend mode of IncQL's existing Session execution boundary. Cluster mode must not create a second IncQL semantic model: authors still produce typed IncQL logical plans, Prism and Substrait remain the logical boundary, and backend adapters remain responsible for planning, scheduling, execution, runtime observations, and capability diagnostics. DataFusion remains the default local backend; a DataFusion-compatible cluster backend such as Ballista is the first concrete proof target because it can accept Substrait logical plans while adding scheduler, worker, shuffle, and distributed-observability concerns. Streaming uses the same backend-mode framing, but adds long-running lifecycle, checkpoint, watermark, offset, and sink-commit requirements for DataStream[T].",
    "tags": [
      {
        "key": "evidence",
        "label": "Evidence"
      },
      {
        "key": "execution",
        "label": "Execution"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Cluster execution backend mode",
    "written_against": "Incan 0.4.0-rc3 and IncQL's v0.3-era package migration context"
  },
  {
    "authors": "Danny Meijer (@dannymeijer)",
    "created": "2026-07-11",
    "href": "050_addon_component_registry/",
    "id": "050",
    "issue": "[IncQL #101](https://github.com/encero-systems/IncQL/issues/101)",
    "issue_label": "IncQL #101",
    "issue_links": [
      {
        "label": "IncQL #101",
        "url": "https://github.com/encero-systems/IncQL/issues/101"
      }
    ],
    "issue_url": "https://github.com/encero-systems/IncQL/issues/101",
    "lifecycle": "active",
    "motivation": "IncQL's current execution path is appropriate for proving DataFusion integration, but it does not scale to an ecosystem. Adding another backend currently tends to require edits to core backend enums, source enums, session dispatch, public exports, the core package manifest, and source registration logic. That makes every integration a core feature and encourages one backend object to absorb source reading, sink writing, computation, capability reporting, and configuration.",
    "related": [
      "IncQL RFC 002 (Apache Substrait integration)",
      "IncQL RFC 004 (execution context)",
      "IncQL RFC 007 (Prism logical planning and optimization engine)",
      "IncQL RFC 009 (session format handler registry)",
      "IncQL RFC 014 (function registry and catalog governance)",
      "IncQL RFC 027 (relational evidence program)",
      "IncQL RFC 032 (execution observations)",
      "IncQL RFC 033 (adapter requirements and coverage)",
      "IncQL RFC 040 (interoperability semantic profiles)",
      "IncQL RFC 041 (Prism plan ingress and external client frontends)",
      "IncQL RFC 048 (cluster execution backend mode)"
    ],
    "related_ids": [
      "002",
      "004",
      "007",
      "009",
      "014",
      "027",
      "032",
      "033",
      "040",
      "041",
      "048"
    ],
    "rfc_pr": "[IncQL #102](https://github.com/encero-systems/IncQL/pull/102)",
    "rfc_pr_label": "IncQL #102",
    "rfc_pr_links": [
      {
        "label": "IncQL #102",
        "url": "https://github.com/encero-systems/IncQL/pull/102"
      }
    ],
    "rfc_pr_url": "https://github.com/encero-systems/IncQL/pull/102",
    "shipped_in": "—",
    "source_path": "050_addon_component_registry.md",
    "status": "Draft",
    "status_key": "draft",
    "summary": "This RFC defines the package and registry contract through which ordinary Incan packages can extend IncQL with data connectors, compute runtimes, plan-ingress frontends, and evidence providers. An addon package may provide several components, but each component must be registered, identified, selected, inspected, and versioned independently. IncQL must keep pure component descriptors separate from executable hooks, use open namespaced component identifiers instead of backend or source enums, freeze a registry snapshot at an execution or frontend boundary, and keep read/write components separate from the runtime that computes a plan. DataFusion remains the built-in default runtime and first registry-shaped implementation; DuckDB is the first external proof target rather than a privileged core backend.",
    "tags": [
      {
        "key": "data-access",
        "label": "Data access"
      },
      {
        "key": "execution",
        "label": "Execution"
      },
      {
        "key": "extensibility",
        "label": "Extensibility"
      },
      {
        "key": "interoperability",
        "label": "Interoperability"
      }
    ],
    "title": "Addon component registry and package contract",
    "written_against": "Incan 0.4.0 and IncQL 0.1.0"
  }
]
</script>

<div class="pp-rfc-fallback" data-rfc-fallback markdown="1">

| RFC | Status | Tags | Title |
| ---: | --- | --- | --- |
| [000](000_incql_syntax.md) | Planned | Authoring, Interoperability, Planning | Language Specification |
| [001](001_incql_dataset.md) | In Progress | Authoring, Planning, Types | Dataset types and carriers (DataSet[T]) |
| [002](002_apache_substrait_integration.md) | In Progress | Extensibility, Interoperability, Planning | Apache Substrait integration |
| [003](closed/implemented/003_incql_query_blocks.md) | Implemented | Authoring, Interoperability, Planning | query {} blocks — syntax, typing, Substrait |
| [004](004_incql_execution_context.md) | In Progress | Data access, Execution, Interoperability | Execution context and DataFusion |
| [005](005_incql_pipe_forward.md) | Blocked | Authoring, Planning | Pipe-forward relational syntax (\|>) |
| [006](006_unnest_core_substrait.md) | Blocked | Interoperability, Planning | Promote unnest/explode to core Substrait lowering |
| [007](007_prism_planning_engine.md) | In Progress | Evidence, Planning | Prism logical planning and optimization engine |
| [008](008_optimizer_boundary_stats_cbo_aqe.md) | Planned | Evidence, Execution, Planning | Optimizer boundary, statistics, cost-based optimization, and adaptive execution |
| [009](009_session_format_handler_registry.md) | Draft | Data access, Extensibility | Session Format Handler Registry |
| [010](010_csv_ingestion_contract.md) | Draft | Data access, Interoperability | CSV dialect and interpretation contract |
| [011](011_source_discovery_contract.md) | Draft | Data access, Interoperability | Source discovery and parse-unit expansion |
| [012](closed/implemented/012_unified_scalar_expression_surface.md) | Implemented | Authoring, Planning, Types | Unified scalar expression surface |
| [013](closed/implemented/013_function_catalog_program.md) | Implemented | Authoring, Extensibility, Functions | Function catalog program |
| [014](closed/implemented/014_function_registry.md) | Implemented | Extensibility, Functions, Interoperability | Function registry and catalog governance |
| [015](closed/implemented/015_core_scalar_functions.md) | Implemented | Authoring, Functions, Interoperability | Core scalar functions and operators |
| [016](closed/implemented/016_core_aggregate_functions.md) | Implemented | Authoring, Functions, Interoperability | Core aggregate functions |
| [017](closed/implemented/017_aggregate_modifiers.md) | Implemented | Authoring, Functions, Interoperability | Aggregate modifiers |
| [018](closed/implemented/018_common_scalar_function_catalog.md) | Implemented | Authoring, Functions, Interoperability | Common scalar function catalog |
| [019](closed/implemented/019_window_functions.md) | Implemented | Authoring, Functions, Planning | Window functions |
| [020](closed/implemented/020_nested_data_functions.md) | Implemented | Authoring, Functions, Planning | Nested data functions |
| [021](closed/implemented/021_generator_table_functions.md) | Implemented | Authoring, Functions, Planning | Generator and table-valued functions |
| [022](closed/implemented/022_semi_structured_format_functions.md) | Implemented | Authoring, Functions, Interoperability | Semi-structured and format functions |
| [023](closed/implemented/023_approximate_sketch_functions.md) | Implemented | Authoring, Functions, Interoperability | Approximate and sketch functions |
| [024](closed/implemented/024_function_extension_policy.md) | Implemented | Extensibility, Functions, Interoperability | Function extension policy |
| [025](closed/implemented/025_typed_sketch_logical_values.md) | Implemented | Interoperability, Types | Typed sketch logical values |
| [026](closed/implemented/026_semi_structured_variant_values.md) | Implemented | Interoperability, Types | Semi-structured variant logical values |
| [027](027_relational_evidence_program.md) | In Progress | Evidence, Governance, Interoperability, Verification | Relational evidence program |
| [028](028_semantic_identity_targets.md) | In Progress | Evidence | Semantic identity and target model |
| [029](029_metadata_attachments.md) | In Progress | Evidence, Extensibility | Typed metadata attachments |
| [030](030_prism_lineage_graph.md) | In Progress | Evidence, Planning | Prism lineage graph |
| [031](031_inspection_artifacts.md) | In Progress | Evidence, Interoperability | Local inspection APIs and artifacts |
| [032](closed/implemented/032_execution_observations.md) | Implemented | Evidence, Execution | Execution observations |
| [033](closed/implemented/033_adapter_requirements_coverage.md) | Implemented | Evidence, Execution, Interoperability | Adapter requirements and coverage |
| [034](closed/implemented/034_quality_assertions_observations.md) | Implemented | Authoring, Evidence, Execution | Quality assertions and observations |
| [035](closed/implemented/035_governed_attributes_policy_checkpoints.md) | Implemented | Evidence, Governance, Planning | Governed attributes and policy checkpoints |
| [036](036_governed_plan_bundle.md) | Draft | Evidence, Governance, Interoperability | Governed plan bundle |
| [037](037_plan_diff_blast_radius_inputs.md) | Draft | Evidence, Planning | Plan diff and blast-radius inputs |
| [038](038_evidence_exchange_bridges.md) | Draft | Evidence, Extensibility, Interoperability | Evidence exchange bridges |
| [039](039_pandas_familiar_exploration_api.md) | Draft | Authoring | Pandas-familiar exploration API |
| [040](040_interoperability_semantic_profiles.md) | Draft | Evidence, Interoperability | Interoperability semantic profiles |
| [041](041_prism_plan_ingress_frontends.md) | Draft | Authoring, Interoperability, Planning | Prism plan ingress and external client frontends |
| [042](042_async_verification_evidence.md) | Draft | Evidence, Verification | Async verification evidence |
| [043](043_canonical_equality_digest_profiles.md) | Draft | Evidence, Interoperability, Verification | Canonical equality and digest profiles |
| [044](044_verifier_statements_proof_artifacts.md) | Draft | Evidence, Verification | Verifier statements and proof artifacts |
| [045](045_constraint_evidence_verification_planning.md) | Draft | Evidence, Planning, Verification | Constraint evidence and verification-aware planning |
| [046](046_data_contract_ingress.md) | Draft | Evidence, Governance, Interoperability | Data contract ingress and product topology |
| [047](047_semantic_evidence_graph_agent_surface.md) | Draft | Evidence, Interoperability | Semantic evidence graph and agent query surface |
| [048](048_cluster_execution_backend_mode.md) | Draft | Evidence, Execution, Interoperability | Cluster execution backend mode |
| [050](050_addon_component_registry.md) | Draft | Data access, Execution, Extensibility, Interoperability | Addon component registry and package contract |

</div>
<!-- END GENERATED RFC CATALOG -->

IncQL RFCs cover language, planning, execution, and governance decisions owned by IncQL. They form a separate series from the [Incan language RFCs](https://github.com/encero-systems/incan/tree/main/workspaces/docs-site/docs/RFCs), which govern the host language itself.

## How the RFC lifecycle works

Active RFCs remain in `docs/rfcs/` while the design is Draft, Planned, In Progress, Blocked, or Deferred. Closed records move without changing their RFC number or filename:

- `docs/rfcs/closed/implemented/` contains implemented RFCs.
- `docs/rfcs/closed/superseded/` contains RFCs replaced by a newer design record.
- `docs/rfcs/closed/rejected/` contains rejected or withdrawn RFCs.

The generated catalog treats each RFC's heading, metadata, summary, and lifecycle path as source data. The docs build fails when the index, controlled tag assignments, or lifecycle placement drifts from those records.

**v0.1 tracking:** RFCs 000–004 plus RFC 007 remain the foundation that defines when IncQL v0.1 is complete: authors can read data, write typed queries, lower through Prism to Substrait, execute through DataFusion, and write results. The catalog also includes v0.1-shipped slices that landed before the whole foundation is closed, including the function catalog and evidence/observation work.

## Create or update an RFC

Copy [TEMPLATE.md], name the file `NNN_short_slug.md`, choose the next available number, and open a pull request. Follow [Writing IncQL RFCs] for the metadata contract, lifecycle transitions, and review conventions.

<!-- References -->

[TEMPLATE.md]: TEMPLATE.md
[Writing IncQL RFCs]: ../contributing/writing_rfcs.md

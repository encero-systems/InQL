# IncQL-DB: local ACID analytical memory for IncQL applications

**Status:** Exploratory whitepaper

**Date:** 2026-05-06

**Audience:** IncQL and Incan contributors, application authors evaluating local analytical state, and implementers of future IncQL execution backends.

**Scope:** This document is non-normative. It defines a product and architecture north star for IncQL-DB. Normative behavior should later be split into focused IncQL RFCs for backend selection, storage layout, transaction semantics, vector search, and CLI contracts.

## Thesis

IncQL-DB is an embedded, directory-backed, ACID, columnar store for typed IncQL data logic.

It is designed for app-local memory, retrieval-augmented generation stores, edge analytics, durable local caches, and small analytical datasets that should live inside an application without a database server, SQL dependency, or heavyweight runtime stack.

The product shape is closer to SQLite-style local ownership plus DuckDB-style analytical execution plus Delta-inspired transaction logs than to a general DuckDB clone.

IncQL-DB should be opened directly by an application:

```incan
db = IncQLDB.open("./agent_memory.incqldb")
```

and inspected with the IncQL CLI:

```bash
incql db inspect ./agent_memory.incqldb
```

## Why this belongs in IncQL

IncQL already owns the typed relational authoring layer:

- Incan `model` types provide row shapes.
- `DataSet[T]`, `LazyFrame[T]`, `DataFrame[T]`, and `DataStream[T]` define carrier semantics.
- Prism owns internal logical planning and logical rewrites.
- Substrait is the portable logical boundary.
- `Session` owns execution and binding.

IncQL-DB should therefore be an IncQL execution and storage backend, not a separate query language. Authors should use IncQL's DSL and carrier APIs. IncQL-DB should consume the resulting logical plans and provide a local physical data plane.

No SQL support is required for the core product.

## Product goals

### Embedded and zero-admin

IncQL-DB should run in-process with the host Incan application. It should not require a daemon, local service, external coordinator, warehouse, object store, or administrator-owned catalog.

DuckDB demonstrates the value of this shape for analytical workloads. DuckDB describes itself as having "zero external dependencies" and running "in-process in its host application or as a single binary." SQLite demonstrates the same deployment principle for transactional embedded storage: "There is no intermediary server process."

IncQL-DB should inherit that operational model while remaining native to IncQL.

### Directory-backed by default

An IncQL-DB database should always be a directory ending in `.incqldb/`.

```text
agent_memory.incqldb/
  _incql_log/
  catalog/
  tables/
  indexes/
  snapshots/
  tmp/
  LOCK
```

A directory gives IncQL-DB room for immutable column segments, transaction logs, checkpoints, vector indexes, blobs, temporary files, and future compaction artifacts without overloading a single monolithic file format too early.

### IncQL and Substrait only

The core query surfaces are:

- IncQL DSL and `DataSet[T]` APIs for authors.
- Prism for internal logical plan state.
- Substrait for portable logical interchange where needed.

SQL is not part of the core. A future compatibility package may translate a SQL dialect into IncQL or Substrait, but that is outside the IncQL-DB identity.

### ACID from the start

IncQL-DB should be a real database, not a collection of best-effort files.

The north star is full ACID semantics for local embedded use:

- Atomic commits.
- Snapshot isolation for readers.
- Consistent catalog and data visibility.
- Durable committed writes after successful commit.
- Recovery after process crash or interrupted write.

The initial concurrency model should remain deliberately small: single writer, multiple snapshot readers.

### Analytical and retrieval-native

IncQL-DB should be optimized for local analytical scans and retrieval workflows:

- Columnar scans over typed vectors.
- Predicate and projection pushdown.
- Append-heavy tables.
- Hybrid retrieval over structured metadata and embedding vectors.
- Local vector indexes as first-class persisted artifacts.

The target use cases include:

- In-app RAG memory.
- Local agent memory.
- Edge-local event stores.
- Offline analytical caches.
- Typed feature stores for small applications.
- Durable local datasets shipped with an app.

## Non-goals

IncQL-DB should not initially attempt to be:

- a DuckDB-compatible engine,
- a SQL dialect,
- a distributed lakehouse,
- a server database,
- a warehouse catalog,
- a cloud object-store transaction protocol,
- a DataFusion replacement for every workload,
- a general-purpose OLTP database,
- or a wrapper around external engines.

Those systems are useful references, not compatibility targets.

## Architecture overview

```text
Incan models
    │
    ▼
IncQL carriers / query DSL
    │
    ▼
Prism logical planning
    │
    ▼
Substrait / IncQL logical plan boundary
    │
    ▼
IncQL-DB backend
    │
    ├── transaction manager
    ├── catalog
    ├── vectorized execution
    ├── column segment reader/writer
    ├── vector index manager
    └── recovery / compaction
```

The important boundary is that IncQL-DB owns physical execution and local storage. It does not own authoring semantics.

## Storage model

IncQL-DB should take direct inspiration from Delta-style storage: immutable columnar data files plus an append-only transaction log that defines the current table state.

Delta Lake is relevant because it combines versioned columnar files with a transaction log. Delta documentation describes a table as data files plus "a transaction log that stores metadata about the transactions." Delta's FAQ describes ACID support through "versioned Parquet files" and "a transaction log to keep track of all the commits."

IncQL-DB should adapt that pattern for local embedded use.

### Directory layout

```text
agent_memory.incqldb/
  LOCK
  _incql_log/
    00000000000000000000.commit
    00000000000000000001.commit
    00000000000000000064.checkpoint
  catalog/
    catalog.current
  tables/
    memories/
      data/
        part-00000001.iqseg
        part-00000002.iqseg
      deletes/
        delete-00000003.iqdel
      indexes/
        embedding/
          index-00000004.iqann
  snapshots/
    00000000000000000064.iqsnap
  tmp/
```

This layout is intentionally database-directory-first rather than table-directory-first. Delta's table model is useful, but IncQL-DB needs a single local database artifact that can hold many tables, indexes, and catalog entries.

### Commit log

The commit log is the source of truth.

Each commit records actions such as:

- create table,
- drop table,
- add segment,
- remove segment,
- add delete segment,
- add index file,
- remove index file,
- update schema,
- update table properties,
- checkpoint,
- protocol upgrade.

Readers construct a snapshot by reading a checkpoint plus later commits. Writers create new immutable files first, then publish a commit that makes those files visible.

### Segment files

Primary table data should live in binary columnar segment files, not JSON.

Segments should be Parquet-inspired:

- row groups,
- column chunks,
- pages,
- encodings,
- compression,
- statistics,
- checksums,
- footer metadata.

Apache Parquet is the right reference point because it is a column-oriented format designed for efficient storage and retrieval, with compression and encoding schemes. IncQL-DB should borrow those physical ideas while keeping its own format contract.

The internal format should be called something like `iqseg`, not Parquet, unless the project deliberately chooses full Parquet compatibility later.

Reasons to keep an IncQL-owned segment format:

- IncQL type metadata can be represented directly.
- Fixed-dimension vectors can be encoded as a native physical type.
- Vector index references can be tied to segment versions.
- Delete/tombstone handling can be optimized for local MVCC.
- Format evolution can follow IncQL-DB's own protocol.
- The implementation can start smaller than full Parquet.

### Catalog

The catalog should be logical and typed:

- database protocol version,
- table names,
- model-derived schemas,
- field IDs,
- physical column IDs,
- constraints and nullability,
- vector dimensions and distance metrics,
- index definitions,
- retention and compaction policies.

Catalog changes are committed through the same log as data changes. There should be no side-channel metadata update that can make catalog and data disagree.

## Transaction model

IncQL-DB should target local ACID with single-writer, multi-reader MVCC.

### Write path

1. Acquire the database writer lock.
2. Read the current snapshot version.
3. Write new segment/index files under `tmp/`.
4. Flush and checksum new files.
5. Move files into their final content-addressed or version-addressed locations.
6. Write a commit file under `_incql_log/` with all add/remove/schema actions.
7. Flush the commit file and containing directory.
8. Release the writer lock.

After the commit is visible, readers can observe the new snapshot. If the process crashes before the commit is visible, the orphan files are ignored and later cleaned.

### Read path

1. Resolve the requested snapshot version.
2. Load the nearest checkpoint.
3. Replay later commit files.
4. Open only segment and index files visible in that snapshot.
5. Execute against immutable files.

Readers never block on in-progress writes except where local filesystem locking requires a brief metadata read.

### Recovery

Opening a database should run recovery checks:

- detect incomplete commit files,
- ignore uncommitted temp files,
- verify commit checksums,
- verify checkpoint consistency,
- rebuild latest snapshot metadata if needed,
- surface corruption with typed diagnostics.

Recovery must not require application-specific code.

## Execution model

IncQL-DB execution should be vectorized.

Core runtime types:

- `ColumnVector[T]`
- `NullableColumnVector[T]`
- `ValidityMask`
- `DataChunk`
- `RecordBatch`
- `PhysicalPlan`
- `PhysicalOperator`

Initial operators:

- segment scan,
- filter,
- project,
- limit,
- sort,
- hash aggregate,
- hash join,
- nearest vector search,
- write sink.

Execution should work in batches so operators can stream chunks without materializing entire tables unnecessarily.

## Vector and RAG support

Vector support is part of the product center, not an extension afterthought.

IncQL-DB should support:

- fixed-dimension vector columns,
- distance functions such as cosine, dot product, and L2,
- brute-force nearest search as a correctness baseline,
- persisted ANN indexes,
- metadata prefiltering,
- hybrid scoring,
- index rebuild and compaction,
- transactionally visible index versions.

Example authoring goal:

```incan
model Memory:
    id: str
    text: str
    embedding: Vector[float32, 1536]
    source: str
    created_at: Instant

let db = IncQLDB.open("./agent_memory.incqldb")

let hits = db.table[Memory]("memories")
    .filter(.source == "docs")
    .nearest(.embedding, query_embedding, k=20)
    .select(.id, .text, .source, .created_at)
    .collect()
```

This should lower through IncQL planning into an IncQL-DB physical plan that can combine metadata filtering and vector search.

## Governed RAG store

Vector search is not enough for agentic retrieval.

IncQL-DB should support governed RAG stores as a first-class data pattern: retrieval tables where every returned item carries provenance, approval state, corpus version, retrieval evidence, and policy compatibility metadata.

This matters for advisory systems such as Hees.ai, where the retrieval layer is part of the safety model. A retrieved entry is not merely text. It is an approved evidence unit with constraints.

A vector index answers:

```text
What chunks are close to this query?
```

A governed RAG store answers:

```text
What approved knowledge was eligible, why was it retrieved, under which corpus and policy version, and is it safe to use in this workflow?
```

Governed RAG stores should support:

- source provenance,
- source approval status,
- source quotes and citations,
- corpus versioning,
- invariant or policy versioning,
- retrieval reasons,
- retrieval scores,
- eligibility filters,
- audit trails,
- unknown-question capture,
- human review state,
- reproducible retrieval traces.

Conceptual model:

```incan
model KnowledgeEntry:
    id: str
    corpus_version: str
    topic: str
    claim: str
    guidance: str
    source_title: str
    source_url: str
    source_quote: str
    source_type: str
    approval_status: str
    approved_by: str
    approved_at: Instant
    risk_level: str
    policy_version: str
    embedding: Vector[float32, 1536]

model RetrievalEvidence:
    query_id: str
    entry_id: str
    retrieval_reason: str
    retrieval_score: float
    retrieval_rank: int
    corpus_version: str
    policy_version: str
    eligible: bool
    rejected_reason: str
```

The retrieval API should make governed filtering explicit:

```incan
let hits = db.table[KnowledgeEntry]("sleep_corpus")
    .filter(.approval_status == "approved")
    .filter(.corpus_version == active_corpus_version)
    .filter(.policy_version == active_policy_version)
    .filter(.risk_level <= request_risk_level)
    .nearest(.embedding, query_embedding, k=20)
    .select(.id, .claim, .guidance, .source_title, .source_url, .source_quote)
    .collect()
```

The runtime should persist retrieval evidence separately from generated model output. This allows an agent run to answer:

- which corpus version was used,
- which sources were eligible,
- which entries were retrieved,
- why each entry was selected,
- which policy version governed the retrieval,
- whether any generated references were outside the retrieved set,
- what changed when the corpus was updated.

This makes RAG auditable rather than merely semantic.

## HyperQuant evidence-provider ledger

HyperQuant should be treated as an evidence-provider implementation behind IncQL-DB and Hees.ai storage contracts, not as the semantic owner of retrieval behavior.

The storage problem is not only vector search. HyperQuant needs a durable audit ledger for evidence-provider runs:

```text
query + package/policy/corpus/index context
  -> candidate evidence
  -> eligibility filtering
  -> eligible evidence
  -> rejected evidence with reasons
  -> provider run id and fingerprint
```

This distinction matters because governed systems must explain more than the nearest neighbors. They must explain what was considered, what was eligible, what was rejected, and which package, policy, corpus, index, and provider versions controlled the run.

IncQL-DB should support these logical records:

```incan
model EvidenceProviderRun:
    provider_run_id: str
    provider_name: str
    provider_version: str
    package_id: str
    package_version: str
    policy_version: str
    corpus_version: str
    index_version: str
    query_fingerprint: str
    intent_fingerprint: str
    candidate_count: int
    eligible_count: int
    rejected_count: int
    deterministic: bool
    replayable: bool
    created_at: Instant

model EvidenceCandidate:
    provider_run_id: str
    entry_id: str
    package_id: str
    corpus_version: str
    index_version: str
    score: float
    rank: int
    retrieval_reason: str
    eligibility_status: str
    rejected_reason: str
    policy_rule_id: str
    authority_boundary: str
    risk_level: str

model EvidenceProviderFingerprint:
    provider_run_id: str
    provider_name: str
    provider_version: str
    package_version: str
    policy_version: str
    corpus_version: str
    index_version: str
    query_fingerprint: str
    result_fingerprint: str
```

Eligible evidence and rejected evidence may be represented as filtered views over `EvidenceCandidate`, or as separate physical tables if the storage engine needs different retention or indexing behavior. The important contract is that rejected evidence is first-class data, not a log message.

For federated domain runtimes, IncQL-DB should also support a run-level grouping record:

```incan
model FederatedEvidenceRun:
    federated_run_id: str
    user_request_id: str
    selected_package_ids: list[str]
    rejected_package_ids: list[str]
    provider_run_ids: list[str]
    arbitration_version: str
    global_policy_version: str
    final_admissibility_status: str
```

The governing rule is:

```text
Vectors nominate evidence. They do not authorize evidence.
```

Vector similarity, quantized indexes, and approximate-nearest-neighbor search can propose candidates. Package, policy, corpus, authority, and admissibility rules decide whether those candidates may become evidence. IncQL-DB must preserve that boundary in storage so later inspection can distinguish retrieval mechanics from governance decisions.

## CLI

The command surface should live under `incql db`.

```bash
incql db init ./agent_memory.incqldb
incql db inspect ./agent_memory.incqldb
incql db tables ./agent_memory.incqldb
incql db schema ./agent_memory.incqldb memories
incql db verify ./agent_memory.incqldb
incql db compact ./agent_memory.incqldb
incql db recover ./agent_memory.incqldb
incql db export ./agent_memory.incqldb memories --to memories.parquet
```

The CLI is not the primary runtime. It exists for inspection, verification, maintenance, local workflows, and debugging.

## Relationship to interop

CSV, Parquet, Arrow, and other external formats are important, but they should not define IncQL-DB's core identity.

IncQL already owns source and sink concepts at the session layer. IncQL-DB should provide a native store and expose import/export or scan/write adapters through IncQL's source/sink system.

This keeps the database small and avoids making every external format a storage dependency.

## Related systems

### SurrealDB

SurrealDB is a useful product reference for IncQL-DB's app-local AI memory direction, but not the storage or query architecture to copy.

SurrealDB describes itself as a multi-model database that combines document, graph, time-series, relational, geospatial, and key-value data models with "vector, full-text, hybrid" retrieval. It also explicitly targets the same deployment zone IncQL-DB cares about: a single Rust binary that can run "embedded (in-app), in the browser (via WebAssembly), in the edge."

That validates several IncQL-DB product bets:

- embedded local deployment matters for AI and edge applications,
- vector retrieval should sit next to structured filtering rather than in a separate service,
- hybrid retrieval is becoming table stakes for app memory,
- local database ergonomics should be strong enough for application developers, not only database operators.

SurrealDB's features also show that native vector indexing belongs in the core. Its feature documentation describes HNSW vector indexing for approximate nearest-neighbour search with euclidean, cosine, and manhattan distance metrics, and its vector docs distinguish brute-force exact search from HNSW approximate search.

IncQL-DB should not adopt SurrealDB's center of gravity. SurrealDB says it is "at its core, a document database" where each record is stored on an underlying key-value engine. IncQL-DB should remain typed, IncQL-native, analytical, and columnar:

- IncQL models define schemas.
- IncQL and Substrait define the query boundary.
- Columnar segments are the primary physical store.
- Vectorized execution is the primary execution model.
- SQL-like or SurrealQL-like syntax is not part of the core.

The useful comparison is therefore:

| System    | Center of gravity                                      |
| --------- | ------------------------------------------------------ |
| SurrealDB | multi-model document/KV database with SurrealQL        |
| DuckDB    | embedded analytical SQL engine                         |
| Delta     | immutable columnar files plus transaction log          |
| IncQL-DB   | embedded typed analytical memory store for IncQL plans  |

## Implementation path

The whitepaper north star should be split into RFCs before implementation.

Recommended RFC sequence:

1. **IncQL-DB backend RFC**
   Define `BackendKind.IncQLDBEngine`, session selection, plan execution boundary, error classes, and compatibility with existing DataFusion-backed sessions.

2. **Directory and transaction-log RFC**
   Define `.incqldb/` layout, commit file format, checkpointing, locking, recovery, and snapshot semantics.

3. **Column segment RFC**
   Define `iqseg` physical layout, primitive types, nullability, statistics, compression hooks, and checksums.

4. **Vectorized execution RFC**
   Define physical operators, `DataChunk`, `ColumnVector`, and the first supported plan subset.

5. **Vector column and ANN RFC**
   Define vector physical type, distance functions, index files, transactionally visible indexes, and query lowering.

6. **HyperQuant evidence-provider ledger RFC**
   Define evidence-provider runs, candidate evidence, rejected evidence, provider fingerprints, index provenance, federated evidence-run grouping, and replay/debug contracts.

7. **CLI RFC**
   Define `incql db` commands and diagnostics.

## First useful vertical slice

The first implementation should prove the whole architecture with a narrow plan subset:

- open/create `.incqldb/`,
- create one table from an Incan model-derived schema,
- append batches,
- commit with WAL/log semantics,
- scan committed segments,
- filter/project/limit,
- collect into `DataFrame[T]`,
- persist one evidence-provider run with eligible and rejected candidate rows,
- inspect and verify with `incql db`.

Vector search can follow immediately after this slice, starting with brute-force search over fixed-dimension vectors before adding ANN index files.

## Open questions

- Should the segment format target later Parquet compatibility, or remain permanently IncQL-native?
- Should commit files be binary from the start, or use a temporary text format until the transaction protocol stabilizes?
- What is the smallest ACID guarantee acceptable for the first implementation while still preserving the north star?
- How should IncQL model field IDs be assigned and preserved across schema evolution?
- Should vector indexes be table-level, segment-level, or both?
- Should eligible and rejected evidence be stored as separate physical tables or as status-filtered candidate rows?
- What fingerprint inputs are required to replay or compare a HyperQuant provider run?
- How should federated evidence runs group package-specific provider runs without merging specialist evidence into one
  anonymous context?
- How should compaction coordinate data segments, delete files, and index rebuilds?
- What is the compatibility story for opening old `.incqldb/` directories after protocol changes?

## References

- [DuckDB documentation](https://duckdb.org/)
- [SQLite serverless documentation](https://www.sqlite.org/serverless.html)
- [Delta Lake architecture overview](https://delta-io.github.io/delta-rs/how-delta-lake-works/architecture-of-delta-table/)
- [Delta Lake FAQ](https://docs.delta.io/latest/delta-faq.html)
- [Apache Parquet overview](https://parquet.apache.org/docs/overview/)
- [Apache Parquet file format](https://parquet.apache.org/docs/file-format/)
- [SurrealDB introduction](https://surrealdb.com/docs/surrealdb/introduction)
- [SurrealDB concepts](https://surrealdb.com/docs/surrealdb/introduction/concepts)
- [SurrealDB features](https://surrealdb.com/features)
- [SurrealDB vector database docs](https://surrealdb.com/docs/surrealdb/models/vector)
- [IncQL architecture](../architecture.md)
- [IncQL RFC 004: Execution context](../rfcs/004_incql_execution_context.md)
- [IncQL RFC 007: Prism logical planning and optimization engine](../rfcs/007_prism_planning_engine.md)

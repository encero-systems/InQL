# IncQL RFCs

IncQL uses its **own** RFC series (starting at 000), independent of the [Incan language RFCs][incan-rfcs].

**New RFC:** copy [TEMPLATE.md], name the file `NNN_short_slug.md`, pick the next number from the table (or from open issues), and open a PR. Section order and header fields follow that template. For workflow and conventions, see [Writing IncQL RFCs].

## Lifecycle layout

- `docs/rfcs/` contains active RFCs: Draft, Planned, In Progress, Blocked, or Deferred.
- `docs/rfcs/closed/implemented/` contains implemented RFCs.
- `docs/rfcs/closed/superseded/` contains RFCs replaced by a newer design record.
- `docs/rfcs/closed/rejected/` contains rejected or withdrawn RFCs.

The filename and RFC number stay unchanged when a document moves between lifecycle folders.

| RFC            | Status      | Title                                                                                             |     |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------- | --- |
| [000][rfc-000] | Planned     | Language specification — core model, naming, schema shapes, layer boundaries                      |     |
| [001][rfc-001] | In Progress | Dataset types and carriers (`DataSet[T]`, `BoundedDataSet[T]`, `UnboundedDataSet[T]`)             |     |
| [002][rfc-002] | In Progress | Apache Substrait — `Rel`-level contract, mapping catalog, binding boundaries                      |     |
| [003][rfc-003] | Implemented | `query {}` blocks — grammar, typing, Substrait lowering                                           |     |
| [004][rfc-004] | In Progress | Execution context — session, DataFusion, read/transform/write                                     |     |
| [005][rfc-005] | Blocked     | Pipe-forward relational syntax (`\|>`) — optional surface                                         |     |
| [006][rfc-006] | Blocked     | Promote unnest/explode to core Substrait lowering — blocked on upstream Substrait standardization |     |
| [007][rfc-007] | In Progress | Prism logical planning and optimization engine                                                    |     |
| [008][rfc-008] | Planned     | Optimizer boundary, statistics, cost-based optimization, and adaptive execution                   |     |
| [009][rfc-009] | Draft       | Session format handler registry (plugin-style source format registration)                         |     |
| [010][rfc-010] | Draft       | CSV dialect and interpretation contract                                                           |     |
| [011][rfc-011] | Draft       | Source discovery and parse-unit expansion                                                         |     |
| [012][rfc-012] | Implemented | Unified scalar expression surface                                                                 |     |
| [013][rfc-013] | Implemented | Function catalog program                                                                          |     |
| [014][rfc-014] | Implemented | Function registry and catalog governance                                                          |     |
| [015][rfc-015] | Implemented | Core scalar functions and operators                                                               |     |
| [016][rfc-016] | Implemented | Core aggregate functions                                                                          |     |
| [017][rfc-017] | Implemented | Aggregate modifiers                                                                               |     |
| [018][rfc-018] | Implemented | Common scalar function catalog                                                                    |     |
| [019][rfc-019] | Implemented | Window functions                                                                                  |     |
| [020][rfc-020] | Implemented | Nested data functions                                                                             |     |
| [021][rfc-021] | Implemented | Generator and table-valued functions                                                              |     |
| [022][rfc-022] | Implemented | Semi-structured and format functions                                                              |     |
| [023][rfc-023] | Implemented | Approximate and sketch functions                                                                  |     |
| [024][rfc-024] | Implemented | Function extension policy                                                                         |     |
| [025][rfc-025] | Implemented | Typed sketch logical values                                                                       |     |
| [026][rfc-026] | Implemented | Semi-structured variant logical values                                                            |     |
| [027][rfc-027] | In Progress | Relational evidence program                                                                       |     |
| [028][rfc-028] | In Progress | Semantic identity and target model                                                                |     |
| [029][rfc-029] | In Progress | Typed metadata attachments                                                                        |     |
| [030][rfc-030] | In Progress | Prism lineage graph                                                                               |     |
| [031][rfc-031] | In Progress | Local inspection APIs and artifacts                                                               |     |
| [032][rfc-032] | Implemented | Execution observations                                                                            |     |
| [033][rfc-033] | Implemented | Adapter requirements and coverage                                                                 |     |
| [034][rfc-034] | Implemented | Quality assertions and observations                                                               |     |
| [035][rfc-035] | Implemented | Governed attributes and policy checkpoints                                                        |     |
| [036][rfc-036] | Draft       | Governed plan bundle                                                                              |     |
| [037][rfc-037] | Draft       | Plan diff and blast-radius inputs                                                                 |     |
| [038][rfc-038] | Draft       | Evidence exchange bridges                                                                         |     |
| [039][rfc-039] | Draft       | Pandas-familiar exploration API                                                                   |     |
| [040][rfc-040] | Draft       | Interoperability semantic profiles                                                                |     |
| [041][rfc-041] | Draft       | Prism plan ingress and external client frontends                                                  |     |
| [042][rfc-042] | Draft       | Async verification evidence                                                                       |     |
| [043][rfc-043] | Draft       | Canonical equality and digest profiles                                                            |     |
| [044][rfc-044] | Draft       | Verifier statements and proof artifacts                                                           |     |
| [045][rfc-045] | Draft       | Constraint evidence and verification-aware planning                                               |     |
| [046][rfc-046] | Draft       | Data contract ingress and product topology                                                        |     |
| [047][rfc-047] | Draft       | Semantic evidence graph and agent query surface                                                   |     |
| [048][rfc-048] | Draft       | Cluster execution backend mode                                                                    |     |
| [050][rfc-050] | Draft       | Addon component registry and package contract                                                     |     |

<!-- TODO: #7: auto populate this table (like how we do in incan) -->

**v0.1 tracking:** RFCs 000–004 plus RFC 007 remain the foundation that defines when IncQL v0.1 is complete: authors can read data, write typed queries, lower through Prism to Substrait, execute through DataFusion, and write results. The table also marks additional v0.1-shipped slices that landed before the whole foundation is closed, including the function catalog and evidence/observation work.

New RFCs should follow [TEMPLATE.md] (aligned with Incan’s RFC structure, adapted for IncQL).

<!-- References -->

[TEMPLATE.md]: TEMPLATE.md
[Writing IncQL RFCs]: ../contributing/writing_rfcs.md
[rfc-000]: 000_incql_syntax.md
[rfc-001]: 001_incql_dataset.md
[rfc-002]: 002_apache_substrait_integration.md
[rfc-003]: closed/implemented/003_incql_query_blocks.md
[rfc-004]: 004_incql_execution_context.md
[rfc-005]: 005_incql_pipe_forward.md
[rfc-006]: 006_unnest_core_substrait.md
[rfc-007]: 007_prism_planning_engine.md
[rfc-008]: 008_optimizer_boundary_stats_cbo_aqe.md
[rfc-009]: 009_session_format_handler_registry.md
[rfc-010]: 010_csv_ingestion_contract.md
[rfc-011]: 011_source_discovery_contract.md
[rfc-012]: closed/implemented/012_unified_scalar_expression_surface.md
[rfc-013]: closed/implemented/013_function_catalog_program.md
[rfc-014]: closed/implemented/014_function_registry.md
[rfc-015]: closed/implemented/015_core_scalar_functions.md
[rfc-016]: closed/implemented/016_core_aggregate_functions.md
[rfc-017]: closed/implemented/017_aggregate_modifiers.md
[rfc-018]: closed/implemented/018_common_scalar_function_catalog.md
[rfc-019]: closed/implemented/019_window_functions.md
[rfc-020]: closed/implemented/020_nested_data_functions.md
[rfc-021]: closed/implemented/021_generator_table_functions.md
[rfc-022]: closed/implemented/022_semi_structured_format_functions.md
[rfc-023]: closed/implemented/023_approximate_sketch_functions.md
[rfc-024]: closed/implemented/024_function_extension_policy.md
[rfc-025]: closed/implemented/025_typed_sketch_logical_values.md
[rfc-026]: closed/implemented/026_semi_structured_variant_values.md
[rfc-027]: 027_relational_evidence_program.md
[rfc-028]: 028_semantic_identity_targets.md
[rfc-029]: 029_metadata_attachments.md
[rfc-030]: 030_prism_lineage_graph.md
[rfc-031]: 031_inspection_artifacts.md
[rfc-032]: closed/implemented/032_execution_observations.md
[rfc-033]: closed/implemented/033_adapter_requirements_coverage.md
[rfc-034]: closed/implemented/034_quality_assertions_observations.md
[rfc-035]: closed/implemented/035_governed_attributes_policy_checkpoints.md
[rfc-036]: 036_governed_plan_bundle.md
[rfc-037]: 037_plan_diff_blast_radius_inputs.md
[rfc-038]: 038_evidence_exchange_bridges.md
[rfc-039]: 039_pandas_familiar_exploration_api.md
[rfc-040]: 040_interoperability_semantic_profiles.md
[rfc-041]: 041_prism_plan_ingress_frontends.md
[rfc-042]: 042_async_verification_evidence.md
[rfc-043]: 043_canonical_equality_digest_profiles.md
[rfc-044]: 044_verifier_statements_proof_artifacts.md
[rfc-045]: 045_constraint_evidence_verification_planning.md
[rfc-046]: 046_data_contract_ingress.md
[rfc-047]: 047_semantic_evidence_graph_agent_surface.md
[rfc-048]: 048_cluster_execution_backend_mode.md
[rfc-050]: 050_addon_component_registry.md
[incan-rfcs]: https://github.com/encero-systems/incan/tree/main/workspaces/docs-site/docs/RFCs

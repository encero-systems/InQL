# IncQL RFCs

IncQL uses its **own** RFC series (starting at 000), independent of the [Incan language RFCs][incan-rfcs].

**New RFC:** copy [TEMPLATE.md], name the file `NNN_short_slug.md`, pick the next number from the table (or from open issues), and open a PR. Section order and header fields follow that template. For workflow and conventions, see [Writing IncQL RFCs].

<!-- BEGIN GENERATED RFC INDEX -->

| RFC | Status | Title |
| --- | --- | --- |
| [000](000_incql_syntax.md) | Planned | Language Specification |
| [001](001_incql_dataset.md) | In Progress | Dataset types and carriers (`DataSet[T]`) |
| [002](002_apache_substrait_integration.md) | In Progress | Apache Substrait integration |
| [003](003_incql_query_blocks.md) | Implemented | `query {}` blocks — syntax, typing, Substrait |
| [004](004_incql_execution_context.md) | In Progress | Execution context and DataFusion |
| [005](005_incql_pipe_forward.md) | Blocked | Pipe-forward relational syntax (`\|>`) |
| [006](006_unnest_core_substrait.md) | Blocked | Promote unnest/explode to core Substrait lowering |
| [007](007_prism_planning_engine.md) | In Progress | Prism logical planning and optimization engine |
| [008](008_optimizer_boundary_stats_cbo_aqe.md) | Planned | Optimizer boundary, statistics, cost-based optimization, and adaptive execution |
| [009](009_session_format_handler_registry.md) | Draft | Session Format Handler Registry |
| [010](010_csv_ingestion_contract.md) | Draft | CSV dialect and interpretation contract |
| [011](011_source_discovery_contract.md) | Draft | Source discovery and parse-unit expansion |
| [012](012_unified_scalar_expression_surface.md) | Implemented | Unified scalar expression surface |
| [013](013_function_catalog_program.md) | Implemented | Function catalog program |
| [014](014_function_registry.md) | Implemented | Function registry and catalog governance |
| [015](015_core_scalar_functions.md) | Implemented | Core scalar functions and operators |
| [016](016_core_aggregate_functions.md) | Implemented | Core aggregate functions |
| [017](017_aggregate_modifiers.md) | Implemented | Aggregate modifiers |
| [018](018_common_scalar_function_catalog.md) | Implemented | Common scalar function catalog |
| [019](019_window_functions.md) | Implemented | Window functions |
| [020](020_nested_data_functions.md) | Implemented | Nested data functions |
| [021](021_generator_table_functions.md) | Implemented | Generator and table-valued functions |
| [022](022_semi_structured_format_functions.md) | Implemented | Semi-structured and format functions |
| [023](023_approximate_sketch_functions.md) | Implemented | Approximate and sketch functions |
| [024](024_function_extension_policy.md) | Implemented | Function extension policy |
| [025](025_typed_sketch_logical_values.md) | Implemented | Typed sketch logical values |
| [026](026_semi_structured_variant_values.md) | Implemented | Semi-structured variant logical values |
| [027](027_relational_evidence_program.md) | In Progress | Relational evidence program |
| [028](028_semantic_identity_targets.md) | In Progress | Semantic identity and target model |
| [029](029_metadata_attachments.md) | In Progress | Typed metadata attachments |
| [030](030_prism_lineage_graph.md) | In Progress | Prism lineage graph |
| [031](031_inspection_artifacts.md) | In Progress | Local inspection APIs and artifacts |
| [032](032_execution_observations.md) | Implemented | Execution observations |
| [033](033_adapter_requirements_coverage.md) | Implemented | Adapter requirements and coverage |
| [034](034_quality_assertions_observations.md) | Implemented | Quality assertions and observations |
| [035](035_governed_attributes_policy_checkpoints.md) | Implemented | Governed attributes and policy checkpoints |
| [036](036_governed_plan_bundle.md) | Draft | Governed plan bundle |
| [037](037_plan_diff_blast_radius_inputs.md) | Draft | Plan diff and blast-radius inputs |
| [038](038_evidence_exchange_bridges.md) | Draft | Evidence exchange bridges |
| [039](039_pandas_familiar_exploration_api.md) | Draft | Pandas-familiar exploration API |
| [040](040_interoperability_semantic_profiles.md) | Draft | Interoperability semantic profiles |
| [041](041_prism_plan_ingress_frontends.md) | Draft | Prism plan ingress and external client frontends |
| [042](042_async_verification_evidence.md) | Draft | Async verification evidence |
| [043](043_canonical_equality_digest_profiles.md) | Draft | Canonical equality and digest profiles |
| [044](044_verifier_statements_proof_artifacts.md) | Draft | Verifier statements and proof artifacts |
| [045](045_constraint_evidence_verification_planning.md) | Draft | Constraint evidence and verification-aware planning |
| [046](046_data_contract_ingress.md) | Draft | Data contract ingress and product topology |
| [047](047_semantic_evidence_graph_agent_surface.md) | Draft | Semantic evidence graph and agent query surface |
| [048](048_cluster_execution_backend_mode.md) | Draft | Cluster execution backend mode |
| [050](050_addon_component_registry.md) | Draft | Addon component registry and package contract |

<!-- END GENERATED RFC INDEX -->


**v0.1 tracking:** RFCs 000–004 plus RFC 007 remain the foundation that defines when IncQL v0.1 is complete: authors can read data, write typed queries, lower through Prism to Substrait, execute through DataFusion, and write results. The table also marks additional v0.1-shipped slices that landed before the whole foundation is closed, including the function catalog and evidence/observation work.

New RFCs should follow [TEMPLATE.md] (aligned with Incan’s RFC structure, adapted for IncQL).

<!-- References -->

[TEMPLATE.md]: TEMPLATE.md
[Writing IncQL RFCs]: ../contributing/writing_rfcs.md
[incan-rfcs]: https://github.com/encero-systems/incan/tree/main/workspaces/docs-site/docs/RFCs

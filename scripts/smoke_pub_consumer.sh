#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INCAN_BIN="${INCAN:-incan}"

SMOKE_ROOT="$ROOT/target/smoke_pub_consumer"
PROJECT_DIR="$SMOKE_ROOT/project"

rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR"

"$INCAN_BIN" init "$PROJECT_DIR" --name incql_pub_consumer_smoke >/dev/null

cat > "$PROJECT_DIR/incan.toml" <<EOF
[project]
name = "incql_pub_consumer_smoke"
version = "0.1.0"

[dependencies]
incql = { path = "$ROOT" }

[project.scripts]
main = "src/main.incn"
EOF

cat > "$PROJECT_DIR/src/main.incn" <<'EOF'
from pub::incql import Session, SessionError, always_true

@derive(Clone)
model Order:
    id: int


def main() -> Result[None, SessionError]:
    mut session = Session.default()
    orders = session.read_csv[Order]("orders", "tests/fixtures/orders.csv")?
    transformed = orders.filter(always_true()).limit(1)
    session.collect(transformed)?
    return Ok(None)
EOF

cat > "$PROJECT_DIR/src/query_blocks_smoke.incn" <<EOF
"""Pub-consumer smoke for the IncQL query-block vocabulary surface."""

import pub::incql

from pub::incql import (
    DataFrame,
    EvidenceExchangeRecord,
    EvidenceExchangeRecordKind,
    EvidenceExchangeTargetFormat,
    ExternalEvidenceConfidence,
    GovernedAttributeStatus,
    IngressAnalysis,
    IngressAnalysisStatus,
    IngressCoverageState,
    IngressFrontendKind,
    IngressOriginKind,
    IngressOriginReference,
    LazyFrame,
    PolicyCheckpointAction,
    PolicyCheckpointKind,
    PlanDiff,
    PlanDiffChangeFamily,
    QualityObservationStatus,
    SemanticProfileAssessmentState,
    SemanticProfileDimensionKind,
    SemanticProfileDimensionState,
    Session,
    VerificationAssertionKind,
    VerificationAssurance,
    VerificationCaptureBasis,
    VerificationLifecycle,
    VerificationOutcome,
    assess_profile_for_target,
    array,
    bundle_summary_exchange,
    diff_plan_bundles,
    col,
    eq,
    external_evidence_artifact,
    external_evidence_exchange,
    governed_attribute,
    governed_plan_bundle,
    governed_plan_bundle_from_inspection,
    incql_baseline_profile,
    analyze_ingress_plan,
    client_session_context,
    inspect_plan,
    ingress_filter,
    ingress_limit,
    ingress_named_table,
    ingress_origin_reference,
    ingress_plan,
    ingress_request,
    lit,
    openlineage_exchange,
    policy_checkpoint,
    semantic_dimension,
    sql_dialect_profile,
    telemetry_exchange,
    transformation_project_exchange,
    project_verification_state,
    verification_assertion,
    verification_coverage,
    verification_evidence,
    verification_observation,
    verification_run,
)
from std.testing import assert_is_ok, fail_t


@derive(Clone)
pub model AggregateOrder:
    pub customer_id: str
    pub amount: int


@derive(Clone)
pub model SelectedOrder:
    pub customer: str
    pub adjusted: int
    pub doubled: int


@derive(Clone)
pub model CustomerRollup:
    pub customer: str
    pub total: int
    pub order_count: int


@derive(Clone)
pub model CustomerOnly:
    pub customer: str


@derive(Clone)
pub model CustomerAmount:
    pub customer: str
    pub amount: int


@derive(Clone)
pub model JoinedAmount:
    pub customer: str
    pub joined_amount: int


@derive(Clone)
pub model LeftMatchedAmount:
    pub customer: str
    pub matched_amount: int


@derive(Clone)
pub model ExplodedWindowOrder:
    pub customer: str
    pub amount: int
    pub tag: str
    pub row_num: int


const AGGREGATE_ORDERS_CSV_FIXTURE: str = "$ROOT/tests/fixtures/aggregate_orders.csv"


def _orders(mut session: Session, table_name: str) -> LazyFrame[AggregateOrder]:
    """Load the shared aggregate-order fixture."""
    return assert_is_ok(
        session.read_csv(table_name, AGGREGATE_ORDERS_CSV_FIXTURE),
        "aggregate orders fixture should load",
    )


def _collect_or_fail[T with Clone](mut session: Session, frame: LazyFrame[T]) -> DataFrame[T]:
    """Collect a query-block frame or fail with the backend diagnostic."""
    match session.collect(frame):
        Ok(df) => return df
        Err(err) => return fail_t(err.error_message())


def _preview_line_contains_all(line: str, expected_cells: list[str]) -> bool:
    """Return whether one rendered preview row contains every expected cell value."""
    for cell in expected_cells:
        if not line.contains(cell):
            return false
    return true


def _assert_preview_row_contains(payload: str, expected_cells: list[str], context: str) -> None:
    """Assert one rendered preview row carries the expected materialized cells together."""
    for line in payload.split("\n"):
        if _preview_line_contains_all(line, expected_cells):
            return
    return fail_t(context)


def _brace_select_aliases_and_lateral_aliases_materialize() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "query_orders_select")

    # -- Act --
    selected: LazyFrame[SelectedOrder] = query {
        FROM orders
        SELECT
            .customer_id as customer,
            .amount + 5 as adjusted,
            adjusted * 2 as doubled,
    }
    df = _collect_or_fail(session, selected)
    payload = df.preview_text()

    # -- Assert --
    assert df.row_count() == 3, "query SELECT should preserve source row count"
    assert df.resolved_columns() == ["customer", "adjusted", "doubled"], "query SELECT should publish requested aliases"
    _assert_preview_row_contains(payload, ["A", "15", "30"], "SELECT should materialize computed aliases")
    _assert_preview_row_contains(payload, ["B", "12", "24"], "SELECT should materialize later rows")


def _grouped_aggregate_select_materializes_group_and_measures() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "query_orders_grouped")

    # -- Act --
    grouped: LazyFrame[CustomerRollup] = query {
        FROM orders
        GROUP BY .customer_id
        SELECT
            .customer_id as customer,
            sum(.amount) as total,
            count() as order_count,
    }
    df = _collect_or_fail(session, grouped)
    payload = df.preview_text()

    # -- Assert --
    assert df.row_count() == 2, "query GROUP BY should produce one row per group"
    assert df.resolved_columns() == ["customer", "total", "order_count"], "query aggregate SELECT should preserve SELECT order and aliases"
    _assert_preview_row_contains(payload, ["A", "25", "2"], "customer A grouped values should materialize")
    _assert_preview_row_contains(payload, ["B", "7", "1"], "customer B grouped values should materialize")


def _select_distinct_materializes_unique_rows() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "query_orders_distinct")

    # -- Act --
    distinct_customers: LazyFrame[CustomerOnly] = query {
        FROM orders
        SELECT DISTINCT
            .customer_id as customer,
    }
    df = _collect_or_fail(session, distinct_customers)
    payload = df.preview_text()

    # -- Assert --
    assert df.row_count() == 2, "SELECT DISTINCT should collapse duplicate projection rows"
    assert df.resolved_columns() == ["customer"], "SELECT DISTINCT should preserve selected output columns"
    _assert_preview_row_contains(payload, ["A"], "SELECT DISTINCT should include customer A")
    _assert_preview_row_contains(payload, ["B"], "SELECT DISTINCT should include customer B")


def _post_select_where_order_and_limit_materialize() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "query_orders_order_limit")

    # -- Act --
    selected: LazyFrame[CustomerAmount] = query {
        FROM orders
        SELECT
            .customer_id as customer,
            .amount as amount,
        WHERE .amount > 10
        ORDER BY desc(.amount)
        LIMIT 1
    }
    df = _collect_or_fail(session, selected)
    payload = df.preview_text()

    # -- Assert --
    assert df.row_count() == 1, "post-SELECT WHERE plus LIMIT should leave one row"
    assert df.resolved_columns() == ["customer", "amount"], "post-SELECT filtering should keep projected columns"
    _assert_preview_row_contains(payload, ["A", "15"], "ORDER BY DESC should keep the highest filtered amount")


def _join_and_left_join_materialize() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "query_orders_join_left")
    discounts = _orders(session, "query_orders_join_right")
    missing = _orders(session, "query_orders_left_missing").filter(eq(col("customer_id"), lit("Z")))

    # -- Act --
    joined: LazyFrame[JoinedAmount] = query {
        FROM orders
        JOIN discounts
        ON .customer_id == discounts.customer_id
        SELECT
            .customer_id as customer,
            discounts.amount as joined_amount,
        LIMIT 1
    }
    left_joined: LazyFrame[LeftMatchedAmount] = query {
        FROM orders
        LEFT JOIN missing
        ON .customer_id == missing.customer_id
        SELECT
            .customer_id as customer,
            missing.amount as matched_amount,
    }
    joined_df = _collect_or_fail(session, joined)
    left_df = _collect_or_fail(session, left_joined)

    # -- Assert --
    assert joined_df.row_count() == 1, "JOIN query block should materialize joined rows"
    assert joined_df.resolved_columns() == ["customer", "joined_amount"], "JOIN SELECT should publish requested aliases"
    assert left_df.row_count() == 3, "LEFT JOIN query block should preserve unmatched left rows"
    assert left_df.resolved_columns() == ["customer", "matched_amount"], "LEFT JOIN SELECT should publish requested aliases"


def _explode_and_window_by_materialize() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "query_orders_explode_window")
    enriched = orders.with_column("tags", array([lit("paid"), col("customer_id")]))

    # -- Act --
    windowed: LazyFrame[ExplodedWindowOrder] = query {
        FROM enriched
        EXPLODE .tags as tag
        WINDOW BY row_num = row_number().over(window().partition_by([.customer_id]).order_by([desc(.amount)]))
        SELECT
            .customer_id as customer,
            .amount as amount,
            .tag as tag,
            .row_num as row_num,
        ORDER BY desc(.amount)
        LIMIT 2
    }
    df = _collect_or_fail(session, windowed)
    payload = df.preview_text()

    # -- Assert --
    assert df.row_count() == 2, "EXPLODE plus WINDOW BY should materialize generated rows"
    assert df.resolved_columns() == ["customer", "amount", "tag", "row_num"], "EXPLODE/WINDOW SELECT should publish requested aliases"
    _assert_preview_row_contains(payload, ["A", "paid", "1"], "WINDOW BY should rank generated rows")


def _colon_spelling_materializes_same_select_surface() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "query_orders_colon_select")

    # -- Act --
    selected: LazyFrame[CustomerAmount] = query:
        FROM orders
        SELECT:
            .customer_id as customer
            .amount as amount
    df = _collect_or_fail(session, selected)
    payload = df.preview_text()

    # -- Assert --
    assert df.row_count() == 3, "query: SELECT should preserve source row count"
    assert df.resolved_columns() == ["customer", "amount"], "query: SELECT should publish requested aliases"
    _assert_preview_row_contains(payload, ["A", "10"], "query: SELECT should materialize the first row")
    _assert_preview_row_contains(payload, ["B", "7"], "query: SELECT should materialize later rows")


def _quality_vocab_assertions_execute() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "quality_vocab_orders")
    max_null_rate = 0.0
    brace_checks = quality {
        row_count(Some(1)).require()
        null_rate(.customer_id, max_null_rate)
        unique(.amount)
    }
    colon_checks = quality:
        group_row_count([.customer_id], 1, Some(2)).quarantine()

    # -- Act --
    brace_observations = session.observe_quality(orders.clone(), brace_checks)
    colon_observations = session.observe_quality(orders, colon_checks)

    # -- Assert --
    assert len(brace_observations) == 3, "quality { } should produce one observation per assertion"
    assert brace_observations[0].status == QualityObservationStatus.Passed, "quality row_count should execute"
    assert brace_observations[1].status == QualityObservationStatus.Passed, "quality null_rate should execute"
    assert brace_observations[2].status == QualityObservationStatus.Passed, "quality unique should execute"
    assert brace_observations[0].assertion.mode.value() == "require", "quality vocab should preserve policy methods"
    assert len(colon_observations) == 1, "quality: should produce executable assertions"
    assert colon_observations[0].status == QualityObservationStatus.Passed, "quality group_row_count should execute"
    assert colon_observations[0].assertion.mode.value() == "quarantine", "quality: should preserve policy methods"


def _governed_evidence_exports_compile_for_pub_consumers() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "governed_evidence_orders")

    # -- Act --
    inspection = inspect_plan(orders)
    attribute = governed_attribute(inspection.output_fields[0], "classification", "internal").with_status(
        GovernedAttributeStatus.Accepted,
    )
    checkpoint = policy_checkpoint(
        inspection.plan_target,
        PolicyCheckpointKind.Planning,
        PolicyCheckpointAction.Observe,
        "policy:smoke",
        "governed_evidence_observed",
        evidence_refs=[attribute.attribute_id],
    )

    # -- Assert --
    assert len(inspection.governed_attributes) > 0, "pub consumers should see inspection governed attributes"
    assert len(inspection.policy_checkpoints) == 1, "pub consumers should see inspection policy checkpoints"
    assert attribute.status == GovernedAttributeStatus.Accepted, "pub consumers should use governed attribute modifiers"
    assert checkpoint.action == PolicyCheckpointAction.Observe, "pub consumers should construct policy checkpoints"


def _governed_plan_bundle_exports_compile_for_pub_consumers() -> None:
    # -- Arrange --
    mut session = Session.default()
    orders = _orders(session, "governed_bundle_orders")

    # -- Act --
    bundle = governed_plan_bundle(orders)

    # -- Assert --
    assert bundle.section_available("plan"), "pub consumers should inspect bundle section availability"
    assert len(bundle.sections) > 0, "pub consumers should receive bundle section records"
    assert len(bundle.governed_attributes) > 0, "pub consumers should receive governed evidence in bundles"
    assert len(bundle.policy_checkpoints) == 1, "pub consumers should receive policy checkpoints in bundles"


def _diff_has_family(diff: PlanDiff, family: PlanDiffChangeFamily) -> bool:
    """Return whether a pub-consumer diff contains one family."""
    for record in diff.records:
        if record.family == family:
            return true
    return false


def _plan_diff_exports_compile_for_pub_consumers() -> None:
    # -- Arrange --
    mut session = Session.default()
    before = governed_plan_bundle(_orders(session, "plan_diff_before"))
    after = governed_plan_bundle(_orders(session, "plan_diff_after"), evidence_refs=["smoke:plan-diff"])

    # -- Act --
    diff = diff_plan_bundles(before, after)

    # -- Assert --
    assert diff.schema_version == "incql.plan-diff.v0.1", "pub consumers should receive typed plan diffs"
    assert len(diff.records) > 0, "pub consumers should see evidence-reference changes"
    assert _diff_has_family(diff, PlanDiffChangeFamily.EvidenceReference), "pub consumers should inspect diff families"
    assert len(diff.blast_radius_inputs) > 0, "pub consumers should receive local blast-radius inputs"


def _exchange_has_kind(records: list[EvidenceExchangeRecord], kind: EvidenceExchangeRecordKind) -> bool:
    """Return whether a pub-consumer exchange contains one record kind."""
    for record in records:
        if record.kind == kind:
            return true
    return false


def _evidence_exchange_exports_compile_for_pub_consumers() -> None:
    # -- Arrange --
    mut session = Session.default()
    bundle = governed_plan_bundle(_orders(session, "evidence_exchange_orders"), evidence_refs=["smoke:exchange"])
    external = external_evidence_artifact(
        "artifact:smoke:manifest",
        EvidenceExchangeTargetFormat.TransformationProject,
        "target/smoke/manifest.json",
        confidence=ExternalEvidenceConfidence.Declared,
    )

    # -- Act --
    summary = bundle_summary_exchange(bundle)
    lineage = openlineage_exchange(bundle)
    telemetry = telemetry_exchange(bundle)
    transformation = transformation_project_exchange(bundle)
    inbound = external_evidence_exchange(external)

    # -- Assert --
    assert summary.target_format == EvidenceExchangeTargetFormat.IncqlBundleSummary, "bundle summary exchange should export"
    assert _exchange_has_kind(lineage.records, EvidenceExchangeRecordKind.OpenLineageJob), "OpenLineage exchange should export job records"
    assert _exchange_has_kind(telemetry.records, EvidenceExchangeRecordKind.TelemetryEvent), "telemetry exchange should export events"
    assert _exchange_has_kind(
        transformation.records,
        EvidenceExchangeRecordKind.TransformationModelSuggestion,
    ), "transformation exchange should export model suggestions"
    assert len(inbound.external_artifacts) == 1, "inbound external artifact exchange should preserve artifact identity"


def _semantic_profile_exports_compile_for_pub_consumers() -> None:
    # -- Arrange --
    mut session = Session.default()
    inspection = inspect_plan(_orders(session, "semantic_profile_orders"))
    baseline = incql_baseline_profile("smoke", evidence_refs=["smoke:profile"])
    dialect = sql_dialect_profile(
        "athena",
        dimensions=[
            semantic_dimension(
                SemanticProfileDimensionKind.TemporalCalendar,
                "timezone behavior not evaluated in smoke",
                state=SemanticProfileDimensionState.Unknown,
            ),
        ],
    )

    # -- Act --
    baseline_assessment = assess_profile_for_target(inspection.plan_target, baseline)
    dialect_assessment = assess_profile_for_target(inspection.plan_target, dialect)
    bundle = governed_plan_bundle_from_inspection(
        inspection,
        semantic_profiles=[baseline, dialect],
        profile_assessments=[baseline_assessment, dialect_assessment],
    )

    # -- Assert --
    assert baseline_assessment.state == SemanticProfileAssessmentState.Matched, "baseline profile should match exact dimensions"
    assert dialect_assessment.state == SemanticProfileAssessmentState.Unknown, "unknown profile dimensions must remain unknown"
    assert len(bundle.semantic_profiles) == 2, "bundle should export semantic profile records"
    assert bundle.section_available("semantic_profiles"), "bundle should expose semantic profile section availability"


def _ingress_exports_compile_for_pub_consumers() -> None:
    # -- Arrange --
    mut session = Session.default()
    _orders(session, "ingress_smoke_orders")
    request = ingress_request(
        "spark-connect-smoke",
        "spark-connect",
        frontend_kind=IngressFrontendKind.SparkConnect,
        request_id="ingress-request:smoke",
    )
    origin = ingress_origin_reference(request, IngressOriginKind.Relation, "rel-0", "relations/0", "orders")
    plan = ingress_plan(
        request,
        client_session_context(request, "session-smoke", current_namespace=Some("sales")),
        [
            ingress_named_table("ingress_smoke_orders", origin=Some(origin)),
            ingress_filter(eq(col("customer_id"), "A")),
            ingress_limit(1),
        ],
        requested_profile=Some(incql_baseline_profile("smoke")),
    )

    # -- Act --
    analysis: IngressAnalysis[AggregateOrder] = analyze_ingress_plan[AggregateOrder](plan)

    # -- Assert --
    assert analysis.status == IngressAnalysisStatus.Analyzed, "ingress analysis should produce a plan for supported steps"
    assert analysis.evidence.coverage_records[0].state == IngressCoverageState.Supported, "ingress coverage should be explicit"
    match analysis.plan:
        Some(data) =>
            bundle = governed_plan_bundle_from_inspection(inspect_plan(data), ingress_evidence=[analysis.evidence])
            assert bundle.section_available("ingress_mappings"), "bundle should expose ingress origin mappings"
            assert bundle.section_available("frontend_coverage"), "bundle should expose frontend coverage"
            assert bundle.section_available("client_session_context"), "bundle should expose client session context"
        None => return fail_t("supported ingress analysis should produce a lazy plan")


def _verification_exports_compile_for_pub_consumers() -> None:
    # -- Arrange --
    mut session = Session.default()
    inspection = inspect_plan(_orders(session, "verification_smoke_orders"))
    assertion = verification_assertion(
        "verification_smoke",
        VerificationAssertionKind.RelationComparison,
        inspection.plan_target,
        comparison_intent="source and target row counts match",
    )
    run = verification_run("verification-run:smoke", [assertion])
    observation = verification_observation(
        "verification-observation:smoke",
        run,
        assertion,
        VerificationLifecycle.Complete,
        VerificationOutcome.Passed,
        VerificationAssurance.Attested,
        coverage=verification_coverage(1, 1, "relation"),
        basis=VerificationCaptureBasis.ConnectorAttested,
    )

    # -- Act --
    projection = project_verification_state(assertion, [observation])
    evidence = verification_evidence([assertion], [run], [observation], projections=[projection])
    bundle = governed_plan_bundle_from_inspection(inspection, verification_evidence=[evidence])

    # -- Assert --
    assert projection.outcome == VerificationOutcome.Passed, "verification projection should expose current outcome"
    assert projection.assurance_count(VerificationAssurance.Attested) == 1, "assurance summary should retain attested evidence"
    assert bundle.section_available("verification_evidence"), "bundle should expose verification evidence section availability"
    assert bundle.section_available("verification_projections"), "bundle should expose verification projection evidence"


def main() -> None:
    println("query smoke: select")
    _brace_select_aliases_and_lateral_aliases_materialize()
    println("query smoke: aggregate")
    _grouped_aggregate_select_materializes_group_and_measures()
    println("query smoke: distinct")
    _select_distinct_materializes_unique_rows()
    println("query smoke: post-select")
    _post_select_where_order_and_limit_materialize()
    println("query smoke: joins")
    _join_and_left_join_materialize()
    println("query smoke: explode-window")
    _explode_and_window_by_materialize()
    println("query smoke: colon")
    _colon_spelling_materializes_same_select_surface()
    println("query smoke: quality")
    _quality_vocab_assertions_execute()
    println("query smoke: governed evidence")
    _governed_evidence_exports_compile_for_pub_consumers()
    println("query smoke: governed plan bundle")
    _governed_plan_bundle_exports_compile_for_pub_consumers()
    println("query smoke: plan diff")
    _plan_diff_exports_compile_for_pub_consumers()
    println("query smoke: evidence exchange")
    _evidence_exchange_exports_compile_for_pub_consumers()
    println("query smoke: semantic profiles")
    _semantic_profile_exports_compile_for_pub_consumers()
    println("query smoke: ingress")
    _ingress_exports_compile_for_pub_consumers()
    println("query smoke: verification")
    _verification_exports_compile_for_pub_consumers()
EOF

(cd "$PROJECT_DIR" && "$INCAN_BIN" lock >/dev/null)
(cd "$PROJECT_DIR" && "$INCAN_BIN" --check src/main.incn >/dev/null)
(cd "$PROJECT_DIR" && "$INCAN_BIN" --check src/query_blocks_smoke.incn >/dev/null)
(cd "$PROJECT_DIR" && "$INCAN_BIN" run src/query_blocks_smoke.incn)

echo "✓ pub consumer smoke check passed"

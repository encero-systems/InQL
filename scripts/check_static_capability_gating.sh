#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INCAN_BIN="${INCAN:-incan}"
WORK_PREFIX="$ROOT_DIR/.static_capability_gating"

trap 'rm -f "${WORK_PREFIX}"_*.incn "${WORK_PREFIX}"_*.out' EXIT

write_invalid_case() {
  local name="$1"
  local body="$2"
  local file="${WORK_PREFIX}_${name}.incn"

  cat >"$file" <<INCAN
from dataset import DataSet, DataStream
from functions import col, count

model Event:
    id: int

${body}
INCAN
}

expect_reject() {
  local name="$1"
  local needle="$2"
  local output="${WORK_PREFIX}_${name}.out"

  if "$INCAN_BIN" --check "${WORK_PREFIX}_${name}.incn" >"$output" 2>&1; then
    echo "static capability gating failed: ${name} unexpectedly typechecked" >&2
    exit 1
  fi

  if ! grep -q "$needle" "$output"; then
    echo "static capability gating failed: ${name} diagnostic did not mention '${needle}'" >&2
    cat "$output" >&2
    exit 1
  fi
}

cat >"${WORK_PREFIX}_valid_stream_row_local.incn" <<'INCAN'
from dataset import DataStream
from functions import always_true, col

model Event:
    id: int

def valid_stream_row_local(events: DataStream[Event]) -> DataStream[Event]:
    return events.where(always_true()).assign("id_copy", col("id")).withColumn("id_again", col("id"))
INCAN

"$INCAN_BIN" --check "${WORK_PREFIX}_valid_stream_row_local.incn" >/dev/null

write_invalid_case "stream_limit_invalid" 'def invalid_limit(events: DataStream[Event]) -> DataStream[Event]:
    return events.limit(10)'
expect_reject "stream_limit_invalid" "limit"

write_invalid_case "stream_head_invalid" 'def invalid_head(events: DataStream[Event]) -> DataStream[Event]:
    return events.head(10)'
expect_reject "stream_head_invalid" "head"

write_invalid_case "stream_group_by_invalid" 'def invalid_group_by(events: DataStream[Event]) -> DataStream[Event]:
    return events.group_by([col("id")])'
expect_reject "stream_group_by_invalid" "group_by"

write_invalid_case "stream_groupby_invalid" 'def invalid_groupby(events: DataStream[Event]) -> DataStream[Event]:
    return events.groupby(["id"])'
expect_reject "stream_groupby_invalid" "groupby"

write_invalid_case "stream_groupBy_invalid" 'def invalid_groupBy(events: DataStream[Event]) -> DataStream[Event]:
    return events.groupBy(["id"])'
expect_reject "stream_groupBy_invalid" "groupBy"

write_invalid_case "stream_agg_invalid" 'def invalid_agg(events: DataStream[Event]) -> DataStream[Event]:
    return events.agg([count()])'
expect_reject "stream_agg_invalid" "agg"

write_invalid_case "stream_order_by_invalid" 'def invalid_order_by(events: DataStream[Event]) -> DataStream[Event]:
    return events.order_by([col("id")])'
expect_reject "stream_order_by_invalid" "order_by"

write_invalid_case "stream_orderBy_invalid" 'def invalid_orderBy(events: DataStream[Event]) -> DataStream[Event]:
    return events.orderBy([col("id")])'
expect_reject "stream_orderBy_invalid" "orderBy"

write_invalid_case "stream_sort_values_invalid" 'def invalid_sort_values(events: DataStream[Event]) -> DataStream[Event]:
    return events.sort_values("id")'
expect_reject "stream_sort_values_invalid" "sort_values"

echo "✓ static capability gating check passed"

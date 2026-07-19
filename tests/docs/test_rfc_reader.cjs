const test = require("node:test");
const assert = require("node:assert/strict");

const { rfcReaderContract } = require("../../docs/javascripts/prismplane.js");

const defaults = {
  query: "",
  scope: "all",
  status: "",
  sort: "",
  tags: [],
  selectedId: "000",
  selectedExplicitly: false,
};

const known = {
  statuses: new Set(["planned", "implemented"]),
  tags: new Set(["evidence", "planning", "types"]),
  records: new Set(["000", "030"]),
};

test("adjacent RFC selection skips hidden records and stops at the boundaries", () => {
  const records = [{ id: "007" }, { id: "030" }, { id: "045" }];

  assert.equal(rfcReaderContract.adjacentRecordId(records, "007", 1), "030");
  assert.equal(rfcReaderContract.adjacentRecordId(records, "030", -1), "007");
  assert.equal(rfcReaderContract.adjacentRecordId(records, "007", -1), "007");
  assert.equal(rfcReaderContract.adjacentRecordId(records, "045", 1), "045");
  assert.equal(rfcReaderContract.adjacentRecordId([], "007", 1), "");
  assert.equal(rfcReaderContract.adjacentRecordId(records, "unknown", 1), "007");
});

test("filtered results preserve a visible selection and otherwise repair to the first result", () => {
  const records = [{ id: "007" }, { id: "030" }];

  assert.equal(rfcReaderContract.resolvedRecordId(records, "030"), "030");
  assert.equal(rfcReaderContract.resolvedRecordId(records, "045"), "007");
  assert.equal(rfcReaderContract.resolvedRecordId([], "045"), "");
});

test("tag selections are unique, sorted, and toggleable", () => {
  let tags = rfcReaderContract.setTag([], "planning", true);
  tags = rfcReaderContract.setTag(tags, "evidence", true);
  tags = rfcReaderContract.setTag(tags, "planning", true);
  assert.deepEqual(tags, ["evidence", "planning"]);

  tags = rfcReaderContract.setTag(tags, "planning", false);
  assert.deepEqual(tags, ["evidence"]);
});

test("multiple tag filters use intersection semantics", () => {
  const normalize = (value) => value.toLowerCase().trim();
  const record = {
    lifecycle: "active",
    status_key: "planned",
    tags: [{ key: "evidence" }, { key: "planning" }],
    searchText: "prism lineage graph",
  };
  const state = { ...defaults, query: "lineage", scope: "active", status: "planned", tags: ["evidence", "planning"] };

  assert.equal(rfcReaderContract.matches(record, state, normalize), true);
  assert.equal(rfcReaderContract.matches(record, { ...state, tags: ["evidence", "types"] }, normalize), false);
});

test("status sorting is stable and uses RFC number as its tie break", () => {
  const records = [
    { id: "030", status: "In Progress" },
    { id: "003", status: "Implemented" },
    { id: "007", status: "In Progress" },
    { id: "000", status: "Planned" },
  ];

  assert.deepEqual(
    rfcReaderContract.sortRecords(records, "status-asc").map((record) => record.id),
    ["003", "007", "030", "000"],
  );
  assert.deepEqual(
    rfcReaderContract.sortRecords(records, "status-desc").map((record) => record.id),
    ["000", "007", "030", "003"],
  );
  assert.deepEqual(
    rfcReaderContract.sortRecords(records, "").map((record) => record.id),
    ["000", "003", "007", "030"],
  );
});

test("URL state uses sorted repeated tag parameters and removes legacy topic state", () => {
  const params = new URLSearchParams("topic=planning&tag=types&rfc=000");
  const state = {
    ...defaults,
    sort: "status-asc",
    tags: ["planning", "evidence"],
    selectedId: "030",
    selectedExplicitly: true,
  };

  rfcReaderContract.writeParams(params, state);

  assert.equal(params.has("topic"), false);
  assert.deepEqual(params.getAll("tag"), ["evidence", "planning"]);
  assert.equal(params.get("sort"), "status-asc");
  assert.equal(params.get("rfc"), "030");
});

test("URL state round-trips and ignores unknown or duplicate filters", () => {
  const params = new URLSearchParams("q=lineage&scope=active&status=planned&sort=status-desc&tag=planning&tag=evidence&tag=planning&tag=unknown&rfc=030");

  const state = rfcReaderContract.readParams(params, defaults, known);

  assert.deepEqual(state, {
    query: "lineage",
    scope: "all",
    status: "planned",
    sort: "status-desc",
    tags: ["evidence", "planning"],
    selectedId: "030",
    selectedExplicitly: true,
  });

  const restoredAfterHistoryNavigation = rfcReaderContract.readParams(
    new URLSearchParams("tag=types&rfc=000"),
    defaults,
    known,
  );
  assert.deepEqual(restoredAfterHistoryNavigation.tags, ["types"]);
  assert.equal(restoredAfterHistoryNavigation.selectedId, "000");
  assert.equal(restoredAfterHistoryNavigation.selectedExplicitly, true);

  const unknownSort = rfcReaderContract.readParams(
    new URLSearchParams("sort=recent"),
    defaults,
    known,
  );
  assert.equal(unknownSort.sort, "");
});

test("clearing tags removes every tag parameter while preserving other filters", () => {
  const params = new URLSearchParams("q=prism&tag=evidence&tag=planning");

  rfcReaderContract.writeParams(params, { ...defaults, query: "prism" });

  assert.deepEqual(params.getAll("tag"), []);
  assert.equal(params.get("q"), "prism");
});

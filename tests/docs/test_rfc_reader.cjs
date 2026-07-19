const test = require("node:test");
const assert = require("node:assert/strict");

const { rfcReaderContract } = require("../../docs/javascripts/prismplane.js");

const defaults = {
  query: "",
  scope: "all",
  status: "",
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

test("URL state uses sorted repeated tag parameters and removes legacy topic state", () => {
  const params = new URLSearchParams("topic=planning&tag=types&rfc=000");
  const state = { ...defaults, tags: ["planning", "evidence"], selectedId: "030", selectedExplicitly: true };

  rfcReaderContract.writeParams(params, state);

  assert.equal(params.has("topic"), false);
  assert.deepEqual(params.getAll("tag"), ["evidence", "planning"]);
  assert.equal(params.get("rfc"), "030");
});

test("URL state round-trips and ignores unknown or duplicate filters", () => {
  const params = new URLSearchParams("q=lineage&scope=active&status=planned&tag=planning&tag=evidence&tag=planning&tag=unknown&rfc=030");

  const state = rfcReaderContract.readParams(params, defaults, known);

  assert.deepEqual(state, {
    query: "lineage",
    scope: "active",
    status: "planned",
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
});

test("clearing tags removes every tag parameter while preserving other filters", () => {
  const params = new URLSearchParams("q=prism&tag=evidence&tag=planning");

  rfcReaderContract.writeParams(params, { ...defaults, query: "prism" });

  assert.deepEqual(params.getAll("tag"), []);
  assert.equal(params.get("q"), "prism");
});

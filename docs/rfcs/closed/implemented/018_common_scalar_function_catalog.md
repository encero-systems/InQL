# IncQL RFC 018: Common scalar function catalog

- **Status:** Implemented
- **Created:** 2026-04-27
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - IncQL RFC 012 (unified scalar expression surface)
  - IncQL RFC 013 (function catalog program)
  - IncQL RFC 014 (function registry and catalog governance)
  - IncQL RFC 015 (core scalar functions and operators)
- **Issue:** [IncQL #35](https://github.com/encero-systems/IncQL/issues/35)
- **RFC PR:** [IncQL #44](https://github.com/encero-systems/IncQL/pull/44) (initial math slice); [IncQL #54](https://github.com/encero-systems/IncQL/pull/54) (full implementation)
- **Written against:** Incan v0.2
- **Shipped in:** v0.1

## Summary

This RFC defines the common scalar function catalog beyond the core scalar slice: practical math, string, encoding, regex, and date/time functions that authors expect in a dataframe system. The catalog is standards-led where possible, preserves compatibility aliases where semantics match, and leaves specialist or format-specific families to their owning RFCs.

## Motivation

After the core scalar vocabulary exists, authors still need everyday data cleaning and feature engineering functions. Spark, Snowflake, DataFusion, Arrow, dbt, and SQL systems all provide broad scalar coverage because real tabular work needs string normalization, date extraction, numeric transforms, regex predicates, and parsing helpers. IncQL should add that breadth deliberately rather than through scattered helper additions.

The catalog should still avoid copying every backend-specific function. Functions that require nested types, JSON/CSV values, geospatial types, sketch state, encryption policy, or physical execution metadata belong elsewhere.

## Goals

- Define common math, string, encoding, regex, and date/time scalar functions.
- Specify canonical names and compatibility aliases at the family level.
- Require type, null, and error behavior to be registry-visible.
- Keep format-specific, nested-data, sketch, geospatial, and engine-specific functions out of this RFC.

## Non-Goals

- Defining collection, map, struct, JSON, CSV, XML, URL, geospatial, crypto, sketch, or UDF functions.
- Defining aggregate or window functions.
- Defining a complete SQL standard conformance matrix.
- Defining locale and collation semantics beyond what listed functions require.

## Guide-level explanation (how authors think about it)

Authors should be able to clean and enrich ordinary scalar columns using familiar functions:

```incan
from pub::incql.functions import col, concat, date_trunc, lower, round, substring, trim

cleaned = (
    orders
        .with_column("email_norm", lower(trim(col("email"))))
        .with_column("order_month", date_trunc("month", col("created_at")))
        .with_column("amount_rounded", round(col("amount"), 2))
        .with_column("sku_prefix", substring(col("sku"), 1, 3))
)
```

Compatibility aliases are useful, but authors should see one canonical IncQL name in docs for each semantic function.

## Reference-level explanation (precise rules)

IncQL should define common math functions including `abs`, `ceil`, `floor`, `round`, `sqrt`, `power`, `exp`, `ln`, `log`, `log10`, `sign`, `least`, `greatest`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `degrees`, and `radians`.

IncQL should define common string functions including `char_length`, `octet_length`, `upper`, `lower`, `trim`, `ltrim`, `rtrim`, `substring`, `position`, `overlay`, `concat`, `concat_ws`, `replace`, `translate`, `repeat`, `left`, `right`, `lpad`, `rpad`, and `split_part`.

IncQL should define common text encoding functions including `encode`, `decode`, `base64`, `unbase64`, `hex`, and `unhex`, provided their character encoding and invalid-input behavior are specified.

IncQL should define common regex functions including `regexp_like`, `regexp_replace`, and `regexp_extract` once the regex flavor and capture semantics are specified.

IncQL should define common date/time functions including `current_date`, `current_time`, `current_timestamp`, `extract`, `date_part`, `date_trunc`, `time_trunc`, `date_add`, `date_sub`, `date_diff`, `timestamp_diff`, `to_date`, `to_time`, `to_timestamp`, `from_unixtime`, `unix_seconds`, `unix_millis`, `unix_micros`, `make_date`, `make_time`, `make_timestamp`, and `last_day`.

The catalog should explicitly account for dbt-style portability names such as `dateadd`, `datediff`, and `safe_cast`. These names may be canonical helpers or compatibility aliases, but their adapter-specific rendering requirements must be represented through the registry rather than undocumented backend conditionals. Deterministic hash helpers belong to IncQL RFC 022. Semi-structured type and variant helpers belong to IncQL RFC 026.

Every function added by this RFC must be entered in the function registry with type rules, null behavior, determinism, and backend support. Current time functions must be marked stable within a query or explicitly nondeterministic; the registry must not leave that ambiguous.

## Design details

### Syntax

This RFC requires importable function names. Query syntax may expose SQL keywords such as `EXTRACT`, but those spellings must map to registry entries.

### Semantics

Canonical names should prefer SQL-standard or widely portable names where semantics match. Compatibility aliases may include Spark-style names such as `substr`, `ucase`, `lcase`, `dateadd`, or `datediff` where they are unambiguous.

String functions must use one-based SQL-compatible positions for functions such as `substring`, `position`, `overlay`, `left`, `right`, `lpad`, `rpad`, and `split_part`. `position` returns `0` when the search string is not found.

Regex functions use a safe Rust-regex-compatible flavor: no lookaround or backreferences are guaranteed by the portable contract. `regexp_extract` defaults to capture group `1`; group `0` returns the full match.

Current date, time, and timestamp helpers are registry-marked as nondeterministic because IncQL's registry has no separate statement-stable determinism category. Backends may evaluate them statement-stably, but IncQL authors must not rely on them as deterministic pure functions.

### Interaction with other IncQL surfaces

The same scalar catalog must be usable in filters, computed projections, grouping keys where allowed, aggregate arguments, and query-block expressions. Function availability must not depend on whether the author used dataframe methods or query blocks.

### Compatibility / migration

Existing arithmetic helpers should be treated as the start of this catalog but should remain compatible with the core scalar names. Broader aliases should be additive.

## Alternatives considered

- **Add all Spark scalar functions.** Rejected because many Spark functions are format-specific, engine-specific, physical-execution-specific, or require types IncQL has not standardized.
- **Only expose DataFusion functions.** Rejected because backend availability should inform lowering, not define the portable IncQL author contract.
- **Delay scalar breadth until every edge case is settled.** Rejected because practical data cleaning needs a common catalog, but unresolved families can remain Draft until semantics are precise.

## Drawbacks

- A broad scalar catalog increases documentation and test obligations.
- String indexing, regex flavor, timezone behavior, and numeric edge cases are easy places for backend drift.
- Compatibility aliases can make the surface look larger than it really is.

## Layers affected

- **IncQL specification** — the common scalar catalog must extend the registry without contradicting core scalar semantics.
- **IncQL library package** — public helpers should expose canonical names and selected aliases.
- **Incan compiler** — query-block operator and keyword forms should lower to registry entries where applicable.
- **Execution / interchange** — Prism and Substrait lowering must either preserve semantics, use registered extensions, or diagnose unsupported functions.
- **Documentation** — function reference docs should group scalar functions by family and show aliases.

## Implementation Plan

### Phase 1: Initial math scalar slice

- Add the first portable math family with honest Substrait and DataFusion behavior.
- Cover helper expression shape, registry metadata, Substrait lowering, and concrete session execution.

### Phase 2: Complete common scalar catalog

- Add the remaining math helpers, string helpers, text encoding helpers, regex helpers, date/time helpers, and compatibility aliases.
- Preserve IncQL semantics through registry metadata and Substrait extension mappings, with adapter-owned DataFusion UDFs only where DataFusion has no direct API-level equivalent.
- Cover registry metadata, Substrait lowering, expression shape, and concrete DataFusion-backed session execution.

## Progress Checklist

### Implemented in PR #44

- [x] Add `abs`, `ceil`, `floor`, and single-argument `round` helpers under `src/functions/math/`.
- [x] Add registry metadata and Substrait extension mappings for the math slice.
- [x] Add scalar lowering tests and DataFusion-backed session execution tests with concrete output values.
- [x] Publish the implemented math slice in the function reference docs.

### Implemented in the full RFC 018 follow-up

- [x] Add remaining math helpers such as `sqrt`, `power`, logarithms, trigonometry, `least`, and `greatest`.
- [x] Add string helpers such as `upper`, `lower`, `trim`, `substring`, `position`, `concat`, `split_part`, and padding/replacement helpers.
- [x] Add text encoding helpers with explicit invalid-input behavior.
- [x] Add regex helpers with explicit regex flavor and capture semantics.
- [x] Add date/time helpers with explicit determinism and session-time behavior.
- [x] Add compatibility aliases where they are semantic aliases rather than backend spellings.

## Design Decisions

- **String positions:** RFC 018 string positions are one-based for SQL compatibility. `position` returns `0` when the search string is absent.
- **Regex flavor:** RFC 018 regex helpers use Rust-regex-compatible semantics. The portable contract does not require lookaround or backreference support.
- **Regex captures:** `regexp_extract(expr, pattern)` defaults to capture group `1`; group `0` returns the full match.
- **Current time determinism:** `current_date`, `current_time`, and `current_timestamp` are registry-marked nondeterministic until the registry has a statement-stable category.
- **Encoding scope:** RFC 018 encoding helpers are text-to-text helpers. Binary and semi-structured logical value surfaces belong to IncQL RFC 026 rather than hidden DataFusion-specific behavior.
- **DataFusion boundary:** DataFusion native functions are used where they preserve IncQL semantics directly. Adapter UDFs are DataFusion execution details and do not own the IncQL semantic contract.

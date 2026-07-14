# IncQL RFC 043: Canonical equality and digest profiles

- **Status:** Draft
- **Created:** 2026-06-20
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - IncQL RFC 027 (relational evidence program)
  - IncQL RFC 028 (semantic identity and target model)
  - IncQL RFC 032 (execution observations)
  - IncQL RFC 033 (adapter requirements and coverage)
  - IncQL RFC 034 (quality assertions and observations)
  - IncQL RFC 036 (governed plan bundle)
  - IncQL RFC 040 (interoperability semantic profiles)
  - IncQL RFC 042 (async verification evidence)
- **Issue:** [IncQL #78](https://github.com/encero-systems/IncQL/issues/78)
- **RFC PR:** [IncQL #83](https://github.com/encero-systems/IncQL/pull/83)
- **Written against:** Incan v0.3-era IncQL
- **Shipped in:** —

## Summary

This RFC defines canonical equality and digest profiles for IncQL verification evidence. A profile records how rows, fields, relations, partitions, and result tables are normalized, ordered, compared, and hashed so deterministic verification can claim `verified` assurance without relying on hidden engine-specific equality rules.

## Core model

1. Equality is not one universal operation for relational evidence. Relation comparisons must state whether they are keyed, bag-based, set-based, ordered, partition-scoped, or aggregate-scoped.
2. Digest evidence is only meaningful when the canonicalization profile is explicit and versioned.
3. Canonical equality depends on semantic profiles. Nulls, decimals, timestamps, strings, binary values, nested values, missing values, collation, ordering, and floating-point edge cases must not be inferred from a backend name.
4. Digest profiles are evidence contracts, not just hash function names.
5. A digest profile can support multiple algorithms, but the algorithm does not replace the canonicalization rules.

## Motivation

Async verification can say that a partition, relation, or result was checked, but it cannot responsibly say that the check was deterministic unless both sides agree on what equality means. Real systems differ on decimal scale, timestamp precision, time zones, Unicode normalization, string collation, null ordering, NaN handling, duplicate rows, binary encoding, and nested value serialization. Without a canonical profile, a row digest can match or fail for reasons unrelated to the relational claim being verified.

The practical verification path needs digestible evidence even when no proof verifier is involved. Row counts, aggregate checks, per-partition digests, keyed row digests, and full relation digests are useful only if they carry enough information for another tool or an IncQL RFC 044 verifier to understand the statement that was checked.

## Goals

- Define canonical equality profiles for row, relation, partition, and result comparisons.
- Define digest profiles as versioned evidence records.
- Require digest observations to identify the canonicalization profile and digest algorithm.
- Distinguish bag equality, set equality, keyed equality, ordered equality, and aggregate equality.
- Make unsupported columns, unsupported value kinds, profile mismatches, and omitted semantics explicit.
- Compose with interoperability semantic profiles and async verification evidence.

## Non-Goals

- Defining every concrete canonicalization profile in this RFC.
- Requiring one global canonical encoding for all engines and formats.
- Replacing IncQL scalar, aggregate, ordering, or profile semantics.
- Defining cryptographic proof systems or proof artifact formats.
- Guaranteeing privacy, encryption, or zero-knowledge properties for digest evidence.

## Guide-level explanation (how authors think about it)

An author or verification tool can choose an equality profile before comparing two relations:

```incan
profile = canonical_equality_profile(
    relation_mode="keyed_bag",
    key=[col("order_id")],
    decimal_mode="normalize_scale",
    timestamp_mode="utc_microseconds",
    string_mode="unicode_nfc_binary",
)

check = verify_relation(
    source=operational_orders,
    target=analytics_orders,
    equality=profile,
    checks=[partition_digest_equal(by=[col("order_date")])],
)
```

The exact API names are illustrative. Other checks may compare customer dimensions between a warehouse and a lakehouse, reconcile billing events between a stream sink and an analytical store, or compare a SaaS export with a curated mart. The key behavior is that digest evidence refers to a named profile rather than silently inheriting one engine's comparison behavior.

```text
scope=orders/order_date=2026-06-19
profile=canonical-equality:v1:keyed_bag
algorithm=sha256
source_digest=sha256:...
target_digest=sha256:...
outcome=passed
assurance=verified
```

If the profile cannot represent a column or a semantic dimension, the check reports unsupported or unknown evidence instead of producing a misleading digest:

```text
scope=orders
outcome=unsupported
assurance=unknown
diagnostic=unsupported_collation: locale-specific string comparison has no selected canonical profile
```

## Reference-level explanation (precise rules)

A canonical equality profile must be a versioned evidence record. It must include profile identity, profile version, relation equality mode, row identity model, field ordering rules, value normalization rules, unsupported value behavior, digest rollup rules when applicable, evidence references, and diagnostics.

Relation equality mode must distinguish at least:

- ordered: rows are equal only when they appear in the same sequence after the profile's ordering rules
- bag: rows are equal when row values and multiplicities match, regardless of order
- set: rows are equal when distinct row values match, ignoring duplicate multiplicity
- keyed_bag: rows are grouped by one or more key expressions, and each key's value multiplicity must match
- keyed_latest: rows are grouped by key and compared after a declared latest-row selection rule
- aggregate: one or more aggregate summaries are compared instead of row-level equality

A row identity model must identify whether row equality uses all output fields, a declared subset, stable field identifiers, field names after projection, or explicit key expressions. If field identity is ambiguous, the profile must report unknown or unsupported evidence.

A value normalization profile must define behavior for:

- null, missing, and absent values
- booleans
- signed and unsigned integers
- fixed-point decimals, including precision, scale, rounding, overflow, and negative zero if applicable
- floating-point values, including NaN, infinities, signed zero, rounding, and approximate tolerance when allowed
- timestamps, dates, times, time zones, calendar systems, leap seconds when relevant, and precision truncation
- strings, including encoding, Unicode normalization, case behavior, trimming, padding, collation, and locale
- binary values
- nested, variant, list, struct, map, and semi-structured values when supported

Approximate equality must be explicit. If a profile allows tolerances for floating-point, decimal, timestamp, or aggregate comparisons, the tolerance must be part of the profile and must prevent the observation from claiming exact equality.

A digest profile must include digest profile identity, canonical equality profile identity, digest algorithm, digest output encoding, row framing rules, field framing rules, null framing rules, partition rollup rules, relation rollup rules, algorithm version, and collision-risk notes when applicable.

Digest algorithms must be named by stable public identifiers. Non-cryptographic digests may be used for fast screening, but a verification observation must not imply cryptographic collision resistance unless the algorithm and profile provide it.

Digest rollups must preserve scope. A partition digest must identify the partition expression or partition key, the profile used to encode partition values, and whether the relation-level digest is a digest over sorted partition digests, a Merkle-style tree, a commutative accumulator, or another explicit rollup.

Ordered equality must identify the ordering expressions and null ordering. If a relation comparison depends on backend output order without a declared order, the result must not claim ordered equality.

Bag and set equality must define multiplicity semantics. If the profile cannot count multiplicities consistently across source and target systems, it must not claim bag equality.

Canonical profiles must reference interoperability semantic profiles when source or target behavior affects equality. A digest produced under one semantic profile must not be reused under another profile unless evidence proves that the relevant dimensions are equivalent.

Verification observations that claim `verified` assurance based on digests must reference the canonical equality profile and digest profile. If either reference is missing, stale, unsupported, or unknown, the observation must not claim deterministic verification.

Governed plan bundles may include canonical equality profiles, digest profiles, digest observations, and diagnostics. Bundles must distinguish a missing digest profile from an empty digest profile.

## Design details

### Syntax

This RFC introduces no authoring syntax. Helper APIs and artifact records are the normative surface. Any authoring syntax introduced by a separate RFC must lower to the same evidence records.

### Semantics

Canonical equality profiles define evidence comparison semantics. They do not change authored IncQL relational semantics, query result semantics, or backend execution behavior. A profile explains how verification normalizes and compares observed values.

Digest profiles are downstream of equality profiles. A digest can only support a claim to the extent that the canonicalization and comparison rules support that claim.

### Interaction with other IncQL surfaces

RFC 040 semantic profiles provide source and target context. Canonical equality profiles may use that context but must not replace it.

RFC 042 verification observations use canonical equality and digest profile references to justify `verified` assurance for digest-based checks.

RFC 033 adapter coverage may report support for canonical_digest, ordered_comparison, keyed_bag_comparison, and partition_digest_rollup capabilities.

RFC 034 quality assertions may be compared through canonical profiles when assertions span multiple relations or systems.

### Standards alignment

Canonical equality and digest profile artifacts should be bridgeable to dataset and quality metadata standards where the mapping is meaningful. W3C DCAT, DCAT-AP, schema.org Dataset, and Dublin Core can describe datasets, distributions, access metadata, licensing, and descriptive metadata around the relations being compared. W3C Data Quality Vocabulary can describe quality metrics and measurements that use canonical equality or digest results as evidence.

When a digest profile uses JSON or signed payloads, bridge profiles should use public canonicalization and signature specifications rather than ad hoc encodings. The digest algorithm, canonicalization profile, payload framing, and rollup rules must still be IncQL evidence fields; an external serialization format alone is not a canonical equality profile.

### Compatibility / migration

This RFC is additive. Existing verification observations without canonical equality or digest profiles remain valid as observations, but they must not be upgraded to deterministic digest-based verification unless a profile can be attached without changing the checked claim.

## Alternatives considered

- **Use backend equality rules directly.** Rejected because source and target systems often disagree on equality edge cases, and hidden backend semantics make evidence hard to audit.
- **Use JSON serialization as the canonical row format.** Rejected because JSON does not preserve enough typed relational information without a separate profile.
- **Require cryptographic hashes everywhere.** Rejected because cryptographic hash choice does not solve canonicalization, and non-cryptographic screening may still be useful when correctly labeled.
- **Make every digest exact by default.** Rejected because approximate values, unsupported collations, and profile gaps must be visible.

## Drawbacks

- Canonical profiles add setup work before verification can claim strong assurance.
- Profile versioning must be maintained carefully to avoid digest drift.
- Some useful checks may remain `attested`, `sampled`, or `unknown` until profiles cover enough data types and semantics.
- Reports may become more verbose because unsupported equality dimensions must be exposed.

## Implementation architecture

This section is non-normative. A practical implementation can support exact profiles for scalar values, stable field ordering, keyed bag equality, and partition digest rollups. Profiles for locale-sensitive strings, approximate numerics, nested values, and engine-specific timestamp behavior should be added as versioned profiles rather than hidden conditionals.

## Layers affected

- **IncQL specification** — canonical equality and digest profile vocabulary becomes part of verification evidence.
- **IncQL library package** — verification helpers should be able to select and report canonical profiles.
- **Execution / interchange** — adapters may need capability records for canonical encoding and digest generation.
- **Documentation** — docs must explain that digest equality depends on canonicalization and profile compatibility.

## Unresolved questions

- Which exact scalar profiles should this RFC standardize?
- Which digest algorithms should be recommended for screening versus strong deterministic verification?
- Should relation-level digest rollups require a Merkle-style tree, or allow multiple explicit rollup families?
- How should approximate aggregate equality be represented without weakening exact digest claims?
- Which nested and semi-structured value kinds belong in standardized profile sets?

<!-- When every question is resolved, rename this section to **Design Decisions**, group answers under ### Resolved, and remove this comment. -->

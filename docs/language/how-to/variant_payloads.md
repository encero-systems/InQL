# Inspect typed variant payloads

This how-to shows how to parse JSON text into typed variant values and inspect their shape.

Use variant helpers when the plan needs kind-aware semi-structured inspection. Use RFC 022 JSON helpers when normalized JSON text is enough.

## Parse and inspect a payload

Parse once, then apply `typeof(...)`, `variant_get(...)`, and variant predicates to the typed value.

```incan
from pub::incql.functions import col, is_array, is_null_value, parse_variant_json, typeof, variant_get

payload = parse_variant_json(col("payload"))
literal_payload = parse_variant_json("{\"status\":\"paid\"}")

projected = (
    events
        .with_column("payload_kind", typeof(payload))
        .with_column("items_are_array", is_array(variant_get(payload, "$.items")))
        .with_column("dynamic_value", variant_get(literal_payload, col("json_path")))
        .with_column("deleted_was_variant_null", is_null_value(variant_get(payload, "$.deleted_at")))
)
```

Variant predicates accept `VariantExpr` values. They do not parse strings directly. For exact helper contracts, see [Variant functions](../reference/functions/variants.md).

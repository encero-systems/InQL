# Normalize semi-structured fields

This how-to shows how to derive stable string, JSON, CSV, and URL fields from scalar payload columns.

Use format helpers when the payload should stay a scalar expression in the current row. Use typed variant helpers when the plan needs kind-aware semi-structured inspection rather than normalized text.

## Derive normalized fields

Hash identifiers, extract URL and JSON fields, and validate schema-bearing payloads with model type parameters.

```incan
from pub::incql.functions import col, from_csv, from_json, get_json_object, parse_url, sha2, to_json

model EventPayload:
    type_ as "type": str

model CsvRow:
    id: int
    status: str

projected = (
    events
        .with_column("user_hash", sha2(col("user_id"), 256))
        .with_column("campaign", parse_url(col("landing_page"), "utm_campaign"))
        .with_column("event_type", get_json_object(col("payload"), "$.type"))
        .with_column("payload_obj", from_json[EventPayload](col("payload")))
        .with_column("row_fields", from_csv[CsvRow](col("csv_line")))
        .with_column("payload_out", to_json(col("event_type")))
)
```

`from_json[Model](...)` and `from_csv[Model](...)` derive their validation schema from the Incan model type argument. For the complete helper catalog, see [Format functions](../reference/functions/format.md).

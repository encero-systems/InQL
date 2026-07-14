# Estimate approximate metrics

This how-to shows how to opt in to approximate aggregate helpers when exact results are not required.

Use approximate helpers explicitly. IncQL does not silently replace exact aggregates with approximate implementations because a backend can do so.

## Estimate distinct counts and percentiles

Group the relation normally, then use approximate aggregate measures inside `agg(...)`.

```incan
from pub::incql.functions import approx_count_distinct, approx_percentile, col

summary = (
    events
        .group_by([col("campaign_id")])
        .agg([
            approx_count_distinct(col("user_id")),
            approx_percentile(col("latency_ms"), 0.95),
        ])
)
```

`approx_percentile(...)` accepts a percentile from `0.0` through `1.0` and an optional positive accuracy value. For exact helper contracts, see [Approximate functions](../reference/functions/approximate.md).

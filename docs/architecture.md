<div class="incql-architecture-shell" markdown="1">
<nav class="incql-architecture-rail" aria-label="Architecture sections">
<span class="incql-architecture-rail__title">Architecture</span>
<a href="#system-path" data-architecture-link="system-path">System path</a>
<a href="#evidence" data-architecture-link="evidence">Evidence</a>
<a href="#one-query" data-architecture-link="one-query">One query</a>
<a href="#ownership" data-architecture-link="ownership">Ownership</a>
<a href="#internals" data-architecture-link="internals">Internals</a>
</nav>

<article id="architecture" class="incql-architecture" data-incql-architecture markdown="1">
<section id="system-path" class="incql-architecture-chapter incql-architecture-chapter--system" data-architecture-section="system-path" markdown="1">
<header class="incql-architecture-heading">
<p class="incql-architecture-kicker">From intent to execution</p>
<h1>One typed path through the system</h1>
<p class="incql-architecture-lede">This is the Prism-backed <code>LazyFrame</code> path from checked intent to a materialized DataFusion result. Each boundary has one job, so changing a surface or backend cannot silently change the plan’s meaning.</p>
</header>

<figure class="incql-system-path" aria-labelledby="incql-system-path-caption">
<ol class="incql-system-path__stages">
<li data-system-boundary="author"><span>01 · Author</span><strong>Authoring surfaces</strong><small>Checked <code>query {}</code> and <code>LazyFrame</code> intent.</small></li>
<li class="incql-system-path__prism" data-system-boundary="prism"><span>02 · Plan</span><strong>Prism</strong><small>Semantic planning and canonical rewrites.</small></li>
<li data-system-boundary="substrait"><span>03 · Exchange</span><strong>Substrait</strong><small>Portable logical plan; no runtime bindings.</small></li>
<li data-system-boundary="session"><span>04 · Bind + dispatch</span><strong>Session</strong><small>Validate bindings and dispatch the selected adapter.</small></li>
<li data-system-boundary="adapter"><span>05 · Plan + execute</span><strong>Backend adapter</strong><small>DataFusion planning, execution, and materialization.</small></li>
</ol>

<div class="incql-system-path__visual" aria-hidden="true">
<img class="incql-system-path__art" src="../shared/prismplane/architecture-system-path-v1.png" alt="">
<span class="incql-system-path__flow-label incql-system-path__flow-label--forward">Typed intent</span>
<span class="incql-system-path__flow-label incql-system-path__flow-label--return">Materialized result</span>
<div class="incql-system-path__glyphs">
<span><img src="../shared/icons/code-braces-box.svg" alt=""></span>
<span class="incql-system-path__glyph--prism"></span>
<span><img src="../shared/icons/file-tree-outline.svg" alt=""></span>
<span><img src="../shared/icons/link-variant.svg" alt=""></span>
<span><img src="../shared/icons/database-cog-outline.svg" alt=""></span>
</div>
</div>

<div class="incql-system-evidence" aria-label="Evidence correlated across planning and execution">
<div class="incql-system-evidence__heading">
<span>Evidence rail</span>
<strong>One local <code>plan_target</code></strong>
</div>
<div class="incql-system-evidence__rail">
<article><img src="../shared/icons/table-check.svg" alt=""><span><strong>Schema</strong><small>Fields and types</small></span></article>
<article><img src="../shared/icons/vector-polyline.svg" alt=""><span><strong>Lineage + origin</strong><small>Authored meaning</small></span></article>
<article><img src="../shared/icons/source-branch.svg" alt=""><span><strong>Rewrite</strong><small>Canonical derivation</small></span></article>
<article><img src="../shared/icons/shield-check-outline.svg" alt=""><span><strong>Requirements</strong><small>Adapter boundary</small></span></article>
<article class="incql-system-evidence__observation"><img src="../shared/icons/chart-timeline-variant.svg" alt=""><span><strong>Observation</strong><small>Concrete attempt</small></span></article>
</div>
<small class="incql-system-evidence__note">Local inspection artifacts and the runtime observation meet through the same local target; they are not serialized through the Substrait plan.</small>
</div>

<figcaption id="incql-system-path-caption">The representation path is not the literal public call stack: callers hand a Prism-backed <code>LazyFrame</code> to Session; Session triggers the Prism-to-Substrait handoff, validates logical reads, supplies registrations, and dispatches its configured adapter.</figcaption>
</figure>

<div class="incql-architecture-explanation" markdown="1">
<p><strong>The separation is deliberate.</strong> Authoring surfaces express relational work. Prism is IncQL’s internal logical planning engine: it stores the authored plan, derives narrow semantics-preserving views, and keeps origin information intact. It is not the IncQL brand mark, the interchange format, or the execution engine.</p>
<p>Substrait carries portable logical meaning across the boundary. Session then supplies the runtime context that the logical plan intentionally lacks: registered sources, its configured backend selection, execution, materialization, and writes. The adapter may plan for its engine, but it does not become the semantic owner of the query.</p>
</div>

<p class="incql-architecture-links">Read the exact contracts in <a href="../rfcs/007_prism_planning_engine/">Prism RFC 007</a>, <a href="../rfcs/002_apache_substrait_integration/">Substrait RFC 002</a>, and <a href="../language/reference/execution_context/">Execution context</a>.</p>
</section>

<section id="evidence" class="incql-architecture-chapter incql-architecture-chapter--evidence" data-architecture-section="evidence" markdown="1">
<header class="incql-architecture-heading">
<p class="incql-architecture-kicker">Correlated locally</p>
<h2>Plan evidence and execution evidence stay distinct</h2>
<p class="incql-architecture-lede">For a Prism-backed <code>LazyFrame</code>, local plan inspection and the later execution observation expose the same <code>plan_target</code>. That correlation does not add evidence to the Substrait payload.</p>
</header>

<div class="incql-evidence-story" aria-label="Local plan evidence and execution evidence correlated by plan_target">
<aside class="incql-evidence-story__key">
<img src="../shared/icons/link-variant.svg" alt="" aria-hidden="true">
<span>Shared local plan anchor</span>
<strong><code>plan_target</code></strong>
<small>Derived from the same Prism store and tip snapshot</small>
</aside>

<section class="incql-evidence-lane incql-evidence-lane--plan" aria-labelledby="incql-plan-evidence-title">
<header>
<span>Before execution · local plan lane</span>
<h3 id="incql-plan-evidence-title">Inspect authored meaning</h3>
<p><code>inspect_plan(...)</code> reads Prism-backed state without binding a physical source or running a backend. It returns a structured <code>PlanInspection</code>.</p>
</header>
<ul class="incql-evidence-lane__artifacts">
<li><img src="../shared/icons/table-check.svg" alt="" aria-hidden="true"><span><strong>Schema</strong><small>Output fields + typed shape</small></span></li>
<li><img src="../shared/icons/vector-polyline.svg" alt="" aria-hidden="true"><span><strong>Lineage + origin</strong><small>Value, control, grouping + authored mappings</small></span></li>
<li><img src="../shared/icons/source-branch.svg" alt="" aria-hidden="true"><span><strong>Plan + rewrites</strong><small>Nodes, applied rules + origin map</small></span></li>
<li><img src="../shared/icons/shield-check-outline.svg" alt="" aria-hidden="true"><span><strong>Requirements</strong><small>Adapter needs, diagnostics + unsupported markers</small></span></li>
</ul>
<p class="incql-evidence-lane__anchor"><span>Plan anchor</span><code>plan_target</code></p>
</section>

<section class="incql-evidence-lane incql-evidence-lane--runtime" aria-labelledby="incql-runtime-evidence-title">
<header>
<span>During and after · runtime lane</span>
<h3 id="incql-runtime-evidence-title">Record one concrete attempt</h3>
<p>Session derives the same plan target before lowering, records it on the <code>ExecutionObservation</code>, and gives the concrete run its own distinct <code>attempt_target</code>.</p>
</header>
<dl class="incql-evidence-lane__facts">
<div><dt>Attempt</dt><dd><code>execute</code>, <code>collect</code>, or <code>write</code>; terminal status</dd></div>
<div><dt>Runtime</dt><dd>Context targets, backend, and adapter or profile identity</dd></div>
<div><dt>Timing</dt><dd>Start, end + monotonic duration</dd></div>
<div><dt>Outcome</dt><dd>Diagnostics; optional counts, traces + evidence references</dd></div>
</dl>
<p class="incql-evidence-lane__anchor"><span>Plan anchor</span><code>plan_target</code></p>
</section>

<p class="incql-evidence-story__boundary"><strong>Substrait remains the logical-plan boundary.</strong> It carries the portable <code>Plan</code> / <code>Rel</code>. Neither the <code>PlanInspection</code>, its origin map, nor the correlation key is serialized into that plan. Adapter coverage is checked separately and is not automatically attached by <code>collect_observed</code>.</p>
</div>

<p class="incql-architecture-note"><strong>Quality checks stay explicit and policy-neutral.</strong> A quality block declares typed assertions; it does not filter, quarantine, or mutate a relation on its own. A caller evaluates those declarations through <code>Session.observe_quality(...)</code> or <code>observe_quality_pair(...)</code>, which return quality observations. Enforcement remains the responsibility of policy, CI, or orchestration code.</p>
<p class="incql-architecture-note"><strong>A governance checkpoint is evidence, not a hidden policy engine.</strong> It records an observation or decision against a semantic target so downstream tooling can explain and verify what happened.</p>
<p class="incql-architecture-links">Continue with <a href="../language/reference/inspection/">Plan inspection</a>, <a href="../language/how-to/execution_observations/">Execution observations</a>, <a href="../language/reference/quality/">quality assertions and observations</a>, or <a href="../language/how-to/governed_evidence/">governed evidence</a>.</p>
</section>

<section id="one-query" class="incql-architecture-chapter incql-architecture-chapter--query" data-architecture-section="one-query" markdown="1">
<header class="incql-architecture-heading">
<p class="incql-architecture-kicker">One concrete execution trace</p>
<h2>From query block to observed result</h2>
<p class="incql-architecture-lede">This trace follows one Prism-backed <code>LazyFrame[Order]</code>. It shows the representation at each boundary, the transformation performed there, and the evidence that connects a concrete execution back to the authored Prism plan produced by the query.</p>
</header>

<ol class="incql-query-boundary-map" aria-label="Boundary map for this execution trace">
<li data-system-boundary="author"><span>Authoring</span><code>query { } + LazyFrame</code></li>
<li data-system-boundary="prism"><span>Prism</span><code>Authored nodes + canonical view</code></li>
<li data-system-boundary="substrait"><span>Substrait</span><code>Plan / Rel</code></li>
<li data-system-boundary="session"><span>Session</span><code>Plan + registrations</code></li>
<li data-system-boundary="adapter"><span>Adapter</span><code>materialization</code></li>
</ol>

<div class="incql-query-entry" markdown="1">
<section class="incql-query-specimen" data-system-boundary="author" aria-labelledby="incql-query-source-title" markdown="1">
<header class="incql-query-subheading">
<span>Authoring · Surface input</span>
<h3 id="incql-query-source-title">A query over <code>orders</code></h3>
</header>

```incan
from pub::incql import (
    LazyFrame,
    Session,
)
from models import (
    Order,
    OrderSummary,
)

session = Session.default()
orders: LazyFrame[Order] = session.read_csv(
    "orders",
    "orders.csv",
)?

paid_by_region: LazyFrame[OrderSummary] = (
    query {
        FROM orders
        WHERE .status == "paid"
        GROUP BY .region
        SELECT
            .region as region,
            sum(.amount) as total
    }
)

observed = session.collect_observed(
    paid_by_region,
)
```

<dl class="incql-query-facts">
<div><dt>Input carrier</dt><dd><code>LazyFrame[Order]</code></dd></div>
<div><dt>Logical source</dt><dd><code>orders</code></dd></div>
<div><dt>Output intent</dt><dd><code>LazyFrame[OrderSummary]</code></dd></div>
<div><dt>Output fields</dt><dd><code>region</code>, <code>total</code></dd></div>
</dl>
</section>

<section class="incql-query-desugar" data-system-boundary="author" aria-labelledby="incql-query-desugar-title" markdown="1">
<header class="incql-query-subheading">
<span>Authoring · Desugar + typecheck</span>
<h3 id="incql-query-desugar-title">The surface becomes ordinary carrier calls</h3>
</header>

```incan
paid_by_region = orders
    .filter(eq(col("status"), "paid"))
    .group_by([col("region")])
    .agg([
        aggregate_as(
            sum(col("amount")),
            "total",
        ),
    ])
    .select([
        with_column_assignment(
            "region",
            col("region"),
        ),
        with_column_assignment(
            "total",
            col("total"),
        ),
    ])
```

<p>The generated calls follow the normal Incan typechecker. In this CSV-backed trace, the registered <code>orders</code> source supplies the starting logical schema; later references resolve against each stage’s current logical schema during lowering. <code>OrderSummary</code> documents the intended output row model; full field/type compatibility validation against that annotation remains follow-up work.</p>
</section>
</div>

<section class="incql-query-phase" aria-labelledby="incql-query-logical-title">
<header class="incql-query-phase__heading">
<div><span>Prism → Substrait · Logical handoff</span><h3 id="incql-query-logical-title">See the concrete artifact at every step</h3></div>
<p>The authored Prism graph is immutable. A narrow canonical rewrite fuses grouping and aggregation for lowering while retaining an authored-origin map.</p>
</header>

<dl class="incql-rewrite-ledger" aria-label="Prism rewrite summary">
<div><dt>Authored view</dt><dd>5 nodes</dd></div>
<div><dt>Applied rule</dt><dd><code>fuse_group_by_aggregate</code></dd></div>
<div><dt>Rewritten view</dt><dd>4 nodes</dd></div>
<div><dt>Explainability</dt><dd>Origin map retained</dd></div>
</dl>

<div class="incql-query-table-wrap" role="region" aria-label="Query clause transformation matrix" tabindex="0">
<table class="incql-query-matrix">
<caption>Clause-by-clause transformation from the authored query into the portable logical plan</caption>
<thead>
<tr><th scope="col" data-system-boundary="author">Query clause and carrier call</th><th scope="col" data-system-boundary="prism">Prism state</th><th scope="col" data-system-boundary="substrait">Substrait relation</th><th scope="col" data-system-boundary="evidence">Inspectable evidence</th></tr>
</thead>
<tbody>
<tr>
<th scope="row"><span class="incql-query-cell-label" aria-hidden="true">Query clause</span><code>FROM orders</code><small>Source carrier: <code>orders</code></small></th>
<td><span class="incql-query-cell-label" aria-hidden="true">Prism state</span><strong>Existing carrier root n0</strong><code>ReadNamedTable("orders")</code><small><code>FROM</code> selects the existing <code>orders</code> carrier; it appends no node. The root is unchanged in the rewritten view.</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Substrait relation</span><code>ReadRel</code><small><code>NamedTable(["orders"])</code></small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Inspectable evidence</span><strong>Read root</strong><small>Logical source and input-field targets</small></td>
</tr>
<tr>
<th scope="row"><span class="incql-query-cell-label" aria-hidden="true">Query clause</span><code>WHERE .status == "paid"</code><small><code>.filter(eq(col("status"), "paid"))</code></small></th>
<td><span class="incql-query-cell-label" aria-hidden="true">Prism state</span><strong>Authored n1</strong><code>Filter</code><small>Origin n1 after rewrite</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Substrait relation</span><code>FilterRel</code><small><code>equal(status, "paid")</code></small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Inspectable evidence</span><strong>Control lineage</strong><small><code>orders.status</code> controls which rows survive</small></td>
</tr>
<tr class="incql-query-matrix__rewrite">
<th scope="row"><span class="incql-query-cell-label" aria-hidden="true">Query clause</span><code>GROUP BY .region</code><small><code>.group_by(...).agg(sum(amount))</code></small></th>
<td><span class="incql-query-cell-label" aria-hidden="true">Prism state</span><strong>Authored n2 + n3</strong><code>GroupBy</code> then <code>Aggregate</code><small>Rewritten as one <code>Aggregate(group, measures)</code>, origin n3</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Substrait relation</span><code>AggregateRel</code><small>Grouping: <code>region</code><br>Measure: <code>sum(amount)</code> as <code>total</code></small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Inspectable evidence</span><strong>Grouping + value lineage</strong><small><code>region</code> groups; <code>amount</code> contributes to <code>total</code></small></td>
</tr>
<tr>
<th scope="row"><span class="incql-query-cell-label" aria-hidden="true">Query clause</span><code>SELECT region, total</code><small><code>.select(...)</code></small></th>
<td><span class="incql-query-cell-label" aria-hidden="true">Prism state</span><strong>Authored n4</strong><code>SelectProject</code><small>Origin n4 after rewrite</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Substrait relation</span><code>ProjectRel</code><small><code>RelRoot</code> names <code>region</code>, <code>total</code></small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Inspectable evidence</span><strong>Output shape</strong><small>Schema and output-field targets</small></td>
</tr>
</tbody>
</table>
</div>
<p class="incql-query-caption"><strong>How to read the plan:</strong> the Plan root wraps <code>ProjectRel</code>, which nests down through <code>AggregateRel</code>, <code>FilterRel</code>, and <code>ReadRel</code>. The tree is displayed root-to-source; rows later move source-to-root. The labels n0…n4 illustrate a fresh cursor and are not stable global IDs.</p>
</section>

<section class="incql-query-phase incql-query-phase--runtime" aria-labelledby="incql-query-runtime-title">
<header class="incql-query-phase__heading">
<div><span>Session → adapter · Runtime handoff</span><h3 id="incql-query-runtime-title">The portable plan meets concrete runtime state</h3></div>
<p>Substrait carries the logical read, not its concrete <code>TableSource</code> or backend selection. Session maps <code>orders</code> to <code>TableSource { source_kind, uri }</code> and dispatches the selected adapter.</p>
</header>

<div class="incql-query-table-wrap" role="region" aria-label="Runtime handoff ledger" tabindex="0">
<table class="incql-runtime-ledger">
<caption>Runtime ownership and the artifact produced by each handoff</caption>
<thead>
<tr><th scope="col">Stage and owner</th><th scope="col">Receives</th><th scope="col">Performs</th><th scope="col">Produces or preserves</th></tr>
</thead>
<tbody>
<tr data-system-boundary="session">
<th scope="row"><span class="incql-query-cell-label" aria-hidden="true">Stage and owner</span><strong>Session · Bind</strong><small>Runtime context</small></th>
<td><span class="incql-query-cell-label" aria-hidden="true">Receives</span><code>Plan</code><small>Registration for logical table <code>orders</code> and selected backend</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Performs</span><strong>Validate + dispatch</strong><small>Checks that <code>orders</code> is registered, then passes backend registrations and plan to the adapter</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Produces or preserves</span><strong>Backend dispatch inputs</strong><small>Validated <code>Plan</code> + <code>BackendRegistration[]</code>. Session separately carries the cursor-derived <code>plan_target</code> into the later observation.</small></td>
</tr>
<tr data-system-boundary="adapter">
<th scope="row"><span class="incql-query-cell-label" aria-hidden="true">Stage and owner</span><strong>Adapter · Execute</strong><small>DataFusion</small></th>
<td><span class="incql-query-cell-label" aria-hidden="true">Receives</span><code>Plan</code> + registrations<small><code>orders</code> resolves to a concrete <code>TableSource</code></small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Performs</span><strong>Backend planning + execution</strong><small>Registers the source, consumes the Substrait plan, builds a DataFusion logical plan, executes, and collects record batches</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Produces or preserves</span><code>DataFrameMaterialization</code><small><code>resolved_columns</code>, runtime <code>row_count</code>, and rendered preview text</small></td>
</tr>
<tr data-system-return="observation">
<th scope="row"><span class="incql-query-cell-label" aria-hidden="true">Stage and owner</span><strong>Session · Observe return</strong><small>Runtime evidence</small></th>
<td><span class="incql-query-cell-label" aria-hidden="true">Receives</span>Collected <code>DataFrame[OrderSummary]</code> or <code>SessionError</code><small>The result of this exact collect attempt</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Performs</span><strong>Normalize public result + evidence</strong><small>Wraps data or error and records attempt status, backend, duration, diagnostics, and row count when available</small></td>
<td><span class="incql-query-cell-label" aria-hidden="true">Produces or preserves</span><code>ObservedDataFrame[OrderSummary]</code><small><code>data</code>, <code>observation</code>, and <code>error</code></small></td>
</tr>
</tbody>
</table>
</div>

<aside class="incql-query-side-check">
<span>Separate diagnostic path</span>
<code>session.check_plan_coverage(paid_by_region)</code>
<p>Coverage checking is explicit today. It reports inferred adapter requirements separately; <code>collect_observed</code> does not gate execution on those records or attach them automatically.</p>
</aside>
</section>

<section class="incql-evidence-correlation" data-system-return="evidence" aria-labelledby="incql-query-evidence-title">
<header><span>Evidence spine</span><h3 id="incql-query-evidence-title">Inspection and execution meet at <code>plan_target</code></h3></header>
<div class="incql-evidence-correlation__grid">
<article><span>Before execution</span><strong><code>inspect_plan(paid_by_region)</code></strong><p>Reports authored and rewritten nodes, the applied rewrite rule, output fields, lineage, adapter requirements, diagnostics, and unsupported-evidence markers—without binding a source or running a backend.</p></article>
<div class="incql-evidence-correlation__key"><span>Shared correlation key</span><strong><code>plan_target</code></strong><small>Prism store + tip derived identity</small></div>
<article><span>After collect</span><strong><code>ExecutionObservation</code></strong><p>Reports <code>Collect</code>, success or failure, <code>datafusion</code>, runtime duration, diagnostics, and a row count when materialization succeeds.</p></article>
</div>
</section>

<div class="incql-architecture-explanation" markdown="1">
<p><strong>What changes at each boundary.</strong> The query block desugars into carrier calls; those calls append immutable Prism nodes; a canonical view fuses <code>GroupBy</code> and <code>Aggregate</code>; lowering emits one Substrait <code>AggregateRel</code>; Session binds the logical read; and DataFusion performs backend-specific planning and execution.</p>
<p><strong>What stays traceable.</strong> Prism retains rewritten-to-authored origin mappings. Local inspection explains that <code>status</code> provides control lineage, <code>region</code> provides grouping lineage, and <code>amount</code> provides value lineage to <code>total</code>. The later observation correlates to that local evidence through the same <code>plan_target</code>; the lineage itself is not runtime telemetry.</p>
</div>

<p class="incql-architecture-note"><strong>Boundary rule:</strong> Prism’s origin map and semantic targets remain local IncQL evidence; they are not smuggled into the Substrait payload. Substrait carries relational meaning. Session adds runtime binding and reconnects the concrete attempt to the inspected plan.</p>
<p class="incql-architecture-links">See the <a href="../language/reference/query_blocks/">query-block grammar</a>, <a href="../language/reference/inspection/">inspection surface</a>, and <a href="../language/reference/execution_context/">execution API</a>.</p>
</section>

<section id="ownership" class="incql-architecture-chapter incql-architecture-chapter--ownership" data-architecture-section="ownership" markdown="1">
<header class="incql-architecture-heading">
<p class="incql-architecture-kicker">Clear seams</p>
<h2>Each layer owns one kind of decision</h2>
<p class="incql-architecture-lede">Portability only works when language mechanics, relational meaning, interchange, and execution do not collapse into one another.</p>
</header>

<div class="incql-ownership-bands">
<section class="incql-ownership-band" data-ownership-phase="authoring" aria-labelledby="incql-ownership-authoring-title">
<header><span>Authoring</span><h3 id="incql-ownership-authoring-title">Language host and semantic package</h3><p>The compiler hosts the extension point; IncQL supplies the vocabulary and public relational contracts.</p></header>
<div class="incql-ownership-pair">
<article><span>Generic language mechanics</span><h4>Incan compiler</h4><p><strong>Decides:</strong> generic vocabulary hosting, parsing and typechecking generated Incan, language lowering and Rust emission, and language tooling.</p><p><strong>Must not decide:</strong> IncQL vocabulary semantics, carrier contracts, relational meaning, or execution behavior.</p></article>
<article><span>IncQL vocabulary + package</span><h4>IncQL</h4><p><strong>Decides:</strong> <code>query:</code> and <code>quality:</code> desugaring, public carriers and functions, relational semantics, and evidence contracts.</p><p><strong>Must not decide:</strong> generic compiler semantics, workflow orchestration, credentials, or engine-specific behavior.</p></article>
</div>
<p class="incql-ownership-handoff"><span>Handoff</span><code>generic vocabulary AST</code><b>IncQL desugaring</b><code>checked carrier calls</code></p>
</section>

<section class="incql-ownership-band" data-ownership-phase="planning" aria-labelledby="incql-ownership-planning-title">
<header><span>Planning + interchange</span><h3 id="incql-ownership-planning-title">Semantic graph and portable representation</h3><p>Prism owns local planning state; Substrait is the representation exchanged with runtime.</p></header>
<div class="incql-ownership-pair">
<article><span>Semantic planning</span><h4>Prism</h4><p><strong>Decides:</strong> immutable authored graph state, narrow canonical rewrites, rewritten-to-authored origin mapping, and the state from which schema and lineage are derived.</p><p><strong>Must not decide:</strong> syntax or desugaring, interchange representation, runtime binding, or physical execution.</p></article>
<article><span>Portable interchange</span><h4>Substrait</h4><p><strong>Carries:</strong> portable <code>Plan</code> / <code>Rel</code>, schemas and expressions, extension declarations, and conformance-relevant plan shape.</p><p><strong>Must not carry:</strong> source bindings, backend selection, local Prism evidence, or physical execution policy.</p></article>
</div>
<p class="incql-ownership-handoff"><span>Handoff</span><code>Prism rewritten view</code><b>lowering</b><code>Substrait Plan / Rel</code></p>
</section>

<section class="incql-ownership-band" data-ownership-phase="runtime" aria-labelledby="incql-ownership-runtime-title">
<header><span>Runtime</span><h3 id="incql-ownership-runtime-title">Binding context and engine integration</h3><p>Session owns the attempt; the adapter owns the concrete engine bridge.</p></header>
<div class="incql-ownership-pair">
<article><span>Runtime context</span><h4>Session</h4><p><strong>Decides:</strong> registrations, selected backend, binding validation, dispatch, public result wrapping, execution observations, and explicit coverage evaluation when requested.</p><p><strong>Must not decide:</strong> semantic rewrites or backend-specific physical planning.</p></article>
<article><span>Engine integration</span><h4>Backend adapter</h4><p><strong>Decides:</strong> concrete source registration, backend bridging and planning, engine calls, collection or writes, and typed backend errors.</p><p><strong>Must not decide:</strong> IncQL semantics, Session policy, or execution-observation creation.</p></article>
</div>
<p class="incql-ownership-handoff"><span>Handoff</span><code>Plan + BackendRegistration[]</code><b>adapter dispatch</b><code>materialization or typed error</code></p>
</section>
</div>

<div class="incql-architecture-explanation" markdown="1">
<p><strong>What crosses the seams:</strong> IncQL vocabulary desugaring produces checked carrier calls. A Prism-backed carrier can derive a rewritten view and lower it to a Substrait <code>Plan</code> or <code>Rel</code>. Session validates registered logical reads, supplies <code>BackendRegistration[]</code>, and dispatches the configured adapter, which returns a materialization or typed error.</p>
<p><strong>What does not cross them:</strong> Prism’s origin map and inspection artifacts remain local. Session creates the runtime observation and correlates it with local plan evidence through <code>plan_target</code>; the adapter neither receives that evidence nor creates the observation.</p>
</div>
<p class="incql-architecture-note"><strong>The cross-cutting invariant:</strong> local plan evidence and runtime observations remain correlatable without turning Substrait or the adapter into an evidence transport.</p>
<p class="incql-architecture-links">Read the boundary contracts in <a href="../rfcs/007_prism_planning_engine/">Prism RFC 007</a>, <a href="../rfcs/002_apache_substrait_integration/">Substrait RFC 002</a>, <a href="../language/reference/execution_context/">Execution context</a>, and <a href="../rfcs/008_optimizer_boundary_stats_cbo_aqe/">the optimizer-boundary record</a>.</p>
</section>

<section id="internals" class="incql-architecture-chapter incql-architecture-chapter--internals" data-architecture-section="internals" markdown="1">
<header class="incql-architecture-heading">
<p class="incql-architecture-kicker">Inside the package</p>
<h2>The repository follows the same seams</h2>
<p class="incql-architecture-lede">Most boundaries map to focused modules. Two cross-cuts matter: IncQL-specific syntax lives in <code>vocab_companion/</code>, while shared evidence records connect Prism inspection to Session observations.</p>
</header>

<div class="incql-module-topology">
<header>
<span>Implementation cutaway</span>
<h3>Two carrier paths converge at Substrait</h3>
<p>Only <code>LazyFrame</code> is Prism-backed today. Concrete <code>DataFrame</code> and <code>DataStream</code> carriers lower directly to the portable boundary.</p>
</header>

<div class="incql-module-table-wrap" role="region" aria-label="IncQL carrier path module map" tabindex="0">
<table class="incql-module-table">
<thead><tr><th scope="col">Boundary</th><th scope="col">Prism-backed <code>LazyFrame</code></th><th scope="col">Direct <code>DataFrame</code> + <code>DataStream</code></th></tr></thead>
<tbody>
<tr data-system-boundary="author"><th scope="row"><span>Authoring</span><strong>IncQL surface</strong></th><td data-path-label="Prism-backed LazyFrame"><code>vocab_companion/</code><small>IncQL vocabulary registration and desugaring</small><code>src/lib.incn + src/dataset/ + src/functions/</code><small>Public exports, carrier types, and relational calls</small></td><td data-path-label="Direct DataFrame + DataStream"><code>src/lib.incn + src/dataset/ + src/functions/</code><small>Concrete carriers and relational calls; query vocabulary may produce the same calls</small></td></tr>
<tr data-system-boundary="prism"><th scope="row"><span>Planning</span><strong>Local semantic state</strong></th><td data-path-label="Prism-backed LazyFrame"><code>src/prism/</code><small>Authored graph, narrow rewrites, origin mapping, and planning state</small></td><td data-path-label="Direct DataFrame + DataStream"><strong>No Prism store</strong><small>This carrier path converges during Substrait lowering.</small></td></tr>
<tr data-system-boundary="substrait"><th scope="row"><span>Exchange</span><strong>Portable logical plan</strong></th><td data-path-label="Prism-backed LazyFrame"><code>src/substrait/</code><small>Schema and expression lowering, relation construction, extensions, plan assembly, and conformance</small></td><td data-path-label="Direct DataFrame + DataStream"><code>src/substrait/</code><small>Direct carrier lowering into the same portable <code>Plan</code> / <code>Rel</code> boundary</small></td></tr>
<tr data-system-boundary="session"><th scope="row"><span>Runtime</span><strong>Bind + dispatch</strong></th><td data-path-label="Prism-backed LazyFrame"><code>src/session/ + src/backends.incn</code><small>Public Session API, source and sink domain, registration validation, adapter selection, and dispatch</small></td><td data-path-label="Direct DataFrame + DataStream"><code>src/session/ + src/backends.incn</code><small>The same runtime context receives the portable plan and registrations</small></td></tr>
<tr data-system-boundary="adapter"><th scope="row"><span>Adapter</span><strong>Concrete engine</strong></th><td data-path-label="Prism-backed LazyFrame"><code>src/session/datafusion_backend.incn</code><small>Current DataFusion bridge, execution, collection, writes, and typed backend errors</small></td><td data-path-label="Direct DataFrame + DataStream"><code>src/session/datafusion_backend.incn</code><small>The same current adapter consumes the direct path’s portable plan</small></td></tr>
</tbody>
</table>
</div>

<aside class="incql-module-evidence" aria-label="Cross-cutting evidence modules">
<header><span>Cross-cutting local evidence</span><strong>Records connect inspection and observation without entering the plan payload.</strong></header>
<article><img src="../shared/icons/table-check.svg" alt=""><span><code>src/inspect.incn</code><small>Reads Prism state to derive plan, schema, lineage, origin, requirements, and diagnostics.</small></span></article>
<article><img src="../shared/icons/chart-timeline-variant.svg" alt=""><span><code>src/evidence.incn</code><small>Defines semantic targets and records shared by inspection and Session observations.</small></span></article>
<article><img src="../shared/icons/shield-check-outline.svg" alt=""><span><code>src/governance.incn + src/quality.incn</code><small>Define governed checkpoints, assertions, and adjacent evidence records.</small></span></article>
</aside>
</div>

<div class="incql-repo-boundary">
<div><span>IncQL repository</span><strong>Package code, tests, documentation, conformance material, and normative RFCs.</strong></div>
<div><span>Incan repository</span><strong>Compiler implementation for syntax, typechecking, lowering, Rust emission, language tooling, and the test runner.</strong></div>
</div>

<div class="incql-architecture-next" markdown="1">
<div>
<p class="incql-architecture-kicker">Go deeper</p>
<h3>Contributor architecture</h3>
<p>Browse the implementation map, build and test path, repository/compiler boundary, and source-level reading order without crowding the conceptual architecture.</p>
</div>
<p class="incql-architecture-next__action"><a href="../contributing/architecture/">Open contributor architecture</a></p>
</div>
</section>
</article>
</div>

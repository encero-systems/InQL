# Learn IncQL

<p class="pp-learn-kicker">One project. The complete system path.</p>

IncQL makes more sense when you follow one piece of data logic all the way through the system. Start with the book for that guided path, or choose a focused route when you already know what you need.

<section class="pp-learn-hero" aria-labelledby="learn-book-title" markdown="1">
<div class="pp-learn-hero__copy" markdown="1">

## From typed input to evidence you can use {#learn-book-title}

Build a small order-analysis project, keep its plan deferred, inspect what Prism understands, run it through DataFusion, and retain structured evidence about the attempt.

The chapters accumulate into one runnable example. Each ends with a result you can verify before moving on.

<a class="incql-button incql-button--primary" href="tutorials/book/">Start the IncQL Book</a>

</div>

<div class="pp-learn-receipt" aria-label="What the tutorial follows">
<p class="pp-learn-receipt__label">The path you will trace</p>
<ol>
<li><span>Input</span><strong>CSV + intended row model</strong></li>
<li><span>Plan</span><strong>Prism-backed LazyFrame</strong></li>
<li><span>Run</span><strong>Session + DataFusion</strong></li>
<li><span>Evidence</span><strong>Inspection, coverage, quality</strong></li>
<li><span>Decision</span><strong>Caller-owned write</strong></li>
</ol>
</div>
</section>

## Choose the route that matches your task

<div class="pp-learn-route-grid" markdown="1">
<a class="pp-learn-route-card pp-learn-route-card--guides" href="how-to/">
<span>Do a task</span>
<strong>Guides</strong>
<p>Start with an outcome such as inspecting lineage, observing quality, or writing a result.</p>
</a>

<a class="pp-learn-route-card pp-learn-route-card--reference" href="reference/">
<span>Look something up</span>
<strong>Reference</strong>
<p>Find current types, signatures, operators, records, and behavior contracts.</p>
</a>

<a class="pp-learn-route-card pp-learn-route-card--architecture" href="../architecture/">
<span>Understand the system</span>
<strong>Architecture</strong>
<p>Follow typed intent through Prism, Substrait, Session, execution, and evidence.</p>
</a>
</div>

## Build the right mental model

These explanations answer the two questions that recur throughout the book.

<div class="pp-learn-concepts" markdown="1">
<article markdown="1">

### [Dataset carriers](explanation/dataset_carriers.md)

Understand the difference between deferred, materialized, bounded, and unbounded data—and why only `LazyFrame[T]` owns Prism state today.

</article>
<article markdown="1">

### [Execution context](explanation/execution_context.md)

Understand what a `Session` owns, when a plan reaches a backend, and where observations enter the flow.

</article>
</div>

!!! note "What the book deliberately does not hide"

    The included project uses IncQL as a local path dependency and DataFusion as the implemented backend. Its model parameter records the intended row shape, while the Session discovers the CSV schema; full CSV-to-model compatibility validation is not implemented yet. The tutorial calls out boundaries like these where they matter.

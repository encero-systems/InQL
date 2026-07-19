# Design records

IncQL keeps normative design decisions and longer-form explorations separate from current API documentation.

## RFCs

[Requests for Comments][rfcs] define IncQL's stable design intent and record why important boundaries exist. They cover the language and carrier foundations, Prism and Substrait, Session execution, the function catalog, evidence and governance, external ingress, and backend modes.

RFCs are moment-in-time design records. Use the [Reference][reference] pages for current package behavior and the RFC series when you need the normative contract, rationale, alternatives, or design history.

## Whitepapers

[Whitepapers][whitepapers] explore product and architectural directions that benefit from a cohesive narrative but are not themselves the public API contract. The current collection includes [IncQL-DB][incql-db], the local embedded analytical store direction.

## Contributing a design

Read [Writing RFCs][writing-rfcs] before proposing a normative change. New RFCs start from the [RFC template][template] and should make the north-star end state explicit before describing implementation stages.

<!-- References -->
[incql-db]: whitepapers/incql_db.md
[reference]: language/reference/README.md
[rfcs]: rfcs/README.md
[template]: rfcs/TEMPLATE.md
[whitepapers]: whitepapers/README.md
[writing-rfcs]: contributing/writing_rfcs.md

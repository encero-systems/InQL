# Prismplane docs theme

Prismplane is IncQL's documentation visual language: optical planning surfaces, transparent schema panes, refracted rails, and structure-first decoration. The source inspiration is the local prototype at `/Users/danny/Development/encero/prototypes/incql-prismplane-v6/`; that prototype is a design handoff, not production site code.

IncQL is also the reference implementation for a wider Encero documentation system. Reuse should happen through stable interaction patterns, content contracts, and design tokens; product-specific names, colors, illustrations, and information architecture remain brand layers. Extract a shared package only after more than one site has proved which seams are genuinely common.

## Design rules

- Tables, code blocks, schema examples, and query snippets should carry more visual authority than decorative panels.
- Primary visuals should show IncQL product reality: source code, typed schemas, Prism plan shape, lineage, Substrait boundaries, adapter coverage, quality evidence, or similarly inspectable state.
- Avoid vague generated hero art. If a visual does not help a reader understand IncQL's data logic surface, replace it with a grounded product visual.
- Color belongs in rails, edge behavior, focus states, and signal accents; long-form prose should stay calm and readable.
- Glass effects should support inspectability. If a treatment makes text, navigation, or code harder to read, simplify it.
- IncQL should feel analytical and typed, not ceremonial. Do not copy Incan's Incapunk forged-metal tone directly.
- The landing page can be more expressive than reference pages, but ordinary Markdown pages must still look complete without local wrappers.

## Implementation model

The production theme is a light MkDocs Material adapter in `docs/stylesheets/prismplane.css`, with dark code surfaces retained for syntax clarity. Keep the implementation in Material-friendly CSS and normal Markdown first:

- use Material navigation, search, code blocks, tables, admonitions, and task lists
- keep custom landing-page classes limited to `docs/index.md`
- avoid page-specific HTML when a normal Markdown heading, table, list, or admonition would work
- prefer editing existing CSS sections over appending late override piles
- use `mkdocs build --strict` before publishing docs changes

Interactive documentation components follow the same split:

- source Markdown and repository metadata remain the source of truth
- a build-time, standard-library generator validates and serializes portable data
- ordinary Markdown remains visible as the no-JavaScript and failed-enhancement fallback
- JavaScript enhances that data with search, filters, keyboard behavior, and URL state
- component CSS uses local `--pp-*` tokens, so another product can substitute its brand layer without rewriting behavior

The RFC Context Reader is the first component built to this contract. Its filtering and master-detail behavior are product-neutral; IncQL supplies the RFC metadata schema, topic assignments, and Prismplane appearance.

For a second site, start by supplying its project label, intentional RFC-number gaps, topic mapping, and `--pp-docs-*` color tokens. Keep the generated-data shape and reader interaction contract unchanged first. Only extract shared files after that port demonstrates which configuration points are real rather than IncQL-specific assumptions.

## User experience target

The docs should answer a new user's first questions quickly:

1. What is IncQL?
2. Which task should I start with?
3. Where is the current API reference?
4. How do query blocks, dataset carriers, Prism, Substrait, sessions, and governance evidence fit together?

If a page cannot answer one of those questions directly, it should still make the next useful page obvious through links and navigation.

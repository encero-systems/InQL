# Prismplane docs theme

Prismplane is InQL's documentation visual language: optical planning surfaces, transparent schema panes, refracted rails, and structure-first decoration. The source inspiration is the local prototype at `/Users/danny/Development/encero/prototypes/inql-prismplane-v6/`; that prototype is a design handoff, not production site code.

## Design rules

- Tables, code blocks, schema examples, and query snippets should carry more visual authority than decorative panels.
- Primary visuals should show InQL product reality: source code, typed schemas, Prism plan shape, lineage, Substrait boundaries, adapter coverage, quality evidence, or similarly inspectable state.
- Avoid vague generated hero art. If a visual does not help a reader understand InQL's data logic surface, replace it with a grounded product visual.
- Color belongs in rails, edge behavior, focus states, and signal accents; long-form prose should stay calm and readable.
- Glass effects should support inspectability. If a treatment makes text, navigation, or code harder to read, simplify it.
- InQL should feel analytical and typed, not ceremonial. Do not copy Incan's Incapunk forged-metal tone directly.
- The landing page can be more expressive than reference pages, but ordinary Markdown pages must still look complete without local wrappers.

## Implementation model

The production theme is a MkDocs Material adapter in `docs/stylesheets/prismplane.css`. Keep the implementation in Material-friendly CSS and normal Markdown first:

- use Material navigation, search, code blocks, tables, admonitions, and task lists
- keep custom landing-page classes limited to `docs/index.md`
- avoid page-specific HTML when a normal Markdown heading, table, list, or admonition would work
- prefer editing existing CSS sections over appending late override piles
- use `mkdocs build --strict` before publishing docs changes

## User experience target

The docs should answer a new user's first questions quickly:

1. What is InQL?
2. Which task should I start with?
3. Where is the current API reference?
4. How do query blocks, dataset carriers, Prism, Substrait, sessions, and governance evidence fit together?

If a page cannot answer one of those questions directly, it should still make the next useful page obvious through links and navigation.

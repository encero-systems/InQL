from __future__ import annotations

import sys
from pathlib import Path


def _validate_rfc_catalog(root: Path) -> None:
    """Keep the generated RFC index in lockstep with the source records."""
    from mkdocs.exceptions import ConfigurationError

    from utils.rfc_catalog import (
        CatalogError,
        build_catalog,
        render_index_block,
        replace_generated_block,
    )

    rfc_dir = root / "docs" / "rfcs"
    readme = rfc_dir / "README.md"
    topics = rfc_dir / "catalog.json"
    try:
        current = readme.read_text(encoding="utf-8")
        records = build_catalog(rfc_dir, topics=topics)
        expected = replace_generated_block(current, render_index_block(records))
    except (CatalogError, OSError) as error:
        raise ConfigurationError(f"RFC catalog validation failed: {error}") from error

    if current != expected:
        raise ConfigurationError(
            "The generated RFC catalog is stale. Run `make rfc-index`, "
            "review the resulting index, and commit it with the RFC changes."
        )


def on_config(config):  # noqa: D401 - MkDocs hook signature
    """Register custom rendering support and validate generated docs data."""
    root = Path(__file__).resolve().parent
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    from utils.incan_pygments import register_incan_lexer

    register_incan_lexer()
    _validate_rfc_catalog(root)
    return config

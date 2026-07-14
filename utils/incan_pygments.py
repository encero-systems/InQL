from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Sequence

from pygments.lexers import _mapping
from pygments.lexers.python import PythonLexer
from pygments.token import Keyword, Name, Operator, Token


_FALLBACK_STDLIB_FUNCTIONS = {
    "abs",
    "avg",
    "ceil",
    "coalesce",
    "col",
    "concat",
    "count",
    "date_add",
    "datediff",
    "desc",
    "eq",
    "floor",
    "from_csv",
    "from_json",
    "ge",
    "gt",
    "is_array",
    "is_json",
    "is_null",
    "le",
    "lower",
    "lt",
    "make_date",
    "make_timestamp",
    "max",
    "min",
    "neq",
    "round",
    "sqrt",
    "substring",
    "sum",
    "trim",
    "try_cast",
    "typeof",
    "upper",
}

_FALLBACK_STDLIB_TYPES = {
    "Any",
    "Bool",
    "DataFrame",
    "DataSet",
    "Float",
    "Int",
    "LazyFrame",
    "None",
    "Option",
    "Result",
    "Session",
    "Str",
    "String",
    "Union",
    "bool",
    "dict",
    "float",
    "int",
    "list",
    "set",
    "str",
    "tuple",
}


_INFO_WITH_ALIASES = re.compile(
    r'info\([^,]+,\s*"([^"]+)"\s*,\s*&\[(.*?)\]',
    re.DOTALL,
)
_INFO_CANONICAL = re.compile(r'info\([^,]+,\s*"([^"]+)"', re.DOTALL)


def _extract_lang_items(text: str) -> tuple[set[str], set[str]]:
    canonicals: set[str] = set()
    aliases: set[str] = set()

    for match in _INFO_WITH_ALIASES.finditer(text):
        canonicals.add(match.group(1))
        aliases.update(re.findall(r'"([^"]+)"', match.group(2)))

    for match in _INFO_CANONICAL.finditer(text):
        canonicals.add(match.group(1))

    return canonicals, aliases


def _load_lang_items(paths: Sequence[Path]) -> tuple[set[str], set[str]]:
    canonicals: set[str] = set()
    aliases: set[str] = set()
    for path in paths:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        loaded_canonicals, loaded_aliases = _extract_lang_items(text)
        canonicals.update(loaded_canonicals)
        aliases.update(loaded_aliases)
    return canonicals, aliases


def _incan_core_lang_root() -> Path | None:
    """Return a local Incan core language registry when this repo is vendored beside Incan."""
    root = Path(__file__).resolve().parents[1]
    candidates = [
        root / "incan" / "crates" / "incan_core" / "src" / "lang",
        root.parent / "incan" / "crates" / "incan_core" / "src" / "lang",
        root.parent.parent / "incan" / "crates" / "incan_core" / "src" / "lang",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def _load_keywords_from_registry() -> list[str]:
    lang_root = _incan_core_lang_root()
    if lang_root is None:
        return []

    registry_path = lang_root / "keywords.rs"
    if not registry_path.exists():
        return []

    text = registry_path.read_text(encoding="utf-8", errors="replace")
    pattern = re.compile(
        r'info(?:_with_aliases)?\(\s*KeywordId::[A-Za-z_]+,\s*"([^"]+)"',
        re.DOTALL,
    )
    return sorted({match.group(1) for match in pattern.finditer(text)})


def _load_stdlib_functions() -> set[str]:
    lang_root = _incan_core_lang_root()
    if lang_root is None:
        return set(_FALLBACK_STDLIB_FUNCTIONS)

    paths = [
        lang_root / "builtins.rs",
        lang_root / "surface" / "functions.rs",
        lang_root / "surface" / "constructors.rs",
        lang_root / "surface" / "math.rs",
        lang_root / "surface" / "methods.rs",
    ]
    canonicals, aliases = _load_lang_items(paths)
    return canonicals.union(aliases, _FALLBACK_STDLIB_FUNCTIONS)


def _load_stdlib_types() -> set[str]:
    lang_root = _incan_core_lang_root()
    if lang_root is None:
        return set(_FALLBACK_STDLIB_TYPES)

    paths = [
        lang_root / "types" / "numerics.rs",
        lang_root / "types" / "collections.rs",
        lang_root / "types" / "stringlike.rs",
        lang_root / "surface" / "types.rs",
        lang_root / "derives.rs",
        lang_root / "errors.rs",
    ]
    canonicals, aliases = _load_lang_items(paths)
    return canonicals.union(aliases, _FALLBACK_STDLIB_TYPES)


def _fallback_keywords() -> list[str]:
    return [
        "and",
        "as",
        "async",
        "await",
        "break",
        "case",
        "class",
        "const",
        "continue",
        "crate",
        "def",
        "elif",
        "else",
        "enum",
        "false",
        "for",
        "from",
        "if",
        "import",
        "in",
        "is",
        "let",
        "match",
        "model",
        "mut",
        "newtype",
        "none",
        "not",
        "or",
        "pass",
        "pub",
        "python",
        "return",
        "rust",
        "self",
        "super",
        "trait",
        "true",
        "type",
        "while",
        "with",
        "yield",
    ]


def _keywords() -> Iterable[str]:
    # IncQL query blocks are Incan vocab syntax, so include the docs-facing clause keywords here
    # instead of relying on generic Python highlighting for uppercase words.
    extras = {
        "derive",
        "module",
        "test",
        "tests",
        "FROM",
        "HAVING",
        "SELECT",
        "WHERE",
        "GROUP",
        "BY",
        "ORDER",
        "WINDOW",
        "LIMIT",
        "JOIN",
        "ON",
        "OVER",
        "PARTITION",
        "ROWS",
        "RANGE",
        "CURRENT",
        "PRECEDING",
        "FOLLOWING",
        "UNBOUNDED",
        "ASC",
        "DESC",
        "INNER",
        "LEFT",
        "RIGHT",
        "FULL",
        "OUTER",
        "quality",
        "query",
    }
    return sorted(set(_load_keywords_from_registry()).union(_fallback_keywords(), extras))


class IncanLexer(PythonLexer):
    """Pygments lexer for Incan and IncQL code examples."""

    name = "Incan"
    aliases = ["incan", "incn"]
    filenames = ["*.incn"]
    mimetypes = ["text/x-incan"]

    flags = re.MULTILINE

    def __init__(self, **options):
        super().__init__(**options)
        self._incan_keywords = set(_keywords())
        self._incan_types = _load_stdlib_types()
        self._incan_functions = _load_stdlib_functions()

    def get_tokens_unprocessed(self, text, stack=("root",)):
        for index, token, value in super().get_tokens_unprocessed(text, stack=stack):
            if token is Name and value in self._incan_keywords:
                yield index, Keyword, value
                continue
            if token is Name and value in self._incan_types:
                yield index, Keyword.Type, value
                continue
            if token is Name and value in self._incan_functions:
                yield index, Name.Builtin, value
                continue
            if token is Name and value.startswith("assert_"):
                yield index, Name.Function, value
                continue
            if token is Token.Error and value == "?":
                yield index, Operator, value
                continue
            if token is Name and value[:1].isupper():
                yield index, Name.Class, value
                continue
            yield index, token, value


def register_incan_lexer() -> None:
    """Register Incan lexer with Pygments for MkDocs builds."""

    if "IncanLexer" in _mapping.LEXERS:
        return

    _mapping.LEXERS["IncanLexer"] = (
        __name__,
        IncanLexer.name,
        tuple(IncanLexer.aliases),
        tuple(IncanLexer.filenames),
        tuple(IncanLexer.mimetypes),
    )


__all__ = ["IncanLexer"]

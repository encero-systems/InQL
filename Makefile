# IncQL — Incan library package
# =============================
#
# Requires `incan` on your PATH (build/install from the Incan compiler repository).
# CI builds Incan from source first; locally, use your own toolchain.
#
# Override the binary if needed: `make build INCAN=/path/to/incan`

INCAN ?= incan
export INCAN_NO_BANNER ?= 1

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show Make targets
	@echo "\033[1mIncQL\033[0m — typed relational layer (Incan library)."
	@echo "Requires \033[36m$(INCAN)\033[0m on PATH, or set \033[36mINCAN=\033[0m/path/to/incan."
	@echo ""
	@grep -E '^[a-zA-Z0-9_.-]+:.*?##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# Build & test (primary — Incan-first)
# =============================================================================
#
# Test discovery defaults to `.` and walks the whole tree. CI checks out the
# Incan compiler under `./incan/`; running `incan test` without a path would
# pick up compiler integration tests (e.g. `incan/tests/test_*.incn`), which
# are not IncQL package tests. Scope to `tests/` only (see INCQL_FMT_DIRS).

INCQL_TEST_DIR := tests

.PHONY: build
build: ## Build the library (`incan build --lib`)
	@echo "\033[1mBuilding IncQL library...\033[0m"
	@$(INCAN) build --lib

.PHONY: test
test: ## Run package tests (`incan test tests`)
	@echo "\033[1mRunning IncQL tests...\033[0m"
	@$(INCAN) test $(INCQL_TEST_DIR)

.PHONY: vocab-companion-test
vocab-companion-test: ## Run Rust tests for the query-block vocabulary companion
	@echo "\033[1mRunning query-block vocabulary companion tests...\033[0m"
	@cargo test --manifest-path vocab_companion/Cargo.toml

.PHONY: test-style
test-style: ## Validate test style markers (Arrange / Act / Assert) across `tests/*.incn`
	@echo "\033[1mChecking test style markers...\033[0m"
	@bash scripts/check_test_style.sh

.PHONY: registry-metadata
registry-metadata: ## Validate RFC 014 function registry checked API metadata
	@echo "\033[1mChecking function registry API metadata...\033[0m"
	@mkdir -p target
	@$(INCAN) tools metadata api . --format json > target/function_registry_api_metadata.json
	@RUSTFLAGS="-Awarnings" $(INCAN) run scripts/check_function_registry_metadata.incn

.PHONY: build-locked
build-locked: ## Build with `--locked` (stricter; requires current `incan.lock`)
	@echo "\033[1mBuilding IncQL library (locked)...\033[0m"
	@$(INCAN) build --lib --locked

.PHONY: test-locked
test-locked: ## Run tests with `--locked`
	@echo "\033[1mRunning IncQL tests (locked)...\033[0m"
	@$(INCAN) test $(INCQL_TEST_DIR) --locked

# =============================================================================
# Documentation
# =============================================================================

.PHONY: rfc-index
rfc-index: ## Validate RFC metadata and regenerate the RFC catalog
	@python3 utils/rfc_catalog.py --tags docs/rfcs/catalog.json --write

.PHONY: rfc-index-check
rfc-index-check: ## Validate RFC metadata and fail when the catalog is stale
	@python3 utils/rfc_catalog.py --tags docs/rfcs/catalog.json --check

.PHONY: docs-test
docs-test: ## Run documentation tooling unit tests
	@python3 -m unittest discover -s tests/docs -p 'test_*.py'
	@node --test tests/docs/test_rfc_reader.cjs

.PHONY: docs-build
docs-build: rfc-index-check docs-test ## Validate and build the documentation site strictly
	@mkdocs build --strict

# =============================================================================
# Formatting (Incan source)
# =============================================================================
#
# Scope to IncQL-owned source paths. CI checks out the Incan compiler under
# `./incan/`; formatting `.` would walk that tree and fail on stdlib snapshots
# and test fixtures that are not meant for `incan fmt`. Standalone example
# packages are listed by source directory so generated `target/` output stays
# outside the formatting walk.

INCQL_FMT_DIRS := src tests examples/advanced_retail_query_blocks/src
INCQL_FMT_FILES := examples/*.incn

.PHONY: fmt
fmt: ## Format package `.incn` sources (`incan fmt` per directory)
	@echo "\033[1mFormatting Incan sources (package dirs)...\033[0m"
	@for d in $(INCQL_FMT_DIRS); do \
	  if [ -d "$$d" ]; then $(INCAN) fmt "$$d"; fi; \
	done
	@for f in $(INCQL_FMT_FILES); do \
	  if [ -f "$$f" ]; then $(INCAN) fmt "$$f"; fi; \
	done

.PHONY: fmt-check
fmt-check: ## Check formatting without writing (`incan fmt --check` per directory)
	@echo "\033[1mChecking Incan source formatting (package dirs)...\033[0m"
	@for d in $(INCQL_FMT_DIRS); do \
	  if [ -d "$$d" ]; then \
	    echo "\033[1m  -> $$d/\033[0m"; \
	    $(INCAN) fmt --check "$$d" || exit $$?; \
	  fi; \
	done
	@for f in $(INCQL_FMT_FILES); do \
	  if [ -f "$$f" ]; then \
	    echo "\033[1m  -> $$f\033[0m"; \
	    $(INCAN) fmt --check "$$f" || exit $$?; \
	  fi; \
	done

# =============================================================================
# Aggregates (local gates)
# =============================================================================

.PHONY: check
check: fmt-check test-style vocab-companion-test registry-metadata build test ## Format check, style gate, metadata check, build, and test
	@echo "\033[32m✓ check passed\033[0m"

.PHONY: pre-commit
pre-commit: fmt-check test-style vocab-companion-test registry-metadata build test ## Fast gate before commit (same as `check`)
	@echo "\033[32m✓ pre-commit gate passed\033[0m"

.PHONY: ci
ci: fmt-check test-style vocab-companion-test registry-metadata build test smoke-consumer ## Same steps as GitHub Actions `incql` job
	@echo "\033[32m✓ ci gate passed\033[0m"

.PHONY: verify
verify: ci ## Alias for `ci`

.PHONY: smoke-consumer
smoke-consumer: ## Verify IncQL works as a pub dependency from a fresh consumer project
	@echo "\033[1mRunning pub-consumer smoke check...\033[0m"
	@bash scripts/smoke_pub_consumer.sh

# =============================================================================
# Miscellaneous
# =============================================================================

.PHONY: version
version: ## Print `incan` version (requires toolchain on PATH)
	@$(INCAN) --version

.PHONY: clean
clean: ## Remove Incan `target/` outputs under this package
	@echo "\033[1mCleaning...\033[0m"
	@rm -rf target
	@echo "\033[32m✓ Clean\033[0m"

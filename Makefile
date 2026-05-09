# ForkURL — Makefile
#
# Common workflows:
#   make help              show this list
#   make build             build a local extension zip → dist/
#   make sync              regenerate default-rules.js from rules.json
#   make clean             remove dist/
#
#   make release-patch     bump 2.0.0 → 2.0.1, commit + tag + push (CI publishes)
#   make release-minor     bump 2.0.0 → 2.1.0, commit + tag + push
#   make release-major     bump 2.0.0 → 3.0.0, commit + tag + push

.PHONY: help build sync clean release-patch release-minor release-major

# Default target: show help.
help:
	@awk 'BEGIN{FS=":.*?##"; print "Targets:"} /^[a-zA-Z_-]+:.*?##/ {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build extension zip locally → dist/forkurl-vX.Y.Z.zip
	bash scripts/build-extension.sh

sync: ## Regenerate default-rules.js from rules.json
	node scripts/sync-default-rules.mjs

clean: ## Remove dist/
	rm -rf dist

release-patch: ## Bump patch version, tag, push (CI publishes Release)
	@node scripts/release.mjs patch

release-minor: ## Bump minor version, tag, push
	@node scripts/release.mjs minor

release-major: ## Bump major version, tag, push
	@node scripts/release.mjs major

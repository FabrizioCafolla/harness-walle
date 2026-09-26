#!/usr/bin/env bash
# Scenario: fresh init seeds .husky/{pre-commit,pre-push}, executable; update leaves consumer
# edits to them alone (SEED, not MANAGED); and the hooks are actually wired to git and fire on
# a real commit: not just present on disk. `just walle-setup` sets core.hooksPath (no husky npm
# package involved: Yarn Berry does not auto-run the top-level `prepare` lifecycle script, so
# wiring must not depend on it (see justfile.project.block's walle-setup recipe).

scenario_husky_seed() {
  local dir="${SANDBOX_DIR}/husky"

  cli init --source "$REPO_ROOT" -n husky -m website -d "$SANDBOX_DIR" >/dev/null || { fail "init failed"; return 1; }

  assert_path_present "$dir/.husky/pre-commit" || return 1
  assert_path_present "$dir/.husky/pre-push" || return 1
  [ -x "$dir/.husky/pre-commit" ] || { fail ".husky/pre-commit is not executable"; return 1; }
  [ -x "$dir/.husky/pre-push" ] || { fail ".husky/pre-push is not executable"; return 1; }

  # Real end-to-end wiring: git repo + `just walle-setup` must set core.hooksPath, and a real
  # commit must actually execute the seeded pre-commit hook. Resolve the lockfile via the
  # harness's own sandbox_install() first (--no-immutable, required to install against an
  # intentionally empty lockfile under Yarn's CI-hardened/frozen-lockfile mode on public PRs);
  # walle-setup's own `yarn install` then runs against an already-consistent lockfile, so it
  # succeeds under hardened mode too instead of tripping the exact gotcha sandbox_install exists
  # to work around.
  ( cd "$dir" && git init -q . ) || { fail "git init failed"; return 1; }
  sandbox_install "$dir" || { fail "install failed"; return 1; }
  ( cd "$dir" && just walle-setup ) >"${dir}/.e2e-setup.log" 2>&1 ||
    { fail "just walle-setup failed:"; cat "${dir}/.e2e-setup.log" >&2; return 1; }

  local hooks_path
  hooks_path="$(cd "$dir" && git config core.hooksPath || true)"
  [ "$hooks_path" = ".husky" ] || { fail "core.hooksPath not set to .husky after walle-setup (got: '${hooks_path}')"; return 1; }

  printf 'node_modules\n.yarn\ndist\n' >"${dir}/.gitignore"
  ( cd "$dir" && git add -A && \
    GIT_AUTHOR_NAME=e2e GIT_AUTHOR_EMAIL=e2e@e2e.test \
    GIT_COMMITTER_NAME=e2e GIT_COMMITTER_EMAIL=e2e@e2e.test \
    git commit -m "e2e" ) >"${dir}/.e2e-commit.log" 2>&1 ||
    { fail "git commit did not succeed (pre-commit hook may have failed; see ${dir}/.e2e-commit.log)"; return 1; }
  ( cd "$dir" && git log --oneline -1 ) | grep -q "e2e" ||
    { fail "commit was not created; pre-commit hook likely did not run"; return 1; }

  # A fresh init must be prettier-clean: the hook runs `yarn format` (prettier --check .), so a
  # warning in its output means a file the CLI wrote does not match prettier.
  ! grep -q '\[warn\]' "${dir}/.e2e-commit.log" ||
    { fail "prettier warnings in the first commit (a CLI-written file is not prettier-clean):"; grep '\[warn\]' "${dir}/.e2e-commit.log" >&2; return 1; }

  # The hook must actually block: a misformatted file (lint passes, prettier does not) has to
  # fail the commit and leave no new commit behind.
  local before after
  before="$(cd "$dir" && git rev-parse HEAD)"
  printf 'export const   value   =   1;\n' >"${dir}/src/e2e-misformatted.ts"
  if ( cd "$dir" && git add src/e2e-misformatted.ts && \
    GIT_AUTHOR_NAME=e2e GIT_AUTHOR_EMAIL=e2e@e2e.test \
    GIT_COMMITTER_NAME=e2e GIT_COMMITTER_EMAIL=e2e@e2e.test \
    git commit -m "e2e bad" ) >"${dir}/.e2e-blocked.log" 2>&1; then
    fail "pre-commit did not block a misformatted file"; return 1
  fi
  after="$(cd "$dir" && git rev-parse HEAD)"
  [ "$before" = "$after" ] || { fail "a commit was created despite the failing pre-commit hook"; return 1; }
  ( cd "$dir" && git reset -q && rm -f src/e2e-misformatted.ts )

  # Consumer customizes the hook; a subsequent update must leave it untouched (SEED, not MANAGED).
  printf '#!/usr/bin/env sh\necho customized\n' >"$dir/.husky/pre-commit"

  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || { fail "update failed"; return 1; }

  assert_file_contains "$dir/.husky/pre-commit" "echo customized" || return 1
}

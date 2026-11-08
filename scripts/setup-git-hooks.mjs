/**
 * @file setup-git-hooks.mjs
 * Points git at the versioned hooks in `.githooks/` (secret & privacy scan).
 *
 * Runs automatically through the root `prepare` script after `pnpm install`.
 * It is a safe no-op when there is no git repository (e.g. a tarball) or in CI,
 * where the GitHub Actions secret-scan job does the same work.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI) {
  console.log('[hooks] CI detected — skipping local git hook setup.');
  process.exit(0);
}

if (!existsSync('.git')) {
  console.log('[hooks] No .git directory — skipping local git hook setup.');
  process.exit(0);
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
  console.log('[hooks] core.hooksPath set to .githooks (pre-commit secret scan enabled).');
} catch (error) {
  // Never break `pnpm install` because of hook setup; just explain what to do.
  console.warn('[hooks] Could not set core.hooksPath. Run: git config core.hooksPath .githooks');
  console.warn(error instanceof Error ? error.message : error);
}

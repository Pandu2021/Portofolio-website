/**
 * @file browser.mjs
 * Finds an installed Chromium-based browser and launches it headless with
 * puppeteer-core (no browser download — uses what is already installed).
 *
 * Search order:
 *   1. BROWSER_PATH environment variable
 *   2. Windows: Microsoft Edge, then Google Chrome
 *   3. macOS: Google Chrome, then Microsoft Edge
 *   4. Linux / CI: google-chrome, chromium, microsoft-edge (from PATH)
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CANDIDATES = {
  win32: [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'microsoft-edge',
  ],
};

/**
 * Absolute path of a usable browser executable.
 * @returns {string}
 * @throws {Error} When no supported browser is installed.
 */
export function findBrowser() {
  const fromEnv = process.env.BROWSER_PATH;
  if (fromEnv) {
    if (!existsSync(fromEnv)) throw new Error(`BROWSER_PATH does not exist: ${fromEnv}`);
    return fromEnv;
  }
  for (const candidate of CANDIDATES[process.platform] ?? CANDIDATES.linux) {
    if (candidate.includes('/')) {
      if (existsSync(candidate)) return candidate;
      continue;
    }
    try {
      return execFileSync('which', [candidate], { encoding: 'utf8' }).trim();
    } catch {
      // Not on PATH — try the next one.
    }
  }
  throw new Error('No Chrome/Edge found. Install one or set BROWSER_PATH.');
}

/**
 * Launches the browser headless.
 * On Linux CI the Chrome sandbox needs unprivileged user namespaces, which
 * Ubuntu 24.04 runners restrict, so the sandbox is disabled there only
 * (we only ever open our own site).
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
export function launchBrowser() {
  const args = process.platform === 'linux' && process.env.CI ? ['--no-sandbox'] : [];
  // Behave like a desktop with a mouse everywhere. A CI server has no pointing
  // device, so Chrome would report `(hover: none)` and `(pointer: none)` there and
  // mouse-only features (the card spotlight) would be off only in CI.
  // (Blink values: pointer fine = 4, hover = 2.)
  args.push(
    '--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2',
  );
  // Extra Chromium flags for debugging; they win over the defaults above, e.g. to
  // mimic a machine without a mouse:
  // E2E_BROWSER_ARGS="--blink-settings=primaryPointerType=1,primaryHoverType=1"
  if (process.env.E2E_BROWSER_ARGS) args.push(...process.env.E2E_BROWSER_ARGS.split(' '));
  return puppeteer.launch({ executablePath: findBrowser(), headless: true, args });
}

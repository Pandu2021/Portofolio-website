/**
 * @file auth.service.ts
 * MOCK sign-in for the demo. There is no server and no real account: the
 * demo credentials are shown on the login screen on purpose. The session
 * lives in sessionStorage (cleared when the tab closes) and is validated
 * when read, because storage is user-controlled input.
 */
import { Injectable, computed, signal } from '@angular/core';

/** Public demo account (intentionally visible — NOT a secret). */
export const DEMO_ACCOUNT = {
  username: 'demo',
  password: 'portfolio-demo',
  displayName: 'Demo Admin',
} as const;

/** sessionStorage key of the demo session. */
export const SESSION_KEY = 'dashboard-session';

/** A signed-in demo session. */
export interface Session {
  username: string;
  displayName: string;
  /** ISO timestamp. */
  startedAt: string;
}

/** Reads and validates the stored session; anything unexpected = signed out. */
export function readSession(
  storage: Storage | undefined = globalThis.sessionStorage,
): Session | null {
  try {
    const raw: unknown = JSON.parse(storage?.getItem(SESSION_KEY) ?? 'null');
    if (raw === null || typeof raw !== 'object') return null;
    const { username, displayName, startedAt } = raw as Record<string, unknown>;
    if (
      username === DEMO_ACCOUNT.username &&
      displayName === DEMO_ACCOUNT.displayName &&
      typeof startedAt === 'string' &&
      !Number.isNaN(Date.parse(startedAt))
    ) {
      return { username, displayName, startedAt };
    }
  } catch {
    // Malformed JSON or blocked storage.
  }
  return null;
}

/**
 * Only allows same-app paths as a post-login destination (prevents open
 * redirects such as `//evil.example` or `https://…`).
 */
export function safeReturnUrl(value: unknown, fallback = '/overview'): string {
  if (typeof value !== 'string' || value.length > 200) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  if (/^\/+[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('/login')) return fallback;
  return value;
}

/** Demo authentication state. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Current session, or `null` when signed out. */
  readonly session = signal<Session | null>(readSession());
  readonly isSignedIn = computed(() => this.session() !== null);

  /**
   * Signs in with the demo account.
   * @returns `true` when the credentials match the public demo values.
   */
  signIn(username: string, password: string): boolean {
    const ok =
      username.trim().toLowerCase() === DEMO_ACCOUNT.username && password === DEMO_ACCOUNT.password;
    if (!ok) return false;
    const session: Session = {
      username: DEMO_ACCOUNT.username,
      displayName: DEMO_ACCOUNT.displayName,
      startedAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Storage blocked: the session lasts until reload.
    }
    this.session.set(session);
    return true;
  }

  /** Ends the demo session. */
  signOut(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clean up.
    }
    this.session.set(null);
  }
}

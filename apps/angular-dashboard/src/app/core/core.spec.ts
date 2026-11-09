/**
 * @file core.spec.ts
 * Core services: demo auth (session validation, open-redirect protection,
 * guards) and i18n (language switch, <html lang>, persistence).
 */
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';
import {
  AuthService,
  DEMO_ACCOUNT,
  readSession,
  safeReturnUrl,
  SESSION_KEY,
} from './auth/auth.service';
import { I18nService, LOCALE_STORAGE_KEY } from './i18n/i18n.service';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
});

describe('AuthService', () => {
  it('accepts only the public demo credentials', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.signIn('demo', 'wrong')).toBe(false);
    expect(auth.isSignedIn()).toBe(false);
    expect(auth.signIn('  DEMO ', DEMO_ACCOUNT.password)).toBe(true);
    expect(auth.isSignedIn()).toBe(true);
    expect(readSession()?.displayName).toBe(DEMO_ACCOUNT.displayName);
    auth.signOut();
    expect(auth.isSignedIn()).toBe(false);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('ignores tampered or malformed sessions', () => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username: 'admin', displayName: 'x', startedAt: 'now' }),
    );
    expect(readSession()).toBeNull();
    sessionStorage.setItem(SESSION_KEY, '{oops');
    expect(readSession()).toBeNull();
  });
});

describe('safeReturnUrl (open-redirect protection)', () => {
  it.each([
    ['/orders?status=paid', '/orders?status=paid'],
    ['//evil.example', '/overview'],
    ['https://evil.example', '/overview'],
    ['/\\evil.example', '/overview'],
    ['/javascript:alert(1)', '/overview'],
    ['/login', '/overview'],
    [42, '/overview'],
    [null, '/overview'],
  ])('%s → %s', (input, expected) => {
    expect(safeReturnUrl(input)).toBe(expected);
  });
});

describe('route guards', () => {
  const run = (guard: typeof authGuard, url = '/orders') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  it('redirects signed-out visitors to the login page with the return URL', () => {
    const result = run(authGuard) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Forders');
  });

  it('lets signed-in users through and keeps them off the login page', () => {
    TestBed.inject(AuthService).signIn(DEMO_ACCOUNT.username, DEMO_ACCOUNT.password);
    expect(run(authGuard)).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(run(guestGuard) as UrlTree)).toBe('/overview');
  });
});

describe('I18nService', () => {
  it('switches language, updates <html lang> and remembers the choice', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('id');
    TestBed.tick();
    expect(i18n.t().navOrders).toBe('Pesanan');
    expect(document.documentElement.lang).toBe('id-ID');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('id');
    expect(i18n.price(45_000)).toMatch(/Rp\s?45\.000/);
  });
});

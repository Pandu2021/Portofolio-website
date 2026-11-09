/**
 * @file features.spec.ts
 * Component tests: login, pricing settings form, orders table and chart.
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { AuthService, DEMO_ACCOUNT } from '../core/auth/auth.service';
import { DEFAULT_PRICING } from '../data/pricing';
import { PRICING_STORAGE_KEY, PricingSettingsService } from '../data/pricing-settings.service';
import { Chart, chartGeometry } from '../shared/chart';
import { LoginPage } from './login/login-page';
import { OrdersPage } from './orders/orders-page';
import { OrdersViewState } from './orders/orders-view-state';
import {
  freeDeliveryValidator,
  integerValidator,
  maxDecimalsValidator,
} from './settings/pricing-validators';
import { SettingsPage } from './settings/settings-page';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.lang = 'en';
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
});

/** Types into an input and lets Angular react. */
async function type(fixture: ComponentFixture<unknown>, selector: string, value: string) {
  const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`No element ${selector}`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await fixture.whenStable();
}

/** Clicks the first button whose text includes `text`. */
async function click(fixture: ComponentFixture<unknown>, text: string) {
  const root = fixture.nativeElement as HTMLElement;
  const button = [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(text));
  if (!button) throw new Error(`No button "${text}"`);
  button.click();
  await fixture.whenStable();
}

describe('LoginPage', () => {
  it('shows required errors, then a wrong-credentials alert', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    await click(fixture, 'Sign in');
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#login-username-error')?.textContent).toContain(
      'Username is required.',
    );
    expect(root.querySelector('#login-username')?.getAttribute('aria-invalid')).toBe('true');

    await type(fixture, '#login-username', 'demo');
    await type(fixture, '#login-password', 'nope');
    await click(fixture, 'Sign in');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('incorrect');
  });

  it('signs in with the demo credentials and navigates', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    await type(fixture, '#login-username', DEMO_ACCOUNT.username);
    await type(fixture, '#login-password', DEMO_ACCOUNT.password);
    await click(fixture, 'Sign in');
    expect(TestBed.inject(AuthService).isSignedIn()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/overview');
  });
});

describe('pricing validators', () => {
  it('check integers, decimals and the free-delivery rule', () => {
    expect(integerValidator(new FormControl(1.5))).toEqual({ integer: true });
    expect(integerValidator(new FormControl(1000))).toBeNull();
    expect(maxDecimalsValidator(2)(new FormControl(11.125))).toEqual({ decimals: true });
    expect(maxDecimalsValidator(2)(new FormControl(11.25))).toBeNull();
    const group = (fee: number, free: number) =>
      new FormGroup({ deliveryFee: new FormControl(fee), freeDeliveryFrom: new FormControl(free) });
    expect(freeDeliveryValidator(group(10_000, 5_000))).toEqual({ freeBelowFee: true });
    expect(freeDeliveryValidator(group(10_000, 0))).toBeNull();
    expect(freeDeliveryValidator(group(10_000, 50_000))).toBeNull();
  });
});

describe('SettingsPage', () => {
  it('rejects invalid values with accessible errors and does not save', async () => {
    const fixture = TestBed.createComponent(SettingsPage);
    await fixture.whenStable();
    await type(fixture, '#pricing-taxPercent', '40');
    await type(fixture, '#pricing-freeDeliveryFrom', '5000');
    await click(fixture, 'Save settings');

    const root = fixture.nativeElement as HTMLElement;
    const tax = root.querySelector('#pricing-taxPercent');
    expect(tax?.getAttribute('aria-invalid')).toBe('true');
    expect(tax?.getAttribute('aria-describedby')).toContain('pricing-taxPercent-error');
    expect(root.querySelector('#pricing-taxPercent-error')?.textContent).toContain(
      'between 0 and 25',
    );
    expect(root.querySelector('#pricing-freeDeliveryFrom-error')?.textContent).toContain(
      'higher than the delivery fee',
    );
    expect(localStorage.getItem(PRICING_STORAGE_KEY)).toBeNull();
  });

  it('saves valid values and updates the preview', async () => {
    const fixture = TestBed.createComponent(SettingsPage);
    await fixture.whenStable();
    await type(fixture, '#pricing-taxPercent', '10');
    await click(fixture, 'Save settings');
    expect(TestBed.inject(PricingSettingsService).settings()).toEqual({
      ...DEFAULT_PRICING,
      taxPercent: 10,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Settings saved.');
  });
});

describe('OrdersPage', () => {
  it('shows a page of 10 orders and filters by status', async () => {
    TestBed.inject(OrdersViewState).clear();
    const fixture = TestBed.createComponent(OrdersPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('tbody tr')).toHaveLength(10);
    expect(root.querySelector('caption')?.textContent).toContain('64 results');

    const status = root.querySelector<HTMLSelectElement>('#orders-status');
    if (!status) throw new Error('no status filter');
    status.value = 'cancelled';
    status.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    for (const badge of root.querySelectorAll('tbody .status')) {
      expect(badge.textContent?.trim()).toBe('Cancelled');
    }
  });

  it('pages forward and toggles the live feed button state', async () => {
    TestBed.inject(OrdersViewState).clear();
    const fixture = TestBed.createComponent(OrdersPage);
    await fixture.whenStable();
    await click(fixture, 'Next');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.pager__info')?.textContent,
    ).toContain('Page 2 of 7');

    await click(fixture, 'Start live orders');
    const live = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Pause live orders'),
    );
    expect(live?.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Chart', () => {
  const points = [
    { label: 'Mon', value: 10, display: '10' },
    { label: 'Tue', value: 40, display: '40' },
  ];

  it('scales bars to the highest value', () => {
    const [low, high] = chartGeometry(points);
    expect(high?.barHeight).toBeGreaterThan(low?.barHeight ?? 0);
    expect((low?.barHeight ?? 0) / (high?.barHeight ?? 1)).toBeCloseTo(0.25);
  });

  it('is labelled for screen readers and includes a data table', async () => {
    const fixture = TestBed.createComponent(Chart);
    fixture.componentRef.setInput('title', 'Revenue per day');
    fixture.componentRef.setInput('points', points);
    fixture.componentRef.setInput('summary', 'Highest: Tue, 40.');
    fixture.componentRef.setInput('tableToggle', 'Show the data as a table');
    fixture.componentRef.setInput('labelHeader', 'Day');
    fixture.componentRef.setInput('valueHeader', 'Revenue');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    const [titleId, descId] = (svg?.getAttribute('aria-labelledby') ?? '').split(' ');
    expect(root.querySelector(`#${titleId}`)?.textContent).toContain('Revenue per day');
    expect(root.querySelector(`#${descId}`)?.textContent).toContain('Highest: Tue, 40.');
    expect(root.querySelectorAll('rect.chart__bar')).toHaveLength(2);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
  });
});

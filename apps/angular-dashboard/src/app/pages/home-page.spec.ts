/**
 * @file home-page.spec.ts
 * Smoke tests for the placeholder dashboard page.
 */
import { TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomePage] }).compileComponents();
  });

  it('renders the dashboard heading', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Admin dashboard demo');
  });

  it('links back to the portfolio', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('../');
  });
});

/**
 * @file home-page.ts
 * Dashboard landing page (Phase 1 placeholder; the dashboard is built in Phase 5).
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Placeholder page that proves Signals-based rendering works. */
@Component({
  selector: 'app-home-page',
  template: `
    <main id="main" class="page">
      <h1>{{ title() }}</h1>
      <p>Angular + Signals + RxJS. Orders, finance and charts are coming soon.</p>
      <p><a href="../">← Back to portfolio</a></p>
    </main>
  `,
  styles: `
    .page {
      max-width: 48rem;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  /** Page heading, stored as a signal. */
  protected readonly title = signal('Admin dashboard demo');
}

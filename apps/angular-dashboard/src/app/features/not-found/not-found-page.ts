/**
 * @file not-found-page.ts
 * Shown for unknown hash routes such as `#/nowhere`.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <h1>{{ t().notFoundTitle }}</h1>
      <a routerLink="/overview" class="btn btn--primary">{{ t().goToOverview }}</a>
    </div>
  `,
})
export class NotFoundPage {
  protected readonly t = inject(I18nService).t;
}

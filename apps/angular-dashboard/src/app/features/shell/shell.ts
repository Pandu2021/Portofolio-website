/**
 * @file shell.ts
 * Page frame for every route: skip link, demo notice, header (navigation,
 * language, theme, session), main outlet, footer and the polite live region.
 * Also keeps the browser tab title in the current language.
 */
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AnnouncerService } from '../../core/a11y/announcer.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LOCALES, LOCALE_TAG, type Messages } from '../../core/i18n/messages';
import { ThemeService } from '../../core/theme/theme.service';

/** Message keys that can be used as page titles (`route.data.titleKey`). */
export type TitleKey = {
  [K in keyof Messages]: Messages[K] extends string ? K : never;
}[keyof Messages];

const REPO_URL = 'https://github.com/Pandu2021/Portofolio-website/tree/main/apps/angular-dashboard';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#main" class="skip-link" (click)="skipToMain($event)">{{ t().skipToContent }}</a>
    <p class="demo-banner">{{ t().demoBanner }}</p>

    <header class="header">
      <div class="container header__inner">
        <a routerLink="/overview" class="brand">
          <span class="brand__mark" aria-hidden="true">OD</span>
          {{ t().brand }}
        </a>

        @if (auth.isSignedIn()) {
          <nav class="header__nav" [attr.aria-label]="t().mainNav">
            <a
              routerLink="/overview"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              class="nav-link"
            >
              {{ t().navOverview }}
            </a>
            <a
              routerLink="/orders"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              class="nav-link"
            >
              {{ t().navOrders }}
            </a>
            <a
              routerLink="/settings"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              class="nav-link"
            >
              {{ t().navSettings }}
            </a>
          </nav>
        }

        <div class="header__controls">
          <div class="lang-switch" role="group" [attr.aria-label]="t().languageLabel">
            @for (option of locales; track option) {
              <button
                type="button"
                class="lang-switch__button"
                [attr.lang]="localeTag[option]"
                [attr.aria-pressed]="option === i18n.locale()"
                (click)="i18n.setLocale(option)"
              >
                {{ option.toUpperCase() }}<span class="sr-only"> — {{ localeName[option] }}</span>
              </button>
            }
          </div>

          <button
            type="button"
            class="icon-button"
            (click)="theme.cycle()"
            [attr.aria-label]="themeLabel()"
            [attr.title]="themeLabel()"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              @switch (theme.preference()) {
                @case ('light') {
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                  />
                }
                @case ('dark') {
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                }
                @default {
                  <rect x="2" y="4" width="20" height="13" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                }
              }
            </svg>
          </button>

          @if (auth.session(); as session) {
            <span class="header__user">{{ t().signedInAs(session.displayName) }}</span>
            <button type="button" class="btn btn--ghost btn--sm" (click)="signOut()">
              {{ t().signOut }}
            </button>
          }
        </div>
      </div>
    </header>

    <main id="main" tabindex="-1" class="container main">
      <router-outlet />
    </main>

    <footer class="footer">
      <div class="container footer__inner">
        <a [href]="portfolioHref()" class="link-strong">← {{ t().backToPortfolio }}</a>
        <p>{{ t().footerNote }}</p>
        <a [href]="repoUrl" target="_blank" rel="noopener noreferrer" class="link-muted">
          {{ t().sourceCode }} ↗<span class="sr-only"> {{ t().opensInNewTab }}</span>
        </a>
      </div>
    </footer>

    <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
      {{ announcer.message() }}
    </div>
  `,
})
export class Shell {
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  protected readonly announcer = inject(AnnouncerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  protected readonly t = this.i18n.t;
  protected readonly locales = LOCALES;
  protected readonly localeTag = LOCALE_TAG;
  protected readonly localeName = { en: 'English', id: 'Bahasa Indonesia' } as const;
  protected readonly repoUrl = REPO_URL;

  /** The portfolio lives one level up: …/ (EN) or …/id/ (ID). */
  protected readonly portfolioHref = computed(() =>
    this.i18n.locale() === 'id' ? '../id/' : '../',
  );

  protected readonly themeLabel = computed(() => {
    const t = this.t();
    const name = { light: t.themeLight, dark: t.themeDark, system: t.themeSystem }[
      this.theme.preference()
    ];
    return `${t.themeToggle}: ${name}`;
  });

  /** `data.titleKey` of the deepest active route, updated on every navigation. */
  private readonly titleKey = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        let route = this.route.snapshot;
        while (route.firstChild) route = route.firstChild;
        return (route.data['titleKey'] as TitleKey | undefined) ?? 'navOverview';
      }),
    ),
    { initialValue: 'navOverview' as TitleKey },
  );

  constructor() {
    // Localized tab title; also updates when the language changes.
    effect(() => this.title.setTitle(`${this.t()[this.titleKey()]} · ${this.t().brand}`));
  }

  /**
   * Hash routing uses the URL fragment for routes, so a plain `#main` link
   * would navigate. Move focus to the main landmark instead.
   */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main')?.focus();
  }

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigate(['/login']);
  }
}

/**
 * @file login-page.ts
 * Mock sign-in with a typed Reactive Form. The demo credentials are shown on
 * screen; errors are linked to their fields and announced (role="alert").
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, DEMO_ACCOUNT, safeReturnUrl } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="login card" aria-labelledby="login-title">
      <h1 id="login-title">{{ t().loginTitle }}</h1>
      <p class="hint">{{ t().loginIntro }}</p>

      <div class="callout">
        <p class="callout__title">{{ t().demoCredentials }}</p>
        <p>
          {{ t().usernameLabel }}: <code>{{ demo.username }}</code> · {{ t().passwordLabel }}:
          <code>{{ demo.password }}</code>
        </p>
        <p class="hint">{{ t().demoCredentialsNote }}</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="form">
        @if (failed()) {
          <p #errorBox class="error-summary" role="alert" tabindex="-1">{{ t().loginError }}</p>
        }

        <div class="field">
          <label for="login-username" class="field-label">{{ t().usernameLabel }}</label>
          <input
            id="login-username"
            class="input"
            formControlName="username"
            autocomplete="username"
            maxlength="40"
            [attr.aria-invalid]="showError('username') || null"
            [attr.aria-describedby]="showError('username') ? 'login-username-error' : null"
          />
          @if (showError('username')) {
            <p id="login-username-error" class="field-error">
              {{ t().fieldRequired(t().usernameLabel) }}
            </p>
          }
        </div>

        <div class="field">
          <label for="login-password" class="field-label">{{ t().passwordLabel }}</label>
          <input
            id="login-password"
            class="input"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            maxlength="80"
            [attr.aria-invalid]="showError('password') || null"
            [attr.aria-describedby]="showError('password') ? 'login-password-error' : null"
          />
          @if (showError('password')) {
            <p id="login-password-error" class="field-error">
              {{ t().fieldRequired(t().passwordLabel) }}
            </p>
          }
        </div>

        <button type="submit" class="btn btn--primary btn--block">{{ t().signIn }}</button>
        <p class="hint">{{ t().sessionNote }}</p>
      </form>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly t = inject(I18nService).t;
  protected readonly demo = DEMO_ACCOUNT;

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });
  protected readonly submitted = signal(false);
  protected readonly failed = signal(false);
  private readonly errorBox = viewChild<ElementRef<HTMLElement>>('errorBox');

  /** Show a field's "required" error only after a submit attempt. */
  protected showError(field: 'username' | 'password'): boolean {
    return this.submitted() && this.form.controls[field].invalid;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.failed.set(false);
    if (this.form.invalid) return;
    const { username, password } = this.form.getRawValue();
    if (this.auth.signIn(username, password)) {
      const target = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      void this.router.navigateByUrl(target);
      return;
    }
    this.failed.set(true);
    this.form.controls.password.reset();
    // Wait for the alert to render, then move focus to it.
    setTimeout(() => this.errorBox()?.nativeElement.focus());
  }
}

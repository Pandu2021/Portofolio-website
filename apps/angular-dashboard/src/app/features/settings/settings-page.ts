/**
 * @file settings-page.ts
 * Pricing settings form (typed Reactive Forms): range, integer and decimal
 * validators, a cross-field rule, accessible errors, a live preview of an
 * example order, and save / reset.
 */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnnouncerService } from '../../core/a11y/announcer.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  DEFAULT_PRICING,
  PRICING_LIMITS,
  priceOrder,
  type PricingSettings,
} from '../../data/pricing';
import { PricingSettingsService } from '../../data/pricing-settings.service';
import {
  freeDeliveryValidator,
  integerValidator,
  maxDecimalsValidator,
} from './pricing-validators';

type Field = keyof PricingSettings;

/** A real, finite number (rejects null from empty inputs and NaN). */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Order used in the live preview. */
const EXAMPLE_SUBTOTAL = 100_000;

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <h1>{{ t().settingsTitle }}</h1>
      <p class="page-head__intro">{{ t().settingsIntro }}</p>
    </header>

    <div class="detail-grid">
      <form [formGroup]="form" (ngSubmit)="save()" novalidate class="card form">
        @for (field of fields; track field.key) {
          <div class="field">
            <label [for]="'pricing-' + field.key" class="field-label">{{ field.label() }}</label>
            <input
              [id]="'pricing-' + field.key"
              class="input"
              type="number"
              inputmode="decimal"
              [step]="field.step"
              [formControlName]="field.key"
              [attr.aria-invalid]="errorFor(field.key) ? true : null"
              [attr.aria-describedby]="
                'pricing-' +
                field.key +
                '-hint' +
                (errorFor(field.key) ? ' pricing-' + field.key + '-error' : '')
              "
            />
            <p [id]="'pricing-' + field.key + '-hint'" class="hint">{{ field.hint() }}</p>
            @if (errorFor(field.key); as message) {
              <p [id]="'pricing-' + field.key + '-error'" class="field-error">{{ message }}</p>
            }
          </div>
        }

        <div class="form__actions">
          <button type="submit" class="btn btn--primary">{{ t().save }}</button>
          <button type="button" class="btn btn--ghost" (click)="reset()">
            {{ t().resetDefaults }}
          </button>
        </div>
        @if (savedAt()) {
          <p class="success" role="status">{{ t().saved }}</p>
        }
      </form>

      <aside class="card" aria-labelledby="preview-title">
        <h2 id="preview-title" class="card__title">{{ t().previewTitle }}</h2>
        @if (preview(); as amounts) {
          <dl class="summary">
            <div>
              <dt>{{ t().subtotal }}</dt>
              <dd>{{ i18n.price(amounts.subtotal) }}</dd>
            </div>
            <div>
              <dt>{{ t().tax }}</dt>
              <dd>{{ i18n.price(amounts.tax) }}</dd>
            </div>
            <div>
              <dt>{{ t().delivery }}</dt>
              <dd>{{ amounts.delivery === 0 ? t().free : i18n.price(amounts.delivery) }}</dd>
            </div>
            <div class="summary__total">
              <dt>{{ t().total }}</dt>
              <dd>{{ i18n.price(amounts.total) }}</dd>
            </div>
          </dl>
        } @else {
          <p class="hint">{{ t().previewInvalid }}</p>
        }
      </aside>
    </div>
  `,
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);
  private readonly pricing = inject(PricingSettingsService);
  private readonly announcer = inject(AnnouncerService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly t = this.i18n.t;

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      taxPercent: [
        this.pricing.settings().taxPercent as number | null,
        [
          Validators.required,
          Validators.min(PRICING_LIMITS.taxPercent.min),
          Validators.max(PRICING_LIMITS.taxPercent.max),
          maxDecimalsValidator(2),
        ],
      ],
      deliveryFee: [
        this.pricing.settings().deliveryFee as number | null,
        [
          Validators.required,
          Validators.min(PRICING_LIMITS.deliveryFee.min),
          Validators.max(PRICING_LIMITS.deliveryFee.max),
          integerValidator,
        ],
      ],
      freeDeliveryFrom: [
        this.pricing.settings().freeDeliveryFrom as number | null,
        [
          Validators.required,
          Validators.min(PRICING_LIMITS.freeDeliveryFrom.min),
          Validators.max(PRICING_LIMITS.freeDeliveryFrom.max),
          integerValidator,
        ],
      ],
    },
    { validators: freeDeliveryValidator },
  );

  protected readonly fields = [
    {
      key: 'taxPercent' as const,
      step: '0.01',
      label: () => this.t().taxLabel,
      hint: () => this.t().taxHint,
    },
    {
      key: 'deliveryFee' as const,
      step: '1000',
      label: () => this.t().deliveryLabel,
      hint: () => this.t().deliveryHint,
    },
    {
      key: 'freeDeliveryFrom' as const,
      step: '1000',
      label: () => this.t().freeDeliveryLabel,
      hint: () => this.t().freeDeliveryHint,
    },
  ];

  protected readonly submitted = signal(false);
  protected readonly savedAt = signal<number | null>(null);
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  /** Statuses as a signal so errors re-render under OnPush + zoneless. */
  private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** Example order priced with the values currently typed (if valid). */
  protected readonly preview = computed(() => {
    this.status();
    const { taxPercent, deliveryFee, freeDeliveryFrom } = this.value();
    if (
      this.form.invalid ||
      !isNumber(taxPercent) ||
      !isNumber(deliveryFee) ||
      !isNumber(freeDeliveryFrom)
    ) {
      return null;
    }
    return priceOrder(EXAMPLE_SUBTOTAL, { taxPercent, deliveryFee, freeDeliveryFrom });
  });

  /** Localized error for a field, shown after a submit attempt or once the field was touched. */
  protected errorFor(field: Field): string | null {
    this.status();
    const control = this.form.controls[field];
    if (!this.submitted() && !control.touched) return null;
    const t = this.t();
    const limits = PRICING_LIMITS[field];
    const range = t.errorRange(this.i18n.number(limits.min), this.i18n.number(limits.max));
    if (control.hasError('required')) return t.fieldRequired(this.labelOf(field));
    if (control.hasError('min') || control.hasError('max')) return range;
    if (control.hasError('integer')) return t.errorInteger;
    if (control.hasError('decimals')) return t.errorDecimals;
    if (field === 'freeDeliveryFrom' && this.form.hasError('freeBelowFee'))
      return t.errorFreeBelowFee;
    return null;
  }

  protected save(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.savedAt.set(null);
    const { taxPercent, deliveryFee, freeDeliveryFrom } = this.form.getRawValue();
    if (
      this.form.invalid ||
      !isNumber(taxPercent) ||
      !isNumber(deliveryFee) ||
      !isNumber(freeDeliveryFrom) ||
      !this.pricing.save({ taxPercent, deliveryFee, freeDeliveryFrom })
    ) {
      // Move focus to the first invalid field (WCAG 3.3.1).
      setTimeout(() =>
        this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    this.savedAt.set(Date.now());
    this.announcer.announce(this.t().saved);
  }

  protected reset(): void {
    this.pricing.reset();
    this.form.reset({ ...DEFAULT_PRICING });
    this.submitted.set(false);
    this.savedAt.set(null);
  }

  private labelOf(field: Field): string {
    return {
      taxPercent: this.t().taxLabel,
      deliveryFee: this.t().deliveryLabel,
      freeDeliveryFrom: this.t().freeDeliveryLabel,
    }[field];
  }
}

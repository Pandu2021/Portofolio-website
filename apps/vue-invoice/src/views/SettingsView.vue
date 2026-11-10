<script setup lang="ts">
/**
 * @file SettingsView.vue
 * Defaults for new invoices (tax, service fee, tax mode, rounding), the
 * display currency, and "Reset demo data" behind a confirmation dialog.
 */
import { computed, nextTick, ref } from 'vue';
import { announce } from '../a11y/announcer';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useI18n } from '../i18n/useI18n';
import { DEMO_USD_RATE } from '../lib/format';
import type { DisplayCurrency } from '../lib/invoice';
import { parseDecimal } from '../lib/invoiceForm';
import { percentToBp, type RoundingStep, type TaxMode } from '../lib/pricing';
import { useInvoiceStore } from '../stores/invoices';

const store = useInvoiceStore();
const { t, money } = useI18n();

const plain = (bp: number) => String(bp / 100);
const taxRate = ref(plain(store.settings.pricing.taxRateBp));
const serviceFee = ref(plain(store.settings.pricing.serviceFeeBp));
const taxMode = ref<TaxMode>(store.settings.pricing.taxMode);
const roundingStep = ref<RoundingStep>(store.settings.pricing.roundingStep);
const currency = ref<DisplayCurrency>(store.settings.currency);
const submitted = ref(false);
const confirmReset = ref(false);

const taxBp = computed(() => percentToBp(parseDecimal(taxRate.value)));
const feeBp = computed(() => percentToBp(parseDecimal(serviceFee.value)));
const taxError = computed(() =>
  submitted.value && !(Number.isSafeInteger(taxBp.value) && taxBp.value <= 5_000)
    ? t.value.errors.taxRateRange
    : '',
);
const feeError = computed(() =>
  submitted.value && !(Number.isSafeInteger(feeBp.value) && feeBp.value <= 3_000)
    ? t.value.errors.serviceFeeRange
    : '',
);

async function save(): Promise<void> {
  submitted.value = true;
  await nextTick();
  if (taxError.value || feeError.value) {
    document.getElementById(taxError.value ? 'settings-tax' : 'settings-fee')?.focus();
    return;
  }
  store.updateSettings({
    pricing: {
      taxRateBp: taxBp.value,
      serviceFeeBp: feeBp.value,
      taxMode: taxMode.value,
      roundingStep: roundingStep.value,
    },
    currency: currency.value,
  });
  announce(t.value.announceSettingsSaved);
}

function reset(): void {
  confirmReset.value = false;
  store.resetDemo();
  taxRate.value = plain(store.settings.pricing.taxRateBp);
  serviceFee.value = plain(store.settings.pricing.serviceFeeBp);
  taxMode.value = store.settings.pricing.taxMode;
  roundingStep.value = store.settings.pricing.roundingStep;
  currency.value = store.settings.currency;
  announce(t.value.announceReset);
}
</script>

<template>
  <section aria-labelledby="settings-title">
    <div class="page-head">
      <h1 id="settings-title" tabindex="-1">{{ t.settingsTitle }}</h1>
      <p class="page-head__intro">{{ t.settingsIntro }}</p>
    </div>

    <form class="settings" novalidate @submit.prevent="save">
      <fieldset class="card panel">
        <legend class="panel__legend">{{ t.defaultsLegend }}</legend>
        <div class="grid grid--2">
          <div class="field">
            <label for="settings-tax" class="field-label">{{ t.taxRate }}</label>
            <input
              id="settings-tax"
              v-model="taxRate"
              class="input num"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="Boolean(taxError)"
              :aria-describedby="taxError ? 'settings-tax-error' : undefined"
            />
            <p v-if="taxError" id="settings-tax-error" class="field-error">{{ taxError }}</p>
          </div>
          <div class="field">
            <label for="settings-fee" class="field-label">{{ t.serviceFee }}</label>
            <input
              id="settings-fee"
              v-model="serviceFee"
              class="input num"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="Boolean(feeError)"
              :aria-describedby="feeError ? 'settings-fee-error' : undefined"
            />
            <p v-if="feeError" id="settings-fee-error" class="field-error">{{ feeError }}</p>
          </div>
          <fieldset class="field">
            <legend class="field-label">{{ t.taxMode }}</legend>
            <label class="radio">
              <input v-model="taxMode" type="radio" name="default-tax-mode" value="exclusive" />
              {{ t.taxExclusive }}
            </label>
            <label class="radio">
              <input v-model="taxMode" type="radio" name="default-tax-mode" value="inclusive" />
              {{ t.taxInclusive }}
            </label>
          </fieldset>
          <fieldset class="field">
            <legend class="field-label">{{ t.rounding }}</legend>
            <div class="radio-row">
              <label class="radio">
                <input v-model="roundingStep" type="radio" name="default-rounding" :value="1" />
                {{ t.roundTo1 }}
              </label>
              <label class="radio">
                <input v-model="roundingStep" type="radio" name="default-rounding" :value="100" />
                {{ t.roundTo100 }}
              </label>
            </div>
          </fieldset>
        </div>
      </fieldset>

      <fieldset class="card panel">
        <legend class="panel__legend">{{ t.currency }}</legend>
        <label class="radio">
          <input v-model="currency" type="radio" name="currency" value="IDR" />
          {{ t.currencyIdr }}
        </label>
        <label class="radio">
          <input
            v-model="currency"
            type="radio"
            name="currency"
            value="USD"
            aria-describedby="usd-note"
          />
          {{ t.currencyUsd }}
        </label>
        <p id="usd-note" class="hint">{{ t.demoRateNote(money(DEMO_USD_RATE * 100)) }}</p>
      </fieldset>

      <div>
        <button type="submit" class="btn btn--primary">{{ t.saveSettings }}</button>
      </div>
    </form>

    <section class="card panel danger-zone" aria-labelledby="reset-title">
      <h2 id="reset-title" class="panel__legend">{{ t.resetTitle }}</h2>
      <p>{{ t.resetText }}</p>
      <button type="button" class="btn btn--secondary" @click="confirmReset = true">
        {{ t.resetButton }}
      </button>
    </section>

    <ConfirmDialog
      :open="confirmReset"
      :title="t.resetConfirmTitle"
      :text="t.resetConfirmText"
      :confirm-label="t.resetConfirm"
      :cancel-label="t.cancel"
      @confirm="reset"
      @cancel="confirmReset = false"
    />
  </section>
</template>

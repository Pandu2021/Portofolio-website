<script setup lang="ts">
/**
 * @file TotalsTable.vue
 * The totals of one invoice as a real table (caption + row headers), in the
 * order they are calculated. Used by the editor (live) and the print view.
 */
import { computed } from 'vue';
import { useI18n } from '../i18n/useI18n';
import type { DisplayCurrency } from '../lib/invoice';
import type { PricingSettings, Totals } from '../lib/pricing';

const props = defineProps<{
  totals: Totals | null;
  pricing: PricingSettings;
  currency: DisplayCurrency;
  /** Visually hide the caption (the editor shows its own heading). */
  hideCaption?: boolean;
}>();

const { t, money, percent } = useI18n();
const show = (amount: number) => money(amount, props.currency);
const negative = (amount: number) => (amount > 0 ? `− ${show(amount)}` : show(0));
const inclusive = computed(() => props.pricing.taxMode === 'inclusive');
</script>

<template>
  <div class="totals">
    <table v-if="totals" class="totals__table">
      <caption :class="{ 'sr-only': hideCaption }">
        {{
          t.totalsTitle
        }}
      </caption>
      <tbody>
        <tr>
          <th scope="row">{{ t.subtotal }}</th>
          <td>{{ show(totals.subtotal) }}</td>
        </tr>
        <tr v-if="totals.discount > 0">
          <th scope="row">{{ t.discountRow }}</th>
          <td>{{ negative(totals.discount) }}</td>
        </tr>
        <tr v-if="pricing.serviceFeeBp > 0">
          <th scope="row">{{ t.serviceFeeRow(percent(pricing.serviceFeeBp)) }}</th>
          <td>{{ show(totals.serviceFee) }}</td>
        </tr>
        <tr v-if="inclusive">
          <th scope="row">{{ t.netRow }}</th>
          <td>{{ show(totals.taxBase) }}</td>
        </tr>
        <tr>
          <th scope="row">
            {{
              inclusive
                ? t.taxIncludedRow(percent(pricing.taxRateBp))
                : t.taxRow(percent(pricing.taxRateBp))
            }}
          </th>
          <td>{{ show(totals.tax) }}</td>
        </tr>
        <tr v-if="totals.rounding !== 0">
          <th scope="row">{{ t.roundingRow }}</th>
          <td>{{ totals.rounding < 0 ? negative(-totals.rounding) : show(totals.rounding) }}</td>
        </tr>
        <tr class="totals__grand">
          <th scope="row">{{ t.totalRow }}</th>
          <td data-testid="grand-total">{{ show(totals.total) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="hint">{{ t.totalsUnavailable }}</p>
    <p v-if="totals?.discountCapped" class="hint">{{ t.discountCapped }}</p>
    <p v-if="currency === 'USD'" class="hint">{{ t.usdNote }}</p>
  </div>
</template>

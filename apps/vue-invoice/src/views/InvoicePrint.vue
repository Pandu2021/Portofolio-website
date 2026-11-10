<script setup lang="ts">
/**
 * @file InvoicePrint.vue
 * Print-friendly invoice. "Print / Save as PDF" uses the browser's own print
 * dialog (window.print) — no PDF library; the print stylesheet hides the app
 * chrome and prints black on white.
 */
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import TotalsTable from '../components/TotalsTable.vue';
import { useI18n } from '../i18n/useI18n';
import { useInvoiceStore } from '../stores/invoices';

const props = defineProps<{ id: string }>();
const store = useInvoiceStore();
const { t, money, percent, date } = useI18n();

const invoice = computed(() => store.byId(props.id));
const totals = computed(() => (invoice.value ? store.totalsOf(invoice.value) : null));
const currency = computed(() => store.settings.currency);

function print(): void {
  window.print();
}
</script>

<template>
  <section v-if="!invoice" class="card empty" aria-labelledby="print-title">
    <h1 id="print-title" tabindex="-1">{{ t.notFoundTitle }}</h1>
    <p>{{ t.invoiceNotFound }}</p>
    <RouterLink to="/invoices" class="btn btn--primary">{{ t.goToInvoices }}</RouterLink>
  </section>

  <section v-else aria-labelledby="print-title">
    <div class="print-toolbar no-print">
      <RouterLink :to="{ name: 'edit', params: { id: invoice.id } }" class="link-strong">
        <AppIcon name="arrowLeft" :size="16" />
        {{ t.backToInvoice }}
      </RouterLink>
      <button type="button" class="btn btn--primary" @click="print">
        <AppIcon name="printer" />
        {{ t.printButton }}
      </button>
    </div>

    <article class="card sheet">
      <header class="sheet__head">
        <div>
          <p class="sheet__seller">{{ t.seller }}</p>
          <h1 id="print-title" tabindex="-1" class="sheet__title">
            {{ t.invoiceHeading }} <span class="mono">{{ invoice.number }}</span>
          </h1>
        </div>
        <dl class="sheet__meta">
          <div>
            <dt>{{ t.issued }}</dt>
            <dd>{{ date(invoice.issueDate) }}</dd>
          </div>
          <div>
            <dt>{{ t.due }}</dt>
            <dd>{{ date(invoice.dueDate) }}</dd>
          </div>
          <div>
            <dt>{{ t.statusLabel }}</dt>
            <dd>{{ t.status[invoice.status] }}</dd>
          </div>
        </dl>
      </header>

      <div class="sheet__bill">
        <h2 class="sheet__label">{{ t.billTo }}</h2>
        <p class="sheet__customer">{{ invoice.customer }}</p>
      </div>

      <div class="table-scroll" role="region" aria-labelledby="items-caption" tabindex="0">
        <table class="data-table sheet__items">
          <caption id="items-caption">
            {{
              t.itemsCaption
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ t.colDescription }}</th>
              <th scope="col" class="num">{{ t.colQty }}</th>
              <th scope="col" class="num">{{ t.colUnitPrice }}</th>
              <th scope="col" class="num">{{ t.colDiscount }}</th>
              <th scope="col" class="num">{{ t.colAmount }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in invoice.lines" :key="line.id">
              <th scope="row">{{ line.description }}</th>
              <td class="num">{{ line.quantity }}</td>
              <td class="num">{{ money(line.unitPrice, currency) }}</td>
              <td class="num">{{ line.discountBp > 0 ? percent(line.discountBp) : '—' }}</td>
              <td class="num">{{ money(totals?.lineTotals[index] ?? 0, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sheet__totals">
        <TotalsTable :totals="totals" :pricing="invoice.pricing" :currency="currency" />
      </div>

      <p v-if="invoice.notes" class="sheet__notes">{{ invoice.notes }}</p>
      <p class="sheet__demo">{{ t.demoDocument }}</p>
    </article>
  </section>
</template>

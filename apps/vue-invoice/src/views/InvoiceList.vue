<script setup lang="ts">
/**
 * @file InvoiceList.vue
 * All invoices with a status filter, inline status change, duplicate,
 * print and delete (with an accessible confirmation dialog).
 */
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { announce } from '../a11y/announcer';
import AppIcon from '../components/AppIcon.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useI18n } from '../i18n/useI18n';
import { INVOICE_STATUSES, type Invoice, type InvoiceStatus } from '../lib/invoice';
import { useInvoiceStore } from '../stores/invoices';

const store = useInvoiceStore();
const router = useRouter();
const { t, money, date } = useI18n();

const filter = ref<InvoiceStatus | 'all'>('all');
const shown = computed(() =>
  filter.value === 'all'
    ? store.invoices
    : store.invoices.filter((invoice) => invoice.status === filter.value),
);

const pendingDelete = ref<Invoice | null>(null);

function changeStatus(invoice: Invoice, event: Event): void {
  const status = (event.target as HTMLSelectElement).value as InvoiceStatus;
  store.setStatus(invoice.id, status);
  announce(t.value.announceStatus(invoice.number, t.value.status[status]));
}

async function duplicate(invoice: Invoice): Promise<void> {
  const copy = store.duplicate(invoice.id);
  if (!copy) return;
  announce(t.value.announceDuplicated(copy.number));
  await router.push({ name: 'edit', params: { id: copy.id } });
}

function confirmDelete(): void {
  const invoice = pendingDelete.value;
  pendingDelete.value = null;
  if (!invoice) return;
  store.remove(invoice.id);
  announce(t.value.announceDeleted(invoice.number));
}
</script>

<template>
  <section aria-labelledby="list-title">
    <div class="page-head">
      <h1 id="list-title" tabindex="-1">{{ t.listTitle }}</h1>
      <p class="page-head__intro">{{ t.listIntro }}</p>
    </div>

    <div class="toolbar">
      <div class="field field--inline">
        <label for="status-filter" class="field-label">{{ t.filterLabel }}</label>
        <select id="status-filter" v-model="filter" class="input input--select">
          <option value="all">{{ t.filterAll }}</option>
          <option v-for="status in INVOICE_STATUSES" :key="status" :value="status">
            {{ t.status[status] }}
          </option>
        </select>
      </div>
      <RouterLink to="/invoices/new" class="btn btn--primary">
        <AppIcon name="plus" :size="18" />
        {{ t.navNew }}
      </RouterLink>
    </div>

    <!--
      On small screens every row is shown as a card (CSS). The explicit ARIA
      table roles keep the table semantics for screen readers even when CSS
      changes the display type of table elements.
    -->
    <div v-if="shown.length > 0" class="invoice-list">
      <table class="data-table invoice-table" role="table" aria-labelledby="list-caption">
        <caption id="list-caption" class="sr-only">
          {{
            t.tableCaption(shown.length)
          }}
        </caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">{{ t.colNumber }}</th>
            <th scope="col" role="columnheader">{{ t.colCustomer }}</th>
            <th scope="col" role="columnheader" class="hide-md">{{ t.colIssued }}</th>
            <th scope="col" role="columnheader">{{ t.colDue }}</th>
            <th scope="col" role="columnheader">{{ t.colStatus }}</th>
            <th scope="col" role="columnheader" class="num">{{ t.colTotal }}</th>
            <th scope="col" role="columnheader">
              <span class="sr-only">{{ t.colActions }}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          <tr v-for="invoice in shown" :key="invoice.id" role="row" :data-invoice="invoice.number">
            <th scope="row" role="rowheader" class="cell-number">
              <RouterLink :to="{ name: 'edit', params: { id: invoice.id } }" class="mono">
                {{ invoice.number }}
              </RouterLink>
            </th>
            <td role="cell" class="cell-customer">{{ invoice.customer }}</td>
            <td role="cell" class="hide-md">{{ date(invoice.issueDate) }}</td>
            <td role="cell" class="cell-due">
              <span class="cell-label" aria-hidden="true">{{ t.colDue }}: </span
              >{{ date(invoice.dueDate) }}
            </td>
            <td role="cell" class="cell-status">
              <select
                class="input input--select input--compact"
                :data-status="invoice.status"
                :value="invoice.status"
                :aria-label="t.statusOf(invoice.number)"
                @change="changeStatus(invoice, $event)"
              >
                <option v-for="status in INVOICE_STATUSES" :key="status" :value="status">
                  {{ t.status[status] }}
                </option>
              </select>
            </td>
            <td role="cell" class="num cell-total">
              {{ money(store.totalsOf(invoice).total, store.settings.currency) }}
            </td>
            <td role="cell" class="cell-actions">
              <div class="row-actions">
                <button
                  type="button"
                  class="icon-button"
                  :aria-label="t.duplicateOf(invoice.number)"
                  :title="t.duplicate"
                  @click="duplicate(invoice)"
                >
                  <AppIcon name="copy" />
                </button>
                <RouterLink
                  :to="{ name: 'print', params: { id: invoice.id } }"
                  class="icon-button"
                  :aria-label="t.printOf(invoice.number)"
                  :title="t.print"
                >
                  <AppIcon name="printer" />
                </RouterLink>
                <button
                  type="button"
                  class="icon-button icon-button--danger"
                  :aria-label="t.deleteOf(invoice.number)"
                  :title="t.delete"
                  @click="pendingDelete = invoice"
                >
                  <AppIcon name="trash" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="card empty">
      <h2>{{ t.emptyTitle }}</h2>
      <p>{{ t.emptyText }}</p>
      <div class="empty__actions">
        <RouterLink to="/invoices/new" class="btn btn--primary">{{ t.navNew }}</RouterLink>
        <!-- Only when nothing exists: resetting replaces every invoice, so never offer it
             just because the current filter is empty. -->
        <button
          v-if="store.invoices.length === 0"
          type="button"
          class="btn btn--secondary"
          @click="store.resetDemo()"
        >
          {{ t.resetButton }}
        </button>
      </div>
    </div>

    <ConfirmDialog
      :open="pendingDelete !== null"
      :title="t.deleteTitle(pendingDelete?.number ?? '')"
      :text="t.deleteText"
      :confirm-label="t.confirmDelete"
      :cancel-label="t.cancel"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * @file InvoiceEditor.vue
 * Create or edit an invoice. The form keeps the raw text people type
 * (lib/invoiceForm), totals update live, and saving validates everything:
 * an error summary receives focus and links to each field (WCAG 3.3.1).
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { announce } from '../a11y/announcer';
import AppIcon from '../components/AppIcon.vue';
import TotalsTable from '../components/TotalsTable.vue';
import { useI18n } from '../i18n/useI18n';
import type { Messages } from '../i18n/messages';
import { INVOICE_STATUSES, MAX_TEXT, newId } from '../lib/invoice';
import {
  fromForm,
  newInvoiceForm,
  problemFieldId,
  toForm,
  type FormProblem,
  type InvoiceForm,
} from '../lib/invoiceForm';
import { LIMITS, tryCalculateTotals } from '../lib/pricing';
import { useInvoiceStore } from '../stores/invoices';

const props = defineProps<{ id?: string }>();
const store = useInvoiceStore();
const router = useRouter();
const { t, money } = useI18n();

const existing = computed(() => (props.id ? store.byId(props.id) : undefined));
const form = ref<InvoiceForm>(
  existing.value ? toForm(existing.value) : newInvoiceForm(store.numbers, store.settings.pricing),
);
const isNew = computed(() => !existing.value);
const notFound = computed(() => Boolean(props.id) && !existing.value);

// Live totals: null while some amount is not valid yet.
const parsed = computed(() => fromForm(form.value));
const totals = computed(() =>
  tryCalculateTotals(
    parsed.value.invoice.lines,
    parsed.value.invoice.discount,
    parsed.value.invoice.pricing,
  ),
);

// Announce the new total after typing pauses (not on every keystroke).
let totalTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => totals.value?.total,
  (total) => {
    if (totalTimer) clearTimeout(totalTimer);
    if (total === undefined) return;
    totalTimer = setTimeout(
      () => announce(t.value.announceTotal(money(total, store.settings.currency))),
      900,
    );
  },
);
onBeforeUnmount(() => totalTimer && clearTimeout(totalTimer));

// Validation is shown only after the first save attempt.
const submitted = ref(false);
const problems = computed<FormProblem[]>(() => (submitted.value ? parsed.value.problems : []));
const summary = ref<HTMLElement | null>(null);

/** Human message for one problem. */
function message(problem: FormProblem, e: Messages['errors']): string {
  const n = 'line' in problem ? problem.line + 1 : 0;
  switch (problem.field) {
    case 'customer':
      return problem.reason === 'required' ? e.customerRequired : e.customerTooLong;
    case 'issueDate':
      return e.issueDateInvalid;
    case 'dueDate':
      return problem.reason === 'beforeIssue' ? e.dueBeforeIssue : e.dueDateInvalid;
    case 'lines':
      return problem.reason === 'empty' ? e.linesEmpty : e.linesTooMany;
    case 'description':
      return problem.reason === 'required' ? e.descriptionRequired(n) : e.descriptionTooLong(n);
    case 'quantity':
      return e.quantityRange(n);
    case 'unitPrice':
      return e.unitPriceRange(n);
    case 'lineDiscount':
      return e.lineDiscountRange(n);
    case 'discount':
      return e.discountRange;
    case 'taxRate':
      return e.taxRateRange;
    case 'serviceFee':
      return e.serviceFeeRange;
    case 'notes':
      return e.notesTooLong;
  }
}

/** Error text for one input (by its DOM id), or '' when it is valid. */
function errorFor(fieldId: string): string {
  const problem = problems.value.find((item) => problemFieldId(item) === fieldId);
  return problem ? message(problem, t.value.errors) : '';
}
const describedBy = (fieldId: string, hint?: string) =>
  [hint, errorFor(fieldId) ? `${fieldId}-error` : ''].filter(Boolean).join(' ') || undefined;

function addLine(): void {
  form.value.lines.push({
    id: newId(),
    description: '',
    quantity: '1',
    unitPrice: '',
    discount: '0',
  });
  void nextTick(() => {
    document.getElementById(`line-${form.value.lines.length - 1}-description`)?.focus();
  });
}

function removeLine(index: number): void {
  form.value.lines.splice(index, 1);
  void nextTick(() => document.getElementById('add-line')?.focus());
}

/** Error summary link: focus the field (a #hash link would be read as a route). */
function focusField(fieldId: string): void {
  document.getElementById(fieldId)?.focus();
}

async function save(): Promise<void> {
  submitted.value = true;
  const result = fromForm(form.value);
  if (result.problems.length > 0) {
    await nextTick();
    summary.value?.focus();
    return;
  }
  store.save(result.invoice);
  announce(t.value.announceSaved(result.invoice.number));
  await router.push({ name: 'list' });
}

const lineTotalText = (index: number) => {
  const value = totals.value?.lineTotals[index];
  return value === undefined ? '—' : money(value, store.settings.currency);
};
</script>

<template>
  <section v-if="notFound" class="card empty" aria-labelledby="editor-title">
    <h1 id="editor-title" tabindex="-1">{{ t.notFoundTitle }}</h1>
    <p>{{ t.invoiceNotFound }}</p>
    <RouterLink to="/invoices" class="btn btn--primary">{{ t.goToInvoices }}</RouterLink>
  </section>

  <section v-else aria-labelledby="editor-title">
    <div class="page-head">
      <h1 id="editor-title" tabindex="-1">
        {{ isNew ? t.newTitle : t.editTitle(form.number) }}
      </h1>
      <p v-if="isNew" class="page-head__intro mono">{{ form.number }}</p>
    </div>

    <form class="editor" novalidate @submit.prevent="save">
      <div class="editor__main">
        <div
          v-if="problems.length > 0"
          ref="summary"
          class="error-summary"
          tabindex="-1"
          role="group"
          aria-labelledby="error-summary-title"
        >
          <p id="error-summary-title">{{ t.errorSummary(problems.length) }}</p>
          <ul>
            <li v-for="problem in problems" :key="problemFieldId(problem) + problem.reason">
              <a
                :href="`#${problemFieldId(problem)}`"
                @click.prevent="focusField(problemFieldId(problem))"
              >
                {{ message(problem, t.errors) }}
              </a>
            </li>
          </ul>
        </div>

        <fieldset class="card panel">
          <legend class="panel__legend">{{ t.sectionCustomer }}</legend>
          <div class="grid grid--2">
            <div class="field field--wide">
              <label for="field-customer" class="field-label">{{ t.customer }}</label>
              <input
                id="field-customer"
                v-model="form.customer"
                class="input"
                type="text"
                autocomplete="off"
                :maxlength="MAX_TEXT.customer + 20"
                :aria-invalid="Boolean(errorFor('field-customer'))"
                :aria-describedby="describedBy('field-customer', 'customer-hint')"
              />
              <p id="customer-hint" class="hint">{{ t.customerHint }}</p>
              <p v-if="errorFor('field-customer')" id="field-customer-error" class="field-error">
                {{ errorFor('field-customer') }}
              </p>
            </div>
            <div class="field">
              <label for="field-issueDate" class="field-label">{{ t.issueDate }}</label>
              <input
                id="field-issueDate"
                v-model="form.issueDate"
                class="input"
                type="date"
                :aria-invalid="Boolean(errorFor('field-issueDate'))"
                :aria-describedby="describedBy('field-issueDate')"
              />
              <p v-if="errorFor('field-issueDate')" id="field-issueDate-error" class="field-error">
                {{ errorFor('field-issueDate') }}
              </p>
            </div>
            <div class="field">
              <label for="field-dueDate" class="field-label">{{ t.dueDate }}</label>
              <input
                id="field-dueDate"
                v-model="form.dueDate"
                class="input"
                type="date"
                :aria-invalid="Boolean(errorFor('field-dueDate'))"
                :aria-describedby="describedBy('field-dueDate')"
              />
              <p v-if="errorFor('field-dueDate')" id="field-dueDate-error" class="field-error">
                {{ errorFor('field-dueDate') }}
              </p>
            </div>
            <div class="field">
              <label for="field-status" class="field-label">{{ t.statusLabel }}</label>
              <select id="field-status" v-model="form.status" class="input input--select">
                <option v-for="status in INVOICE_STATUSES" :key="status" :value="status">
                  {{ t.status[status] }}
                </option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset class="card panel">
          <legend class="panel__legend">{{ t.sectionItems }}</legend>
          <p v-if="errorFor('field-lines')" id="field-lines" class="field-error" tabindex="-1">
            {{ errorFor('field-lines') }}
          </p>
          <ol class="lines">
            <li v-for="(line, index) in form.lines" :key="line.id" class="line">
              <fieldset class="line__fieldset">
                <legend class="line__legend">{{ t.item(index + 1) }}</legend>
                <div class="line__grid">
                  <div class="field line__description">
                    <label :for="`line-${index}-description`" class="field-label">{{
                      t.description
                    }}</label>
                    <input
                      :id="`line-${index}-description`"
                      v-model="line.description"
                      class="input"
                      type="text"
                      autocomplete="off"
                      :maxlength="MAX_TEXT.description + 20"
                      :aria-invalid="Boolean(errorFor(`line-${index}-description`))"
                      :aria-describedby="describedBy(`line-${index}-description`)"
                    />
                    <p
                      v-if="errorFor(`line-${index}-description`)"
                      :id="`line-${index}-description-error`"
                      class="field-error"
                    >
                      {{ errorFor(`line-${index}-description`) }}
                    </p>
                  </div>
                  <div class="field">
                    <label :for="`line-${index}-quantity`" class="field-label">{{
                      t.quantity
                    }}</label>
                    <input
                      :id="`line-${index}-quantity`"
                      v-model="line.quantity"
                      class="input num"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      :aria-invalid="Boolean(errorFor(`line-${index}-quantity`))"
                      :aria-describedby="describedBy(`line-${index}-quantity`)"
                    />
                    <p
                      v-if="errorFor(`line-${index}-quantity`)"
                      :id="`line-${index}-quantity-error`"
                      class="field-error"
                    >
                      {{ errorFor(`line-${index}-quantity`) }}
                    </p>
                  </div>
                  <div class="field">
                    <label :for="`line-${index}-unitPrice`" class="field-label">{{
                      t.unitPrice
                    }}</label>
                    <input
                      :id="`line-${index}-unitPrice`"
                      v-model="line.unitPrice"
                      class="input num"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      :aria-invalid="Boolean(errorFor(`line-${index}-unitPrice`))"
                      :aria-describedby="describedBy(`line-${index}-unitPrice`)"
                    />
                    <p
                      v-if="errorFor(`line-${index}-unitPrice`)"
                      :id="`line-${index}-unitPrice-error`"
                      class="field-error"
                    >
                      {{ errorFor(`line-${index}-unitPrice`) }}
                    </p>
                  </div>
                  <div class="field">
                    <label :for="`line-${index}-lineDiscount`" class="field-label">{{
                      t.lineDiscount
                    }}</label>
                    <input
                      :id="`line-${index}-lineDiscount`"
                      v-model="line.discount"
                      class="input num"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      :aria-invalid="Boolean(errorFor(`line-${index}-lineDiscount`))"
                      :aria-describedby="describedBy(`line-${index}-lineDiscount`)"
                    />
                    <p
                      v-if="errorFor(`line-${index}-lineDiscount`)"
                      :id="`line-${index}-lineDiscount-error`"
                      class="field-error"
                    >
                      {{ errorFor(`line-${index}-lineDiscount`) }}
                    </p>
                  </div>
                  <div class="line__total">
                    <span class="field-label">{{ t.lineTotal }}</span>
                    <output
                      :data-line-total="index"
                      :for="`line-${index}-quantity line-${index}-unitPrice line-${index}-lineDiscount`"
                    >
                      {{ lineTotalText(index) }}
                    </output>
                  </div>
                  <button
                    type="button"
                    class="icon-button icon-button--danger line__remove"
                    :aria-label="t.removeLine(index + 1)"
                    :title="t.removeLine(index + 1)"
                    :disabled="form.lines.length === 1"
                    @click="removeLine(index)"
                  >
                    <AppIcon name="trash" />
                  </button>
                </div>
              </fieldset>
            </li>
          </ol>
          <button
            id="add-line"
            type="button"
            class="btn btn--secondary"
            :disabled="form.lines.length >= LIMITS.maxLines"
            @click="addLine"
          >
            <AppIcon name="plus" />
            {{ t.addLine }}
          </button>
        </fieldset>

        <fieldset class="card panel">
          <legend class="panel__legend">{{ t.sectionPricing }}</legend>
          <p class="hint">{{ t.pricingNote }}</p>
          <div class="grid grid--2">
            <fieldset class="field">
              <legend class="field-label">{{ t.invoiceDiscount }}</legend>
              <div class="radio-row">
                <label class="radio">
                  <input
                    v-model="form.discountType"
                    type="radio"
                    name="discount-type"
                    value="percent"
                  />
                  {{ t.discountPercent }}
                </label>
                <label class="radio">
                  <input
                    v-model="form.discountType"
                    type="radio"
                    name="discount-type"
                    value="amount"
                  />
                  {{ t.discountAmount }}
                </label>
              </div>
              <label for="field-discount" class="sr-only">{{ t.discountValue }}</label>
              <input
                id="field-discount"
                v-model="form.discountValue"
                class="input num"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="Boolean(errorFor('field-discount'))"
                :aria-describedby="describedBy('field-discount')"
              />
              <p v-if="errorFor('field-discount')" id="field-discount-error" class="field-error">
                {{ errorFor('field-discount') }}
              </p>
            </fieldset>
            <div class="field">
              <label for="field-serviceFee" class="field-label">{{ t.serviceFee }}</label>
              <input
                id="field-serviceFee"
                v-model="form.serviceFee"
                class="input num"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="Boolean(errorFor('field-serviceFee'))"
                :aria-describedby="describedBy('field-serviceFee')"
              />
              <p
                v-if="errorFor('field-serviceFee')"
                id="field-serviceFee-error"
                class="field-error"
              >
                {{ errorFor('field-serviceFee') }}
              </p>
            </div>
            <div class="field">
              <label for="field-taxRate" class="field-label">{{ t.taxRate }}</label>
              <input
                id="field-taxRate"
                v-model="form.taxRate"
                class="input num"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="Boolean(errorFor('field-taxRate'))"
                :aria-describedby="describedBy('field-taxRate')"
              />
              <p v-if="errorFor('field-taxRate')" id="field-taxRate-error" class="field-error">
                {{ errorFor('field-taxRate') }}
              </p>
            </div>
            <fieldset class="field">
              <legend class="field-label">{{ t.taxMode }}</legend>
              <label class="radio">
                <input v-model="form.taxMode" type="radio" name="tax-mode" value="exclusive" />
                {{ t.taxExclusive }}
              </label>
              <label class="radio">
                <input v-model="form.taxMode" type="radio" name="tax-mode" value="inclusive" />
                {{ t.taxInclusive }}
              </label>
            </fieldset>
            <fieldset class="field">
              <legend class="field-label">{{ t.rounding }}</legend>
              <div class="radio-row">
                <label class="radio">
                  <input
                    v-model.number="form.roundingStep"
                    type="radio"
                    name="rounding"
                    :value="1"
                  />
                  {{ t.roundTo1 }}
                </label>
                <label class="radio">
                  <input
                    v-model.number="form.roundingStep"
                    type="radio"
                    name="rounding"
                    :value="100"
                  />
                  {{ t.roundTo100 }}
                </label>
              </div>
            </fieldset>
          </div>
        </fieldset>

        <fieldset class="card panel">
          <legend class="sr-only">{{ t.notes }}</legend>
          <div class="field">
            <label for="field-notes" class="field-label">{{ t.notes }}</label>
            <textarea
              id="field-notes"
              v-model="form.notes"
              class="input"
              rows="3"
              :maxlength="MAX_TEXT.notes + 50"
              :aria-invalid="Boolean(errorFor('field-notes'))"
              :aria-describedby="describedBy('field-notes')"
            ></textarea>
            <p v-if="errorFor('field-notes')" id="field-notes-error" class="field-error">
              {{ errorFor('field-notes') }}
            </p>
          </div>
        </fieldset>
      </div>

      <aside class="editor__aside" aria-labelledby="totals-title">
        <div class="card panel summary">
          <h2 id="totals-title" class="panel__legend">{{ t.totalsTitle }}</h2>
          <TotalsTable
            :totals="totals"
            :pricing="parsed.invoice.pricing"
            :currency="store.settings.currency"
            hide-caption
          />
          <div class="summary__actions">
            <button type="submit" class="btn btn--primary btn--block">{{ t.save }}</button>
            <RouterLink
              v-if="!isNew"
              :to="{ name: 'print', params: { id: form.id } }"
              class="btn btn--secondary btn--block"
            >
              <AppIcon name="printer" />
              {{ t.preview }}
            </RouterLink>
            <RouterLink to="/invoices" class="btn btn--ghost btn--block">{{ t.cancel }}</RouterLink>
          </div>
        </div>
      </aside>
    </form>
  </section>
</template>

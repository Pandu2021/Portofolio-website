/**
 * @file order-detail-page.ts
 * One order: status, customer, channel, date, product lines and amounts.
 * The `id` route parameter arrives as a signal input
 * (`withComponentInputBinding()`).
 */
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { MENU } from '../../data/orders';
import { OrdersStore } from '../../data/orders.store';

@Component({
  selector: 'app-order-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/orders" class="back-link">← {{ t().backToOrders }}</a>

    @if (order(); as order) {
      <header class="page-head page-head--row">
        <h1>{{ t().orderTitle(order.id) }}</h1>
        <span class="status status--large" [attr.data-status]="order.status">{{
          t().status[order.status]
        }}</span>
      </header>

      <div class="detail-grid">
        <section class="card" aria-labelledby="items-title">
          <h2 id="items-title" class="card__title">{{ t().items }}</h2>
          <table class="table">
            <caption class="sr-only">
              {{
                t().items
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ t().product }}</th>
                <th scope="col" class="num">{{ t().quantity }}</th>
                <th scope="col" class="num">{{ t().unitPrice }}</th>
                <th scope="col" class="num">{{ t().lineTotal }}</th>
              </tr>
            </thead>
            <tbody>
              @for (line of lines(); track line.productId) {
                <tr>
                  <th scope="row">{{ line.name }}</th>
                  <td class="num">{{ line.quantity }}</td>
                  <td class="num">{{ i18n.price(line.unitPrice) }}</td>
                  <td class="num">{{ i18n.price(line.unitPrice * line.quantity) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <aside class="card" aria-labelledby="summary-title">
          <h2 id="summary-title" class="card__title">{{ t().total }}</h2>
          <dl class="summary">
            <div>
              <dt>{{ t().colCustomer }}</dt>
              <dd>{{ order.customer }}</dd>
            </div>
            <div>
              <dt>{{ t().colChannel }}</dt>
              <dd>{{ t().channel[order.channel] }}</dd>
            </div>
            <div>
              <dt>{{ t().placedAt }}</dt>
              <dd>{{ i18n.dateTime(order.createdAt) }}</dd>
            </div>
            <div>
              <dt>{{ t().subtotal }}</dt>
              <dd>{{ i18n.price(order.subtotal) }}</dd>
            </div>
            <div>
              <dt>{{ t().tax }}</dt>
              <dd>{{ i18n.price(order.tax) }}</dd>
            </div>
            <div>
              <dt>{{ t().delivery }}</dt>
              <dd>{{ order.delivery === 0 ? t().free : i18n.price(order.delivery) }}</dd>
            </div>
            <div class="summary__total">
              <dt>{{ t().total }}</dt>
              <dd>{{ i18n.price(order.total) }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    } @else {
      <div class="empty">
        <h1>{{ t().orderNotFound }}</h1>
        <a routerLink="/orders" class="btn btn--secondary">{{ t().backToOrders }}</a>
      </div>
    }
  `,
})
export class OrderDetailPage {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();

  protected readonly i18n = inject(I18nService);
  private readonly store = inject(OrdersStore);
  protected readonly t = this.i18n.t;

  protected readonly order = computed(() => this.store.byId().get(this.id()));
  protected readonly lines = computed(() =>
    (this.order()?.items ?? []).map((item) => ({
      ...item,
      name: MENU[item.productId]?.name[this.i18n.locale()] ?? item.productId,
    })),
  );
}

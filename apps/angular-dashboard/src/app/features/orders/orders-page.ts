/**
 * @file orders-page.ts
 * Orders table: search, status filter, sort and paging as `computed()`
 * signals over the store, plus a simulated live order feed (RxJS) that can be
 * paused and stops automatically when leaving the page.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AnnouncerService } from '../../core/a11y/announcer.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { liveFeed } from '../../data/live-feed';
import {
  filterOrders,
  paginate,
  sortOrders,
  SORT_KEYS,
  toSortKey,
  toStatusFilter,
} from '../../data/order-query';
import { ORDER_STATUSES } from '../../data/orders';
import { OrdersStore } from '../../data/orders.store';
import { OrdersViewState, PAGE_SIZE } from './orders-view-state';

/** Milliseconds between simulated live orders. */
export const LIVE_INTERVAL_MS = 5000;

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head page-head--row">
      <h1>{{ t().ordersTitle }}</h1>
      <div class="live">
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          [attr.aria-pressed]="live()"
          (click)="live.set(!live())"
        >
          <span class="live__dot" [class.live__dot--on]="live()" aria-hidden="true"></span>
          {{ live() ? t().livePause : t().liveStart }}
        </button>
        <p class="hint">
          {{ t().liveHint }}
          @if (liveCount() > 0) {
            · <strong>{{ t().liveCount(liveCount()) }}</strong>
          }
        </p>
      </div>
    </header>

    <div class="filters">
      <div class="field">
        <label for="orders-search" class="field-label">{{ t().searchLabel }}</label>
        <input
          #searchBox
          id="orders-search"
          type="search"
          class="input"
          maxlength="60"
          [value]="view.search()"
          (input)="setSearch(searchBox.value)"
        />
      </div>
      <div class="field">
        <label for="orders-status" class="field-label">{{ t().statusFilterLabel }}</label>
        <select
          #statusBox
          id="orders-status"
          class="input"
          [value]="view.status()"
          (change)="setStatus(statusBox.value)"
        >
          <option value="all">{{ t().allStatuses }}</option>
          @for (status of statuses; track status) {
            <option [value]="status">{{ t().status[status] }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="orders-sort" class="field-label">{{ t().sortLabel }}</label>
        <select
          #sortBox
          id="orders-sort"
          class="input"
          [value]="view.sort()"
          (change)="setSort(sortBox.value)"
        >
          @for (key of sortKeys; track key) {
            <option [value]="key">{{ t().sort[key] }}</option>
          }
        </select>
      </div>
    </div>

    @if (page().total > 0) {
      <!-- Scrollable on small screens: focusable + labelled so keyboard users can scroll it. -->
      <div
        class="table-wrap card"
        tabindex="0"
        role="region"
        [attr.aria-label]="t().tableCaption(page().total)"
      >
        <table class="table">
          <caption>
            {{
              t().tableCaption(page().total)
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ t().colOrder }}</th>
              <th scope="col">{{ t().colCustomer }}</th>
              <th scope="col">{{ t().colDate }}</th>
              <th scope="col">{{ t().colChannel }}</th>
              <th scope="col">{{ t().colStatus }}</th>
              <th scope="col" class="num">{{ t().colTotal }}</th>
            </tr>
          </thead>
          <tbody>
            @for (order of page().items; track order.id) {
              <tr [class.is-new]="newIds().has(order.id)">
                <th scope="row">
                  <a
                    [routerLink]="['/orders', order.id]"
                    class="mono"
                    [attr.aria-label]="t().viewOrder(order.id)"
                  >
                    {{ order.id }}
                  </a>
                </th>
                <td>{{ order.customer }}</td>
                <td>{{ i18n.dateTime(order.createdAt) }}</td>
                <td>{{ t().channel[order.channel] }}</td>
                <td>
                  <span class="status" [attr.data-status]="order.status">{{
                    t().status[order.status]
                  }}</span>
                </td>
                <td class="num">{{ i18n.price(order.total) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <nav class="pager" [attr.aria-label]="t().pagination">
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          [disabled]="page().page <= 1"
          (click)="goTo(page().page - 1)"
        >
          ← {{ t().previousPage }}
        </button>
        <p class="pager__info" aria-live="polite">
          {{ t().pageInfo(page().page, page().pageCount) }}
        </p>
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          [disabled]="page().page >= page().pageCount"
          (click)="goTo(page().page + 1)"
        >
          {{ t().nextPage }} →
        </button>
      </nav>
    } @else {
      <div class="empty">
        <p>{{ t().noOrders }}</p>
        <button type="button" class="btn btn--secondary" (click)="view.clear()">
          {{ t().clearFilters }}
        </button>
      </div>
    }
  `,
})
export class OrdersPage {
  protected readonly i18n = inject(I18nService);
  protected readonly view = inject(OrdersViewState);
  private readonly store = inject(OrdersStore);
  private readonly announcer = inject(AnnouncerService);
  protected readonly t = this.i18n.t;
  protected readonly statuses = ORDER_STATUSES;
  protected readonly sortKeys = SORT_KEYS;

  /** Live feed switch (off by default: no surprise auto-updates, WCAG 2.2.2). */
  protected readonly live = signal(false);
  protected readonly liveCount = signal(0);
  /** Orders that just arrived (highlighted for a few seconds). */
  protected readonly newIds = signal<ReadonlySet<string>>(new Set());

  private readonly results = computed(() =>
    sortOrders(
      filterOrders(this.store.orders(), { search: this.view.search(), status: this.view.status() }),
      this.view.sort(),
    ),
  );
  protected readonly page = computed(() => paginate(this.results(), this.view.page(), PAGE_SIZE));

  constructor() {
    liveFeed(toObservable(this.live), LIVE_INTERVAL_MS, () => this.store.createLiveOrder())
      .pipe(takeUntilDestroyed())
      .subscribe(({ item, count }) => {
        this.store.add(item);
        this.liveCount.set(count);
        this.newIds.update((ids) => new Set(ids).add(item.id));
        setTimeout(
          () => this.newIds.update((ids) => new Set([...ids].filter((id) => id !== item.id))),
          4000,
        );
        this.announcer.announce(this.t().newOrder(item.id, item.customer));
      });
  }

  protected setSearch(value: string): void {
    this.view.search.set(value.slice(0, 60));
    this.view.page.set(1);
  }

  protected setStatus(value: string): void {
    this.view.status.set(toStatusFilter(value));
    this.view.page.set(1);
  }

  protected setSort(value: string): void {
    this.view.sort.set(toSortKey(value));
    this.view.page.set(1);
  }

  protected goTo(page: number): void {
    this.view.page.set(page);
  }
}

/**
 * @file overview-page.ts
 * Finance overview: KPI cards for the last 7 days, revenue (bar) and orders
 * (line) charts, and the most recent orders. Everything is derived from the
 * order store with `computed()` signals.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { computeKpis, dailySeries, ordersInLastDays } from '../../data/kpi';
import { OrdersStore } from '../../data/orders.store';
import { Chart, type ChartPoint } from '../../shared/chart';

/** Highest point of a series, for the chart's text summary. */
function peak(points: readonly ChartPoint[]): ChartPoint | undefined {
  return points.reduce<ChartPoint | undefined>(
    (best, point) => (!best || point.value > best.value ? point : best),
    undefined,
  );
}

@Component({
  selector: 'app-overview-page',
  imports: [Chart, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <h1>{{ t().overviewTitle }}</h1>
      <p class="page-head__intro">{{ t().last7Days }}</p>
    </header>

    <ul class="kpi-grid">
      <li class="card kpi">
        <span class="kpi__label">{{ t().kpiRevenue }}</span>
        <span class="kpi__value">{{ i18n.price(kpis().revenue) }}</span>
      </li>
      <li class="card kpi">
        <span class="kpi__label">{{ t().kpiOrders }}</span>
        <span class="kpi__value">{{ i18n.number(kpis().orders) }}</span>
      </li>
      <li class="card kpi">
        <span class="kpi__label">{{ t().kpiAverage }}</span>
        <span class="kpi__value">{{ i18n.price(kpis().averageOrderValue) }}</span>
      </li>
      <li class="card kpi">
        <span class="kpi__label">{{ t().kpiCancelled }}</span>
        <span class="kpi__value">{{ i18n.percent(kpis().cancellationRate) }}</span>
      </li>
    </ul>

    <div class="chart-grid">
      <div class="card">
        <app-chart
          kind="bar"
          [title]="t().chartRevenueTitle"
          [points]="revenuePoints()"
          [summary]="summaryOf(revenuePoints())"
          [tableToggle]="t().showDataTable"
          [labelHeader]="t().columnDay"
          [valueHeader]="t().columnRevenue"
        />
      </div>
      <div class="card">
        <app-chart
          kind="line"
          [title]="t().chartOrdersTitle"
          [points]="orderPoints()"
          [summary]="summaryOf(orderPoints())"
          [tableToggle]="t().showDataTable"
          [labelHeader]="t().columnDay"
          [valueHeader]="t().columnOrders"
        />
      </div>
    </div>

    <section class="card recent" aria-labelledby="recent-title">
      <div class="recent__head">
        <h2 id="recent-title">{{ t().recentOrders }}</h2>
        <a routerLink="/orders" class="link-strong">{{ t().viewAllOrders }} →</a>
      </div>
      <ul class="recent__list">
        @for (order of recent(); track order.id) {
          <li>
            <a [routerLink]="['/orders', order.id]" class="recent__link">
              <span class="mono">{{ order.id }}</span>
              <span>{{ order.customer }}</span>
              <span class="status" [attr.data-status]="order.status">{{
                t().status[order.status]
              }}</span>
              <span class="num">{{ i18n.price(order.total) }}</span>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
})
export class OverviewPage {
  protected readonly i18n = inject(I18nService);
  private readonly store = inject(OrdersStore);
  protected readonly t = this.i18n.t;
  private readonly now = new Date();

  protected readonly kpis = computed(() =>
    computeKpis(ordersInLastDays(this.store.orders(), 7, this.now)),
  );
  private readonly series = computed(() => dailySeries(this.store.orders(), 7, this.now));

  protected readonly revenuePoints = computed<ChartPoint[]>(() =>
    this.series().map((day) => ({
      label: this.i18n.day(day.date),
      value: day.revenue,
      display: this.i18n.price(day.revenue),
    })),
  );
  protected readonly orderPoints = computed<ChartPoint[]>(() =>
    this.series().map((day) => ({
      label: this.i18n.day(day.date),
      value: day.orders,
      display: this.i18n.number(day.orders),
    })),
  );
  protected readonly recent = computed(() => this.store.orders().slice(0, 5));

  /** Text alternative for a chart (its highest day). */
  protected summaryOf(points: readonly ChartPoint[]): string {
    const top = peak(points);
    return top ? this.t().chartSummary(top.label, top.display) : '';
  }
}

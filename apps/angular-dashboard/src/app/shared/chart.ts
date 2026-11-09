/**
 * @file chart.ts
 * Accessible bar / line chart drawn with plain SVG (no chart library, no CDN).
 *
 * Accessibility: the SVG is `role="img"` labelled by the caption and a text
 * summary (<desc>); the exact numbers are available in a data table inside
 * <details>, for screen-reader and keyboard users alike.
 * Colors come from CSS classes (no inline styles → strict CSP friendly).
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** One value on the chart. */
export interface ChartPoint {
  /** Short x-axis label, e.g. "Mon 3". */
  label: string;
  value: number;
  /** Formatted value for the table and summary, e.g. "Rp 1.250.000". */
  display: string;
}

const WIDTH = 600;
const HEIGHT = 240;
const PAD = { top: 16, right: 12, bottom: 32, left: 12 };
let nextId = 0;

/** Geometry helpers, exported for unit tests. */
export function chartGeometry(points: readonly ChartPoint[]) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerWidth / Math.max(1, points.length);
  return points.map((point, index) => {
    const height = (point.value / max) * innerHeight;
    const x = PAD.left + index * slot;
    return {
      ...point,
      barX: x + slot * 0.18,
      barWidth: slot * 0.64,
      barY: PAD.top + innerHeight - height,
      barHeight: height,
      centerX: x + slot / 2,
    };
  });
}

@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="chart">
      <figcaption class="chart__title" [id]="titleId">{{ title() }}</figcaption>
      <svg
        class="chart__svg"
        [attr.viewBox]="viewBox"
        role="img"
        [attr.aria-labelledby]="titleId + ' ' + descId"
      >
        <desc [attr.id]="descId">{{ summary() }}</desc>
        @for (y of gridLines; track y) {
          <line
            class="chart__grid"
            [attr.x1]="pad.left"
            [attr.x2]="width - pad.right"
            [attr.y1]="y"
            [attr.y2]="y"
          />
        }
        @if (kind() === 'bar') {
          @for (bar of geometry(); track bar.label) {
            <rect
              class="chart__bar"
              rx="4"
              [attr.x]="bar.barX"
              [attr.y]="bar.barY"
              [attr.width]="bar.barWidth"
              [attr.height]="bar.barHeight"
            />
          }
        } @else {
          <polyline class="chart__line" [attr.points]="linePoints()" />
          @for (dot of geometry(); track dot.label) {
            <circle class="chart__dot" r="4" [attr.cx]="dot.centerX" [attr.cy]="dot.barY" />
          }
        }
        @for (point of geometry(); track point.label) {
          <text
            class="chart__label"
            text-anchor="middle"
            [attr.x]="point.centerX"
            [attr.y]="height - 10"
          >
            {{ point.label }}
          </text>
        }
      </svg>
      <details class="chart__data">
        <summary>{{ tableToggle() }}</summary>
        <table class="table table--compact">
          <caption class="sr-only">
            {{
              title()
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ labelHeader() }}</th>
              <th scope="col" class="num">{{ valueHeader() }}</th>
            </tr>
          </thead>
          <tbody>
            @for (point of points(); track point.label) {
              <tr>
                <th scope="row">{{ point.label }}</th>
                <td class="num">{{ point.display }}</td>
              </tr>
            }
          </tbody>
        </table>
      </details>
    </figure>
  `,
})
export class Chart {
  readonly kind = input<'bar' | 'line'>('bar');
  readonly title = input.required<string>();
  readonly points = input.required<ChartPoint[]>();
  /** Text summary for assistive technology, e.g. "Highest: Fri 7, Rp 1.2 jt." */
  readonly summary = input.required<string>();
  readonly tableToggle = input.required<string>();
  readonly labelHeader = input.required<string>();
  readonly valueHeader = input.required<string>();

  protected readonly titleId = `chart-title-${++nextId}`;
  protected readonly descId = `chart-desc-${nextId}`;
  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly pad = PAD;
  protected readonly viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  protected readonly gridLines = [0, 0.5, 1].map(
    (ratio) => PAD.top + (HEIGHT - PAD.top - PAD.bottom) * ratio,
  );

  protected readonly geometry = computed(() => chartGeometry(this.points()));
  protected readonly linePoints = computed(() =>
    this.geometry()
      .map((point) => `${point.centerX},${point.barY}`)
      .join(' '),
  );
}

/**
 * @file live-feed.ts
 * Simulated real-time order stream with RxJS, as a pure function so it can be
 * tested with virtual time (TestScheduler).
 *
 *   active$ ──true──────false────true──▶
 *   output   ──o──o──o─(paused)──o──o──▶   (one item per `periodMs` while active)
 *
 * `switchMap` restarts the timer on resume and stops it on pause; `scan`
 * counts how many orders arrived. The caller unsubscribes on destroy
 * (`takeUntilDestroyed`), so the feed stops when leaving the page.
 */
import { EMPTY, interval, map, scan, switchMap, type Observable, type SchedulerLike } from 'rxjs';

/** One emitted live item with its running number. */
export interface LiveEvent<T> {
  item: T;
  /** 1 for the first item of this feed, 2 for the second, … */
  count: number;
}

/**
 * Emits `create()` every `periodMs` while `active$` is `true`.
 * @param active$ - Play / pause switch.
 * @param periodMs - Time between items.
 * @param create - Builds one item (called once per tick).
 * @param scheduler - Optional scheduler (tests use virtual time).
 */
export function liveFeed<T>(
  active$: Observable<boolean>,
  periodMs: number,
  create: () => T,
  scheduler?: SchedulerLike,
): Observable<LiveEvent<T>> {
  return active$.pipe(
    switchMap((active) => (active ? interval(periodMs, scheduler) : EMPTY)),
    map(() => create()),
    scan((last: LiveEvent<T> | null, item: T) => ({ item, count: (last?.count ?? 0) + 1 }), null),
    map((event) => event as LiveEvent<T>),
  );
}

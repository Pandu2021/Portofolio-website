/**
 * @file announcer.ts
 * One polite live region for the whole app (rendered in App.vue).
 * The text is cleared first and set again after 60 ms, so screen readers
 * announce the same message twice in a row (e.g. two saves) — the same
 * pattern as the React and Angular demos.
 */
import { ref } from 'vue';

export const announcement = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

/** Announces a short message to screen-reader users. */
export function announce(message: string): void {
  announcement.value = '';
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    announcement.value = message;
  }, 60);
}

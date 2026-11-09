/**
 * @file announcer.service.ts
 * Text for the polite live region rendered by the shell, so screen-reader
 * users hear updates that happen without navigation (new orders, saves).
 */
import { Injectable, signal } from '@angular/core';

/** Polite status announcements. */
@Injectable({ providedIn: 'root' })
export class AnnouncerService {
  /** Current message (rendered inside `role="status"`). */
  readonly message = signal('');
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** Announces `text`; repeating the same text is announced again. */
  announce(text: string): void {
    this.message.set('');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(text), 60);
  }
}

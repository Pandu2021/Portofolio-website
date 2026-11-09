'use client';
/**
 * @file BackToTop.tsx
 * Floating "back to top" link that appears after scrolling down.
 * It is a real link to `#top`, so it also works without JavaScript.
 */
import { useSyncExternalStore } from 'react';
import { Icon } from './Icon';

const SHOW_AFTER_PX = 640;

function subscribe(listener: () => void) {
  window.addEventListener('scroll', listener, { passive: true });
  return () => window.removeEventListener('scroll', listener);
}

const getSnapshot = () => window.scrollY > SHOW_AFTER_PX;
const getServerSnapshot = () => false;

/** Renders the floating link; hidden (and removed from tab order) near the top. */
export function BackToTop({ label }: { label: string }) {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <a
      href="#top"
      className="back-to-top"
      data-visible={visible}
      aria-label={label}
      title={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <Icon name="arrowUp" size={20} />
    </a>
  );
}

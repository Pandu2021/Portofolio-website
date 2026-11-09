'use client';
/**
 * @file SiteNav.tsx
 * Primary navigation with an accessible mobile menu.
 *
 * - Desktop: links and controls are always visible.
 * - Mobile: a menu button toggles the panel (`aria-expanded`, `aria-controls`);
 *   Escape or choosing a link closes it and returns focus to the button.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

/** One in-page navigation entry. */
export interface NavItem {
  /** Target section id (without `#`). */
  id: string;
  label: string;
}

interface SiteNavProps {
  items: NavItem[];
  /** aria-label of the `<nav>` landmark. */
  navLabel: string;
  openLabel: string;
  closeLabel: string;
  /** Extra controls (language switch, theme toggle, resume link). */
  children: ReactNode;
}

/** Navigation landmark + mobile menu toggle. */
export function SiteNav({ items, navLabel, openLabel, closeLabel, children }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu with Escape and give focus back to the toggle button.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="site-nav" data-open={open}>
      <button
        ref={buttonRef}
        type="button"
        className="icon-button site-nav__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? 'close' : 'menu'} size={22} />
      </button>

      <div id={panelId} className="site-nav__panel">
        <nav aria-label={navLabel}>
          <ul className="site-nav__list">
            {items.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="site-nav__link" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-nav__controls">{children}</div>
      </div>
    </div>
  );
}

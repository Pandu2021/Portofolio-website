/**
 * @file useDocumentTitle.ts
 * Sets the browser tab title per page (also announced by screen readers on
 * navigation in many browsers).
 */
import { useEffect } from 'react';

/** Sets `document.title` to "<title> · Kedai Demo". */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Kedai Demo`;
  }, [title]);
}

/**
 * @file Announcer.tsx
 * Polite live region for status messages ("Latte added to the cart") so that
 * screen-reader users hear changes that happen without a page change.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce | null>(null);

/** Renders the live region and provides `announce()`. */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback<Announce>((next) => {
    // Clear first so repeating the same text is announced again.
    setMessage('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(next), 60);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

/** Returns the function that announces a message to assistive technology. */
export function useAnnounce(): Announce {
  const announce = useContext(AnnouncerContext);
  if (!announce) throw new Error('useAnnounce must be used inside <AnnouncerProvider>');
  return announce;
}

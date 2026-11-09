/**
 * @file ExternalLink.tsx
 * Link to another website: opens in a new tab safely and tells screen-reader
 * users that it does.
 */
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

interface ExternalLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'target' | 'rel'
> {
  href: string;
  children: ReactNode;
  /** Localized "(opens in a new tab)" hint, read by screen readers only. */
  newTabHint: string;
  /** Show the ↗ icon after the text. Default true. */
  showIcon?: boolean;
}

/**
 * `<a target="_blank">` with `rel="noopener noreferrer"` (prevents reverse
 * tab-nabbing and referrer leaks) and an accessible new-tab hint.
 */
export function ExternalLink({
  href,
  children,
  newTabHint,
  showIcon = true,
  ...rest
}: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      {showIcon && <Icon name="external" size={14} />}
      <span className="sr-only"> {newTabHint}</span>
    </a>
  );
}

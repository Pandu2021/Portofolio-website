/**
 * @file (en)/layout.tsx
 * Root layout for the English site (served at `/`).
 */
import type { ReactNode } from 'react';
import { RootDocument } from '@/components/RootDocument';
import { buildMetadata } from '@/lib/metadata';
import '../globals.css';

export { viewport } from '@/lib/metadata';
export const metadata = buildMetadata('en');

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>;
}

/**
 * @file (id)/layout.tsx
 * Root layout for the Indonesian site (served at `/id/`).
 */
import type { ReactNode } from 'react';
import { RootDocument } from '@/components/RootDocument';
import { buildMetadata } from '@/lib/metadata';
import '../globals.css';

export { viewport } from '@/lib/metadata';
export const metadata = buildMetadata('id');

export default function IndonesianRootLayout({ children }: { children: ReactNode }) {
  return <RootDocument locale="id">{children}</RootDocument>;
}

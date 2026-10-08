import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };

/**
 * Any unmatched URL renders the site's own 404 (with header, footer and
 * navigation) instead of a bare framework page.
 */
export default function CatchAll(): never {
  notFound();
}

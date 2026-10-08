import type { Metadata } from 'next';
import { SITE_NAME } from './site';

interface PageSeo {
  title: string;
  description: string;
  path: string;
}

/** Per-page metadata with canonical URL, Open Graph and X/Twitter cards. */
export function pageMetadata({ title, description, path }: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} - ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, type: 'website', locale: 'en_IN' },
    twitter: { card: 'summary_large_image', title: `${title} - ${SITE_NAME}`, description },
  };
}

/** Serialises JSON-LD safely for inline <script> (no "</script>" breakout). */
export function jsonLd(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}

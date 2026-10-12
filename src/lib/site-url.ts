/**
 * The site's public address. No imports, so the validated config, the page
 * metadata and the CLI scripts can all share it.
 *
 * `NEXT_PUBLIC_SITE_URL` wins whenever it is set. When it is not, a production
 * build uses the live domain - never localhost. The old default was localhost
 * everywhere, and because the variable was never set on Vercel the live site
 * told Google its pages lived at http://localhost:3000: in robots.txt, in every
 * sitemap entry, in every page's canonical tag and in the organisation's
 * structured data. Google cannot reach that address, so searching for the
 * domain found nothing.
 *
 * www, because the bare domain redirects there: a canonical address should be
 * the one that answers, not one that forwards.
 */
export const PRODUCTION_SITE_URL = 'https://www.gwdglobal.in';

export function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? PRODUCTION_SITE_URL : 'http://localhost:3000';
}

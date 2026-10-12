/** Site-wide navigation and identity constants (not CMS content). */

import { COPY, type DocOf } from '@/content/copy';
import { registerHref } from '@/features/register/intents';
import { resolveSiteUrl } from './site-url';

/** The public address - the live domain in production; see site-url.ts. */
export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = 'GWD Global';

export interface NavItem {
  label: string;
  href: string;
}

/** The default navigation; the live labels and order come from the admin (global.nav). */
export const NAV: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Products', href: '/products' },
  { label: 'GWD Sports', href: '/sports' },
  { label: 'Community', href: '/community' },
  { label: 'About', href: '/about' },
] as const;

export const isActivePath = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

export interface PageAction {
  label: string;
  href: string;
}

export type PageActions = DocOf<'global.actions'>;

/**
 * The header's single action changes with the page: each page has its own
 * next step (there is no site-wide "start a project" button). Labels and
 * links are edited in the admin (global.actions).
 */
export type PageSocial = DocOf<'global.social'>['home'];

/** Which page's Instagram and LinkedIn the corner icons point to (global.social). */
export function pageSocial(pathname: string, social: DocOf<'global.social'> = COPY['global.social'].value): PageSocial {
  if (pathname.startsWith('/services')) return social.services;
  if (pathname.startsWith('/products')) return social.products;
  if (pathname.startsWith('/sports')) return social.sports;
  if (pathname.startsWith('/community')) return social.community;
  if (pathname.startsWith('/contact')) return social.contact;
  if (pathname.startsWith('/about')) return social.about;
  return social.home;
}

export function pageAction(pathname: string, actions: PageActions = COPY['global.actions'].value): PageAction {
  const service = /^\/services\/([^/]+)/.exec(pathname);
  if (service?.[1]) return { label: actions.service.label, href: registerHref('service', { service: service[1] }) };
  if (pathname.startsWith('/services')) return actions.services;
  if (pathname.startsWith('/products')) return actions.products;
  if (pathname.startsWith('/sports')) return actions.sports;
  if (pathname.startsWith('/community')) return actions.community;
  if (pathname.startsWith('/contact')) return actions.contact;
  if (pathname.startsWith('/about')) return actions.about;
  return actions.home;
}

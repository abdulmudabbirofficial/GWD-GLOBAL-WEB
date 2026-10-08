/**
 * The editable-copy registry's shapes. Every piece of site text, every link
 * and every list a page shows has a key, a label for the admin, and a default
 * here in code; the admin can override any of them (stored in
 * `site_settings`), and pages read the merged value.
 */
export type CopyPage = 'global' | 'home' | 'services' | 'products' | 'sports' | 'community' | 'about' | 'contact';

export type ItemFieldType = 'text' | 'textarea' | 'url' | 'photo';

export interface ItemField {
  key: string;
  label: string;
  type: ItemFieldType;
  help?: string;
}

interface Base {
  page: CopyPage;
  section: string;
  label: string;
  help?: string;
}

export type TextField = Base & { type: 'text' | 'textarea'; value: string };
/** A site path ("/about") or an https:// URL. */
export type UrlField = Base & { type: 'url'; value: string };
export type ListField = Base & { type: 'list'; item: readonly ItemField[]; value: readonly Record<string, string>[] };

/**
 * A structured block of copy (a page section with nested lists). The admin
 * builds its form from the default's shape, and an override must keep that
 * shape: same keys, strings where strings are, lists of the same items.
 */
export type DocValue = string | readonly DocValue[] | { readonly [key: string]: DocValue };
export type DocField = Base & { type: 'doc'; value: DocValue; labels?: Record<string, string> };

export type CopyField = TextField | UrlField | ListField | DocField;

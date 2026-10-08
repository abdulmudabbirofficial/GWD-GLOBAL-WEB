import { aboutCopy } from './about';
import { communityCopy } from './community';
import { contactCopy } from './contact';
import { globalCopy } from './global';
import { homeCopy } from './home';
import { productsCopy } from './products';
import { servicesCopy } from './services';
import { sportsCopy } from './sports';
import type { CopyField } from './types';

export type { CopyField, CopyPage, DocField, DocValue, ItemField, ListField } from './types';

/** Every editable piece of site copy, by key. The admin lists these; pages read them through `siteCopy()`. */
export const COPY = {
  ...globalCopy,
  ...homeCopy,
  ...servicesCopy,
  ...productsCopy,
  ...sportsCopy,
  ...communityCopy,
  ...aboutCopy,
  ...contactCopy,
} satisfies Record<string, CopyField>;

type Copy = typeof COPY;
export type CopyKey = keyof Copy;
export type TextKey = { [K in CopyKey]: Copy[K]['type'] extends 'text' | 'textarea' | 'url' ? K : never }[CopyKey];
export type ListKey = { [K in CopyKey]: Copy[K]['type'] extends 'list' ? K : never }[CopyKey];
export type DocKey = { [K in CopyKey]: Copy[K]['type'] extends 'doc' ? K : never }[CopyKey];
export type DocOf<K extends DocKey> = Copy[K]['value'];

export const COPY_PAGES: { key: CopyField['page']; label: string }[] = [
  { key: 'global', label: 'Everywhere (header & footer)' },
  { key: 'home', label: 'Home' },
  { key: 'services', label: 'Services' },
  { key: 'products', label: 'Products' },
  { key: 'sports', label: 'GWD Sports' },
  { key: 'community', label: 'Community' },
  { key: 'about', label: 'About' },
  { key: 'contact', label: 'Contact' },
];

import type { CopyPage, DocField, DocValue } from './types';

/** A structured block of copy for a page section; see DocField. */
export function doc<V extends DocValue>(page: CopyPage, section: string, label: string, value: V, help?: string): DocField & { value: V } {
  return { page, section, label, type: 'doc', value, ...(help ? { help } : {}) };
}

/** Search-engine title and description for a page. */
export const seo = (page: CopyPage, title: string, description: string) =>
  doc(page, 'Search & sharing', 'Title and description (Google, WhatsApp and LinkedIn previews)', { title, description });

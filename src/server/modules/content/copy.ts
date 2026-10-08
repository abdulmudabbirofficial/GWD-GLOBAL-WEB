import 'server-only';
import { COPY, type DocKey, type DocOf, type ListKey, type TextKey } from '@/content/copy';
import { conformDoc } from '@/content/copy/conform';
import { content } from './service';

type Item = Record<string, string>;

/**
 * The site's copy with the admin's overrides applied. Text keys always return
 * a string, list keys an array and doc keys their block; an override of the
 * wrong shape is ignored, so a bad save can never break a page.
 */
export async function siteCopy() {
  const overrides = await content.settings();
  const text = (key: TextKey): string => {
    const v = overrides[key];
    return typeof v === 'string' ? v : (COPY[key].value as string);
  };
  const list = <T extends Item = Item>(key: ListKey): T[] => {
    const v = overrides[key];
    const valid = Array.isArray(v) && v.every((x) => x && typeof x === 'object' && !Array.isArray(x));
    return (valid ? v : COPY[key].value) as T[];
  };
  /** A structured block: the override if it still fits the block's shape, otherwise the default. */
  const doc = <K extends DocKey>(key: K): DocOf<K> => {
    const field = COPY[key];
    const v = overrides[key];
    const c = v === undefined ? null : conformDoc(v, field.value);
    return (c ?? field.value) as DocOf<K>;
  };
  return { text, list, doc };
}

export type SiteCopy = Awaited<ReturnType<typeof siteCopy>>;

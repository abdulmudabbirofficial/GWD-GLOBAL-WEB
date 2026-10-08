import type { CopyField, DocValue } from './types';

const MAX_TEXT = 6000;
const MAX_ITEMS = 80;
const LINK_KEY = /(^|[a-z])(href|url|link)$/i;

/** A site path, a same-page query or anchor, an https:// link, or mailto:/tel:. Never javascript: or protocol-relative. */
export function isSafeHref(v: string) {
  if (v === '') return true;
  if (v.startsWith('/')) return !v.startsWith('//') && !/\s/.test(v);
  if (v.startsWith('?') || v.startsWith('#')) return !/\s/.test(v);
  return /^https:\/\/[^\s<>"']+$/.test(v) || /^mailto:[^\s<>"']+$/.test(v) || /^tel:\+?[0-9 ()-]{4,}$/.test(v);
}

/** The combined shape of a list's items (items may leave optional keys out). */
function itemShape(list: readonly DocValue[]): DocValue {
  const first = list[0];
  if (first === undefined) return '';
  if (typeof first === 'string' || Array.isArray(first)) return first;
  const merged: Record<string, DocValue> = {};
  for (const item of list) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      for (const [k, v] of Object.entries(item)) if (!(k in merged)) merged[k] = v;
    }
  }
  return merged;
}

/**
 * Cleans a value to a template's shape, or returns null when it does not
 * fit. Unknown keys are dropped and links must be safe.
 */
export function conformDoc(value: unknown, template: DocValue, key = '', inList = false): DocValue | null {
  if (typeof template === 'string') {
    if (typeof value !== 'string' || value.length > MAX_TEXT) return null;
    if (LINK_KEY.test(key) && !isSafeHref(value.trim())) return null;
    return value;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;
    const shape = itemShape(template);
    const out: DocValue[] = [];
    for (const v of value) {
      const c = conformDoc(v, shape, key, true);
      if (c === null) return null;
      out.push(c);
    }
    return out;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: Record<string, DocValue> = {};
  const source = value as Record<string, unknown>;
  for (const [k, t] of Object.entries(template as Record<string, DocValue>)) {
    if (!(k in source)) {
      // Outside lists a missing key keeps its default; inside a list it was optional for that item, so it stays absent.
      if (!inList) out[k] = t;
      continue;
    }
    const c = conformDoc(source[k], t, k, inList);
    if (c === null) return null;
    out[k] = c;
  }
  return out;
}

/** Validates an override for a copy field. Returns the cleaned value, or an error message. */
export function validateCopy(field: CopyField, value: unknown): { ok: true; value: unknown } | { ok: false; message: string } {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const max = field.type === 'text' ? 400 : 4000;
      if (typeof value !== 'string') return { ok: false, message: 'Expected text.' };
      if (value.length > max) return { ok: false, message: `Keep it under ${max} characters.` };
      return { ok: true, value };
    }
    case 'url': {
      if (typeof value !== 'string' || value.length > 600) return { ok: false, message: 'Expected a link.' };
      const v = value.trim();
      if (!isSafeHref(v)) return { ok: false, message: 'Use a site path ("/about"), a form link ("?register=member") or an https:// link.' };
      return { ok: true, value: v };
    }
    case 'list': {
      if (!Array.isArray(value) || value.length > MAX_ITEMS) return { ok: false, message: 'Expected a list.' };
      const keys = new Map(field.item.map((i) => [i.key, i]));
      const out: Record<string, string>[] = [];
      for (const raw of value) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, message: 'Each item must be a group of fields.' };
        const item: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          const spec = keys.get(k);
          if (!spec) continue;
          if (typeof v !== 'string' || v.length > MAX_TEXT) return { ok: false, message: `“${spec.label}” must be text.` };
          if (spec.type === 'url' && !isSafeHref(v.trim())) return { ok: false, message: `“${spec.label}” must be a site path or an https:// link.` };
          item[k] = spec.type === 'url' ? v.trim() : v;
        }
        out.push(item);
      }
      return { ok: true, value: out };
    }
    case 'doc': {
      const c = conformDoc(value, field.value);
      return c === null ? { ok: false, message: 'This block no longer matches its layout. Reload the editor and try again.' } : { ok: true, value: c };
    }
  }
}

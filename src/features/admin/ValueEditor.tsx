'use client';

import type { ItemFieldType } from '@/content/copy/types';
import { AlbumPicker, ImageField } from './ui';
import styles from './Admin.module.css';

/**
 * Builds a form from a block's shape: strings become inputs (long ones text
 * areas, links get a link field, photo names an album picker), objects
 * become groups and lists become items you can add, remove and reorder.
 */
export type Value = string | Value[] | { [key: string]: Value };

export interface Hints {
  /** Per-key input types (from a list field's item spec). */
  types?: Record<string, ItemFieldType>;
  labels?: Record<string, string>;
}

const LABELS: Record<string, string> = {
  label: 'Small label above the headline',
  title: 'Headline',
  titleSecond: 'Headline, second line',
  lead: 'Intro text',
  body: 'Text',
  href: 'Link',
  primary: 'Main button',
  secondary: 'Second button',
  cta: 'Button',
  items: 'Items',
  facts: 'Facts',
  value: 'Value',
  when: 'When',
  highlight: 'Major milestone',
  photos: 'Photos',
  ring: 'Photos circling the 3D world',
  brandLine: 'Line under the logo',
  scrollCue: 'Scroll hint',
  kicker: 'Line above the headline',
  proof: 'Proof line',
  note: 'Small note',
  stat: 'Number (key from Numbers)',
  explore: 'Word before each name on “explore” links',
  all: 'Button to all services',
  steps: 'Steps',
  milestones: 'Milestones',
  stages: 'Stages',
  statement: 'Statement',
  mission: 'Mission',
  vision: 'Vision',
  notes: 'Notes under founders',
  slug: 'Person (slug from Team)',
  pillars: 'Systems',
  points: 'Points',
  render: 'Image (studio render)',
  name: 'Name',
  line: 'Line',
  alt: 'Image description',
  editions: 'Card editions',
  clips: 'Films',
  src: 'Video file (/media/…)',
  poster: 'Poster image',
  shape: 'Shape (wide or tall)',
  crest: 'Crest image',
  org: 'Organisation',
  who: 'Who',
  what: 'What they get',
  terms: 'Terms',
  hint: 'Hint',
  play: 'Play button',
  work: 'Work-with-us links',
  hq: 'Headquarters label',
  time: 'Local time label',
  email: 'Email label',
  groups: 'Service groups',
  intro: 'Intro',
  rights: 'Rights line (after © year)',
  credit: 'Credit line',
  instagramUrl: 'Instagram link',
  linkedinUrl: 'LinkedIn link',
  caption: 'Caption',
};

const humanize = (key: string) => LABELS[key] ?? (key.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()) || 'Item');

const ALBUM_KEYS = new Set(['photos', 'ring', 'photo', 'main', 'side1', 'side2']);
const LONG = /^(body|lead|description|note|statement|mission|vision|summary|detail|communityLine|line|what|terms|proof)$/;

type Kind = 'album' | 'image' | 'check' | 'url' | 'textarea' | 'text';

function kindOf(key: string, sample: string, hints?: Hints): Kind {
  const t = hints?.types?.[key];
  if (t === 'photo') return 'album';
  if (t === 'url') return 'url';
  if (t === 'textarea') return 'textarea';
  if (t === 'text') return 'text';
  if (ALBUM_KEYS.has(key)) return 'album';
  if (/^(crest|poster|logo|image)$/i.test(key)) return 'image';
  if (key === 'highlight') return 'check';
  if (/(^|[a-z])(href|url|link)$/i.test(key)) return 'url';
  if (LONG.test(key) || sample.length > 90) return 'textarea';
  return 'text';
}

/** A blank item with the same shape (for "Add"). */
export function blank(shape: Value): Value {
  if (typeof shape === 'string') return '';
  if (Array.isArray(shape)) return [];
  return Object.fromEntries(Object.entries(shape).map(([k, v]) => [k, blank(v)]));
}

/** The merged shape of a list's items. */
export function shapeOf(list: Value[]): Value {
  const first = list[0];
  if (first === undefined) return '';
  if (typeof first === 'string' || Array.isArray(first)) return first;
  const merged: Record<string, Value> = {};
  for (const item of list) if (item && typeof item === 'object' && !Array.isArray(item)) for (const [k, v] of Object.entries(item)) if (!(k in merged)) merged[k] = v;
  return merged;
}

interface Props {
  value: Value;
  template: Value;
  onChange: (v: Value) => void;
  name?: string;
  hints?: Hints;
  disabled?: boolean;
  /** Arrays of strings under an album key pick photos. */
  parentKey?: string;
}

export function ValueEditor({ value, template, onChange, name = '', hints, disabled, parentKey }: Props) {
  const label = hints?.labels?.[name] ?? humanize(name);

  if (typeof template === 'string') {
    const v = typeof value === 'string' ? value : '';
    const kind = kindOf(name || parentKey || '', template, hints);
    const input =
      kind === 'album' ? (
        <AlbumPicker value={v} onChange={onChange} disabled={disabled} />
      ) : kind === 'image' ? (
        <ImageField value={v} onChange={onChange} disabled={disabled} />
      ) : kind === 'check' ? (
        <label className={styles.check}>
          <input type="checkbox" checked={/^(yes|true|1)$/i.test(v)} onChange={(e) => onChange(e.target.checked ? 'yes' : '')} disabled={disabled} />
          {label}
        </label>
      ) : kind === 'textarea' ? (
        <textarea className={styles.textarea} value={v} rows={Math.min(8, Math.max(3, Math.ceil(v.length / 90)))} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      ) : (
        <input className={styles.input} value={v} type="text" inputMode={kind === 'url' ? 'url' : undefined} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      );
    if (kind === 'check') return input;
    return (
      <label className={styles.field}>
        {name && <span>{label}</span>}
        {kind === 'url' && <span className={styles.help}>A page (/about), a built-in form (?register=member) or an https:// link.</span>}
        {input}
      </label>
    );
  }

  if (Array.isArray(template)) {
    const list = Array.isArray(value) ? value : [];
    const shape = shapeOf(template.length ? template : list);
    const set = (i: number, v: Value) => onChange(list.map((x, k) => (k === i ? v : x)));
    const move = (i: number, d: number) => {
      const next = [...list];
      const [x] = next.splice(i, 1);
      next.splice(i + d, 0, x!);
      onChange(next);
    };
    const simple = typeof shape === 'string';
    return (
      <div className={styles.group}>
        <span className={styles.groupLabel}>{label}</span>
        <div className={styles.items}>
          {list.map((item, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemBar}>
                <span>
                  {simple ? '' : `${i + 1}. `}
                  {!simple && typeof item === 'object' && !Array.isArray(item) ? String(Object.values(item).find((x) => typeof x === 'string' && x) ?? '').slice(0, 60) : ''}
                </span>
                <span className={styles.itemTools}>
                  <button type="button" className={styles.iconBtn} disabled={disabled || i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" className={styles.iconBtn} disabled={disabled || i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                    ↓
                  </button>
                  <button type="button" className={`${styles.iconBtn} ${styles.danger}`} disabled={disabled} onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="Remove">
                    Remove
                  </button>
                </span>
              </div>
              <ValueEditor value={item} template={shape} onChange={(v) => set(i, v)} hints={hints} disabled={disabled} parentKey={simple ? name : undefined} />
            </div>
          ))}
        </div>
        <button type="button" className={styles.addBtn} disabled={disabled} onClick={() => onChange([...list, blank(shape)])}>
          + Add {simple ? (ALBUM_KEYS.has(name) ? 'photo' : 'line') : 'item'}
        </button>
      </div>
    );
  }

  const obj = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const body = (
    <div className={styles.stack} style={{ gap: 'var(--sp-4)' }}>
      {Object.entries(template).map(([k, t]) => (
        <ValueEditor key={k} name={k} value={obj[k] ?? blank(t)} template={t} onChange={(v) => onChange({ ...obj, [k]: v })} hints={hints} disabled={disabled} />
      ))}
    </div>
  );
  if (!name) return body;
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      {body}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CopyField, CopyPage } from '@/content/copy/types';
import { api, can, type Viewer } from './api';
import { ValueEditor, type Hints, type Value } from './ValueEditor';
import { SaveBar, useToast, when } from './ui';
import styles from './Admin.module.css';

type Field = CopyField & { key: string };
export interface Overview {
  pages: { key: CopyPage; label: string }[];
  fields: Field[];
  images: { name: string; url: string; width: number; height: number }[];
  overrides: Record<string, { value: unknown; updatedAt: string; by: string | null }>;
}

export function useOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    void api<Overview>('/api/v1/admin/settings').then((r) => (r.ok ? setData(r.data) : setError(r.message)));
  }, []);
  return { data, setData, error };
}

/** Every page's words, links and photo choices, section by section. */
export function PagesPanel({ viewer }: { viewer: Viewer }) {
  const { data, setData, error } = useOverview();
  const [page, setPage] = useState<CopyPage>('home');
  const editable = can(viewer, 'content:publish');

  const sections = useMemo(() => {
    const map = new Map<string, Field[]>();
    for (const f of data?.fields ?? []) {
      if (f.page !== page) continue;
      map.set(f.section, [...(map.get(f.section) ?? []), f]);
    }
    return [...map.entries()];
  }, [data, page]);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Pages</h1>
          <p className={styles.lead}>
            Every headline, paragraph, button and link on the site. Changes go live as soon as you save (pages refresh within a few seconds). Reset puts the
            original wording back.
          </p>
        </div>
      </div>
      {!editable && <p className={styles.error}>Your role can read but not change the site’s words. Ask an admin for publishing rights.</p>}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.tabs} role="group" aria-label="Page">
        {data?.pages.map((p) => (
          <button key={p.key} type="button" className={styles.tab} aria-pressed={page === p.key} onClick={() => setPage(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      {!data && !error && <p className={styles.muted}>Loading…</p>}
      <div className={styles.stack}>
        {sections.map(([section, fields]) => (
          <div key={section} className={styles.stack}>
            <h2 className={styles.section}>{section}</h2>
            {fields.map((f) => (
              <FieldCard
                key={f.key}
                field={f}
                override={data!.overrides[f.key]}
                editable={editable}
                onSaved={(value, removed) =>
                  setData((d) => {
                    if (!d) return d;
                    const overrides = { ...d.overrides };
                    if (removed) delete overrides[f.key];
                    else overrides[f.key] = { value, updatedAt: new Date().toISOString(), by: viewer.user.name };
                    return { ...d, overrides };
                  })
                }
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function FieldCard({
  field,
  override,
  editable,
  onSaved,
}: {
  field: Field;
  override?: { value: unknown; updatedAt: string; by: string | null };
  editable: boolean;
  onSaved: (value: unknown, removed?: boolean) => void;
}) {
  const toast = useToast();
  const base = (override?.value ?? field.value) as Value;
  const [value, setValue] = useState<Value>(base);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(value) !== JSON.stringify(base);

  // A list field's items follow its spec; a doc follows its own default's shape.
  const { template, hints } = useMemo((): { template: Value; hints?: Hints } => {
    if (field.type === 'list') {
      return {
        template: [Object.fromEntries(field.item.map((i) => [i.key, '']))],
        hints: { types: Object.fromEntries(field.item.map((i) => [i.key, i.type])), labels: Object.fromEntries(field.item.map((i) => [i.key, i.label])) },
      };
    }
    if (field.type === 'doc') return { template: field.value as Value };
    return { template: '', hints: { types: { value: field.type === 'url' ? 'url' : field.type === 'textarea' ? 'textarea' : 'text' } } };
  }, [field]);

  const save = async () => {
    setSaving(true);
    setError('');
    const r = await api<{ value: unknown }>(`/api/v1/admin/settings/${encodeURIComponent(field.key)}`, { method: 'PUT', body: JSON.stringify({ value }) });
    setSaving(false);
    if (!r.ok) return setError(r.message);
    setValue(r.data.value as Value);
    onSaved(r.data.value);
    toast('Saved. The page updates within a few seconds.');
  };
  const reset = async () => {
    if (!window.confirm('Put this back to the original wording?')) return;
    setSaving(true);
    setError('');
    const r = await api(`/api/v1/admin/settings/${encodeURIComponent(field.key)}`, { method: 'DELETE' });
    setSaving(false);
    if (!r.ok) return setError(r.message);
    setValue(field.value as Value);
    onSaved(null, true);
    toast('Back to the original.');
  };

  return (
    <section className={styles.card} aria-label={field.label}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardTitle}>{field.label}</h3>
          {field.help && <p className={styles.help}>{field.help}</p>}
        </div>
        {override ? <span className={styles.badge}>Edited</span> : <span className={`${styles.badge} ${styles.badgeQuiet}`}>Original</span>}
      </div>
      {field.type === 'text' || field.type === 'textarea' || field.type === 'url' ? (
        <ValueEditor value={value} template="" name="value" hints={{ ...hints, labels: { value: 'Text' } }} onChange={setValue} disabled={!editable} />
      ) : (
        <ValueEditor value={value} template={template} name={field.type === 'list' ? 'items' : ''} onChange={setValue} hints={hints} disabled={!editable} />
      )}
      {error && <p className={styles.error}>{error}</p>}
      {editable && (
        <SaveBar
          dirty={dirty}
          saving={saving}
          note={override ? `Edited${override.by ? ` by ${override.by}` : ''}, ${when(override.updatedAt)}` : 'Showing the original wording'}
          onSave={save}
          onReset={override ? reset : undefined}
        />
      )}
    </section>
  );
}

/** Replacement images for the studio renders (dioramas, office, mountain). */
export function ImagesPanel({ viewer }: { viewer: Viewer }) {
  const { data, setData, error } = useOverview();
  const [q, setQ] = useState('');
  const editable = can(viewer, 'content:publish');
  const toast = useToast();

  const replace = async (name: string, file: File | undefined) => {
    if (!file) return;
    const { uploadImage } = await import('./api');
    const up = await uploadImage(file);
    if (!up.ok) return toast(up.message);
    if (!up.data.width || !up.data.height) return toast('Could not read that image’s size. Try a PNG, JPEG or WebP.');
    const value = { url: up.data.url, width: up.data.width, height: up.data.height };
    const r = await api(`/api/v1/admin/settings/${encodeURIComponent(`image:${name}`)}`, { method: 'PUT', body: JSON.stringify({ value }) });
    if (!r.ok) return toast(r.message);
    setData((d) => (d ? { ...d, overrides: { ...d.overrides, [`image:${name}`]: { value, updatedAt: new Date().toISOString(), by: viewer.user.name } } } : d));
    toast('Image replaced. Pages update within a few seconds.');
  };
  const reset = async (name: string) => {
    if (!window.confirm('Go back to the original render?')) return;
    const r = await api(`/api/v1/admin/settings/${encodeURIComponent(`image:${name}`)}`, { method: 'DELETE' });
    if (!r.ok) return toast(r.message);
    setData((d) => {
      if (!d) return d;
      const overrides = { ...d.overrides };
      delete overrides[`image:${name}`];
      return { ...d, overrides };
    });
    toast('Back to the original render.');
  };

  const group = (n: string) =>
    n.startsWith('svc-') ? 'Services' : n.startsWith('prod-') ? 'Products' : n.startsWith('step-') ? 'How we work' : n.startsWith('sports-') ? 'GWD Sports' : 'Brand and About';
  const list = (data?.images ?? []).filter((i) => !q || i.name.includes(q.toLowerCase()));

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Images</h1>
          <p className={styles.lead}>
            The studio renders around the site: services, products, the office and more. Upload a replacement for any of them; Reset brings the original back.
            Community and team photos are edited under Album and Team.
          </p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.toolbar}>
        <input className={`${styles.input} ${styles.search}`} placeholder="Filter by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter images" />
      </div>
      {['Products', 'Services', 'GWD Sports', 'How we work', 'Brand and About'].map((g) => {
        const items = list.filter((i) => group(i.name) === g);
        if (!items.length) return null;
        return (
          <div key={g} className={styles.stack} style={{ marginBottom: 'var(--sp-7)' }}>
            <h2 className={styles.section}>{g}</h2>
            <div className={styles.thumbs}>
              {items.map((img) => {
                const o = data!.overrides[`image:${img.name}`];
                const src = (o?.value as { url?: string } | undefined)?.url ?? img.url.replace(/\.webp$/, '-sm.webp');
                return (
                  <div key={img.name} className={styles.thumb}>
                    <div className={styles.thumbImg}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" loading="lazy" onError={(e) => ((e.currentTarget as HTMLImageElement).src = img.url)} />
                    </div>
                    <div className={styles.cardHead}>
                      <span className={styles.thumbName}>{img.name}</span>
                      {o && <span className={styles.badge}>Replaced</span>}
                    </div>
                    {editable && (
                      <div className={styles.imageField}>
                        <label className={styles.addBtn} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                          Upload replacement
                          <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(e) => replace(img.name, e.target.files?.[0])} />
                        </label>
                        {o && (
                          <button type="button" className={styles.iconBtn} onClick={() => reset(img.name)}>
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api, can, type MediaAsset, type Viewer } from './api';
import type { CollectionSpec, FieldSpec } from './collections-spec';
import { ImageField, SaveBar, useAlbum, useToast } from './ui';
import styles from './Admin.module.css';

type Row = Record<string, unknown> & { id: string };

/** A collection: its rows, and a form for one of them. */
export function CollectionPanel({ spec, viewer }: { spec: CollectionSpec; viewer: Viewer }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Row | 'new' | null>(null);
  const [q, setQ] = useState('');
  const { reload: reloadAlbum } = useAlbum();

  const load = useCallback(() => {
    void api<Row[]>(`/api/v1/admin/content/${spec.key}`).then((r) => (r.ok ? (setRows(r.data), setError('')) : setError(r.message)));
  }, [spec.key]);
  // The panel is keyed by collection, so switching collections starts it afresh.
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !term || `${spec.title(r)} ${spec.subtitle?.(r) ?? ''}`.toLowerCase().includes(term));
  }, [rows, q, spec]);

  if (open) {
    return (
      <RowEditor
        spec={spec}
        viewer={viewer}
        row={open === 'new' ? null : open}
        onClose={() => setOpen(null)}
        onSaved={(row, deleted) => {
          setRows((rs) => {
            const list = rs ?? [];
            if (deleted) return list.filter((r) => r.id !== row.id);
            return list.some((r) => r.id === row.id) ? list.map((r) => (r.id === row.id ? row : r)) : [...list, row];
          });
          if (spec.key === 'gallery') reloadAlbum();
          setOpen(deleted ? null : row);
        }}
      />
    );
  }

  const thumbKey = spec.fields.find((f) => f.kind === 'image')?.key;
  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{spec.label}</h1>
          <p className={styles.lead}>{spec.help}</p>
        </div>
        {can(viewer, 'content:write') && (
          <Button type="button" onClick={() => setOpen('new')}>
            Add {spec.one}
          </Button>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.toolbar}>
        <input className={`${styles.input} ${styles.search}`} placeholder={`Search ${spec.label.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        {rows && <span className={styles.muted}>{rows.length} in total</span>}
      </div>
      {!rows && !error && <p className={styles.muted}>Loading…</p>}
      {rows && (
        <div className={styles.rows}>
          {filtered.map((r) => (
            <button key={r.id} type="button" className={styles.row} onClick={() => setOpen(r)}>
              <span className={styles.rowLead}>
                {thumbKey && typeof r[thumbKey] === 'string' && r[thumbKey] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(r.smallUrl as string) || (r[thumbKey] as string)} alt="" className={styles.rowThumb} loading="lazy" />
                ) : null}
                <span style={{ minWidth: 0 }}>
                  <span className={styles.rowTitle}>{spec.title(r) || '(untitled)'}</span>
                  {spec.subtitle && <span className={styles.rowSub}>{spec.subtitle(r)}</span>}
                </span>
              </span>
              {r.isPublished === false ? <span className={`${styles.badge} ${styles.badgeQuiet}`}>Hidden</span> : <span className={styles.muted}>Edit →</span>}
            </button>
          ))}
          {filtered.length === 0 && <p className={styles.muted} style={{ padding: 'var(--sp-4)' }}>Nothing matches.</p>}
        </div>
      )}
    </>
  );
}

/* ── One row ─────────────────────────────────────────────── */

const toLocalInput = (v: unknown) => {
  if (typeof v !== 'string' || !v) return '';
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function initial(spec: CollectionSpec, row: Row | null): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of spec.fields) {
    const v = row?.[f.key];
    if (f.kind === 'boolean') out[f.key] = typeof v === 'boolean' ? v : f.key === 'isPublished';
    else if (f.kind === 'number') out[f.key] = typeof v === 'number' ? String(v) : f.key === 'sortOrder' ? '0' : '';
    else if (f.kind === 'strings') out[f.key] = Array.isArray(v) ? v : [];
    else if (f.kind === 'pairs') out[f.key] = Array.isArray(v) ? v : [];
    else if (f.kind === 'datetime') out[f.key] = toLocalInput(v);
    else if (f.kind === 'select') out[f.key] = typeof v === 'string' ? v : (f.options?.[0]?.value ?? '');
    else if (f.kind === 'color') out[f.key] = typeof v === 'string' ? v : '#e63946';
    else out[f.key] = typeof v === 'string' ? v : '';
  }
  if (spec.key === 'gallery') {
    out.width = row?.width ?? null;
    out.height = row?.height ?? null;
    out.smallUrl = row?.smallUrl ?? null;
  }
  return out;
}

/** The form's values as the API expects them: numbers, nulls and ISO dates. */
function payload(spec: CollectionSpec, form: Record<string, unknown>, original: Record<string, unknown>, isNew: boolean) {
  const out: Record<string, unknown> = {};
  for (const f of spec.fields) {
    let v = form[f.key];
    if (f.kind === 'number') v = v === '' ? undefined : Number(v);
    else if (f.kind === 'datetime') v = v ? new Date(String(v)).toISOString() : f.nullable ? null : undefined;
    else if (f.kind === 'strings') v = (v as string[]).map((s) => s.trim()).filter(Boolean);
    else if (f.kind === 'pairs') v = (v as Record<string, string>[]).filter((p) => Object.values(p).some((x) => x.trim()));
    else if (typeof v === 'string') {
      v = v.trim();
      if (v === '' && f.nullable) v = null;
      else if (v === '' && !f.required) v = undefined;
    }
    if (v === undefined) continue;
    if (!isNew && JSON.stringify(v) === JSON.stringify(original[f.key])) continue;
    out[f.key] = v;
  }
  if (spec.key === 'gallery') {
    for (const k of ['width', 'height', 'smallUrl'] as const) {
      if (isNew || JSON.stringify(form[k]) !== JSON.stringify(original[k])) if (form[k] !== undefined) out[k] = form[k];
    }
  }
  return out;
}

function RowEditor({ spec, viewer, row, onClose, onSaved }: { spec: CollectionSpec; viewer: Viewer; row: Row | null; onClose: () => void; onSaved: (row: Row, deleted?: boolean) => void }) {
  const toast = useToast();
  const original = useMemo(() => initial(spec, row), [spec, row]);
  const [form, setForm] = useState(original);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const writable = can(viewer, 'content:write');
  const publisher = can(viewer, 'content:publish');
  const dirty = JSON.stringify(form) !== JSON.stringify(original);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError('');
    const body = payload(spec, form, original, !row);
    if (!publisher) delete body.isPublished;
    const r = row
      ? await api<Row>(`/api/v1/admin/content/${spec.key}/${row.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      : await api<Row>(`/api/v1/admin/content/${spec.key}`, { method: 'POST', body: JSON.stringify(body) });
    setSaving(false);
    if (!r.ok) return setError(r.message);
    onSaved(r.data);
    toast(row ? 'Saved. The site updates within a few seconds.' : `${spec.one[0]!.toUpperCase()}${spec.one.slice(1)} added.`);
  };
  const remove = async () => {
    if (!row || !window.confirm(`Delete this ${spec.one}? This cannot be undone.`)) return;
    setSaving(true);
    const r = await api(`/api/v1/admin/content/${spec.key}/${row.id}`, { method: 'DELETE' });
    setSaving(false);
    if (!r.ok) return setError(r.message);
    onSaved(row, true);
    toast('Deleted.');
  };

  return (
    <>
      <button type="button" className={styles.back} onClick={onClose}>
        ← All {spec.label.toLowerCase()}
      </button>
      <div className={styles.head} style={{ marginTop: 'var(--sp-4)' }}>
        <h1 className={styles.title}>{row ? spec.title(row) || 'Edit' : `New ${spec.one}`}</h1>
      </div>
      {!publisher && writable && <p className={styles.muted}>As an editor, new items are saved hidden; an admin publishes them.</p>}
      <section className={styles.card}>
        <div className={styles.grid2}>
          {spec.fields.map((f) => (
            <div key={f.key} style={f.kind === 'textarea' || f.kind === 'pairs' || f.kind === 'strings' || f.kind === 'image' ? { gridColumn: '1 / -1' } : undefined}>
              <FieldInput
                f={f}
                value={form[f.key]}
                onChange={(v) => set(f.key, v)}
                onPick={
                  spec.key === 'gallery' && f.key === 'url'
                    ? (m: MediaAsset) => setForm((x) => ({ ...x, url: m.url, width: m.width, height: m.height, smallUrl: null }))
                    : undefined
                }
                disabled={!writable || (f.key === 'isPublished' && !publisher)}
              />
            </div>
          ))}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {writable && (
          <SaveBar
            dirty={dirty || !row}
            saving={saving}
            note={row ? 'Saved' : ''}
            onSave={save}
            onReset={row && publisher ? remove : undefined}
            resetLabel={`Delete ${spec.one}`}
          />
        )}
      </section>
    </>
  );
}

function FieldInput({ f, value, onChange, onPick, disabled }: { f: FieldSpec; value: unknown; onChange: (v: unknown) => void; onPick?: (m: MediaAsset) => void; disabled?: boolean }) {
  const label = (
    <>
      <span>
        {f.label}
        {f.required ? ' *' : ''}
      </span>
      {f.help && <span className={styles.help}>{f.help}</span>}
    </>
  );
  switch (f.kind) {
    case 'boolean':
      return (
        <label className={styles.check}>
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
          {f.label}
        </label>
      );
    case 'select':
      return (
        <label className={styles.field}>
          {label}
          <select className={styles.select} value={String(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    case 'textarea':
      return (
        <label className={styles.field}>
          {label}
          <textarea className={styles.textarea} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} disabled={disabled} rows={4} />
        </label>
      );
    case 'image':
      return (
        <div className={styles.field}>
          {label}
          <ImageField value={String(value ?? '')} onChange={onChange} onPick={onPick} disabled={disabled} />
        </div>
      );
    case 'color':
      return (
        <label className={styles.field}>
          {label}
          <span className={styles.imageField}>
            <input type="color" value={String(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
            <input className={styles.input} style={{ maxWidth: '9rem' }} value={String(value)} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
          </span>
        </label>
      );
    case 'strings': {
      const list = (value as string[]) ?? [];
      return (
        <div className={styles.group}>
          <span className={styles.groupLabel}>{f.label}</span>
          {f.help && <span className={styles.help}>{f.help}</span>}
          {list.map((s, i) => (
            <div key={i} className={styles.imageField}>
              <input className={styles.input} style={{ flex: 1 }} value={s} onChange={(e) => onChange(list.map((x, k) => (k === i ? e.target.value : x)))} disabled={disabled} />
              <button type="button" className={`${styles.iconBtn} ${styles.danger}`} disabled={disabled} onClick={() => onChange(list.filter((_, k) => k !== i))}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} disabled={disabled} onClick={() => onChange([...list, ''])}>
            + Add
          </button>
        </div>
      );
    }
    case 'pairs': {
      const list = (value as Record<string, string>[]) ?? [];
      const [a, b] = f.pair!;
      return (
        <div className={styles.group}>
          <span className={styles.groupLabel}>{f.label}</span>
          {list.map((p, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.grid2}>
                {[a, b].map((k) => (
                  <label key={k.key} className={styles.field}>
                    <span>{k.label}</span>
                    <input
                      className={styles.input}
                      value={p[k.key] ?? ''}
                      onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, [k.key]: e.target.value } : x)))}
                      disabled={disabled}
                    />
                  </label>
                ))}
              </div>
              <button type="button" className={`${styles.iconBtn} ${styles.danger}`} style={{ justifySelf: 'end' }} disabled={disabled} onClick={() => onChange(list.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} disabled={disabled} onClick={() => onChange([...list, { [a.key]: '', [b.key]: '' }])}>
            + Add
          </button>
        </div>
      );
    }
    default:
      return (
        <label className={styles.field}>
          {label}
          <input
            className={styles.input}
            type={f.kind === 'number' ? 'number' : f.kind === 'datetime' ? 'datetime-local' : 'text'}
            step={f.kind === 'number' ? 'any' : undefined}
            inputMode={f.kind === 'url' ? 'url' : undefined}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </label>
      );
  }
}

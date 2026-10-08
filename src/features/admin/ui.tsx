'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { api, uploadImage, type MediaAsset } from './api';
import styles from './Admin.module.css';

/* ── Notices ─────────────────────────────────────────────── */

const ToastCtx = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef(0);
  const show = useCallback((m: string) => {
    setMessage(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(''), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite">{message && <p className={styles.toast}>{message}</p>}</div>
    </ToastCtx.Provider>
  );
}

/* ── Album (community photos), loaded once ───────────────── */

export interface AlbumPhoto {
  id: string;
  slug: string;
  url: string;
  smallUrl: string | null;
  alt: string;
  width: number;
  height: number;
  tag: string;
  isPublished: boolean;
}

const AlbumCtx = createContext<{ photos: AlbumPhoto[]; reload: () => void }>({ photos: [], reload: () => {} });
export const useAlbum = () => useContext(AlbumCtx);

export function AlbumProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const reload = useCallback(() => {
    void api<AlbumPhoto[]>('/api/v1/admin/content/gallery').then((r) => r.ok && setPhotos(r.data));
  }, []);
  useEffect(reload, [reload]);
  return <AlbumCtx.Provider value={{ photos, reload }}>{children}</AlbumCtx.Provider>;
}

/** Picks one album photo by its name (slug). */
export function AlbumPicker({ value, onChange, disabled }: { value: string; onChange: (slug: string) => void; disabled?: boolean }) {
  const { photos } = useAlbum();
  const [open, setOpen] = useState(false);
  const current = photos.find((p) => p.slug === value);
  return (
    <div className={styles.group}>
      <div className={styles.imageField}>
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.smallUrl ?? current.url} alt="" className={styles.preview} />
        ) : (
          <span className={styles.preview} aria-hidden="true" />
        )}
        <span className={styles.help}>{current ? current.alt || current.slug : value ? `“${value}” is not in the album` : 'No photo chosen'}</span>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setOpen((o) => !o)}>
          {open ? 'Done' : 'Choose photo'}
        </Button>
      </div>
      {open && (
        <div className={styles.pickGrid}>
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.pick}
              aria-pressed={p.slug === value}
              title={p.alt}
              onClick={() => {
                onChange(p.slug);
                setOpen(false);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.smallUrl ?? p.url} alt="" loading="lazy" />
              <span>{p.slug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Images: upload, or choose from the library ──────────── */

export function useMediaLibrary(open: boolean) {
  const [items, setItems] = useState<MediaAsset[] | null>(null);
  useEffect(() => {
    if (!open || items) return;
    void api<MediaAsset[]>('/api/v1/admin/media').then((r) => setItems(r.ok ? r.data : []));
  }, [open, items]);
  return items;
}

/** An image URL with upload and library buttons. Calls onPick with the asset so callers can keep its size. */
export function ImageField({
  value,
  onChange,
  onPick,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  onPick?: (asset: MediaAsset) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [library, setLibrary] = useState(false);
  const items = useMediaLibrary(library);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    const r = await uploadImage(file);
    setBusy(false);
    if (input.current) input.current.value = '';
    if (!r.ok) return setError(r.message);
    onChange(r.data.url);
    onPick?.(r.data);
  };

  return (
    <div className={styles.group}>
      <div className={styles.imageField}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={styles.preview} />
        ) : (
          <span className={styles.preview} aria-hidden="true" />
        )}
        <input className={styles.input} style={{ flex: '1 1 14rem' }} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="/api/v1/media/… or /media/…" />
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" hidden onChange={(e) => upload(e.target.files?.[0])} />
        <Button type="button" size="sm" disabled={disabled || busy} onClick={() => input.current?.click()}>
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setLibrary((o) => !o)}>
          {library ? 'Close library' : 'Library'}
        </Button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {library && (
        <div className={styles.pickGrid}>
          {items === null && <p className={styles.muted}>Loading…</p>}
          {items?.length === 0 && <p className={styles.muted}>No uploads yet.</p>}
          {items?.map((m) => (
            <button
              key={m.id}
              type="button"
              className={styles.pick}
              aria-pressed={m.url === value}
              title={m.originalName}
              onClick={() => {
                onChange(m.url);
                onPick?.(m);
                setLibrary(false);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" loading="lazy" />
              <span>{m.originalName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SaveBar({
  dirty,
  saving,
  note,
  onSave,
  onReset,
  resetLabel = 'Reset to default',
  disabled,
}: {
  dirty: boolean;
  saving: boolean;
  note?: string;
  onSave: () => void;
  onReset?: () => void;
  resetLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className={styles.bar}>
      <span className={`${styles.barNote} ${dirty ? styles.dirty : ''}`}>{dirty ? 'Unsaved changes' : note}</span>
      {onReset && (
        <Button type="button" size="sm" variant="ghost" disabled={saving || disabled} onClick={onReset}>
          {resetLabel}
        </Button>
      )}
      <Button type="button" size="sm" disabled={!dirty || saving || disabled} onClick={onSave}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}

export const when = (d: string | Date) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

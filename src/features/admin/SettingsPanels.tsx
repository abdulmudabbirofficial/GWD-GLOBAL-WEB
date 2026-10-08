'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { api, can, ROLE_LABEL, type Viewer } from './api';
import { SaveBar, useToast, when } from './ui';
import styles from './Admin.module.css';

/* ── Company profile ─────────────────────────────────────── */

const COMPANY_FIELDS: { key: string; label: string; help?: string }[] = [
  { key: 'legalName', label: 'Legal name' },
  { key: 'brandName', label: 'Brand name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'motto', label: 'Motto', help: 'Shown at the end of Home and in the footer.' },
  { key: 'foundedIdea', label: 'Started (YYYY-MM)' },
  { key: 'incorporatedOn', label: 'Incorporated (YYYY-MM-DD)' },
  { key: 'cin', label: 'CIN' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'locality', label: 'Locality' },
  { key: 'city', label: 'City' },
  { key: 'region', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'email', label: 'Public email' },
  { key: 'phone', label: 'Public phone' },
];

export function CompanyPanel({ viewer }: { viewer: Viewer }) {
  const toast = useToast();
  const [base, setBase] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editable = can(viewer, 'content:publish');

  useEffect(() => {
    void api<Record<string, unknown>>('/api/v1/admin/company').then((r) => (r.ok ? (setBase(r.data), setForm(r.data)) : setError(r.message)));
  }, []);

  const dirty = base !== null && COMPANY_FIELDS.some((f) => (form[f.key] ?? '') !== (base[f.key] ?? '')) || JSON.stringify(form.socials) !== JSON.stringify(base?.socials);
  const socials = (form.socials as { label: string; url: string }[] | undefined) ?? [];

  const save = async () => {
    if (!base) return;
    setSaving(true);
    setError('');
    const body: Record<string, unknown> = {};
    for (const f of COMPANY_FIELDS) {
      const v = typeof form[f.key] === 'string' ? (form[f.key] as string).trim() : form[f.key];
      if (v !== base[f.key]) body[f.key] = (f.key === 'email' || f.key === 'phone') && v === '' ? null : v;
    }
    if (JSON.stringify(form.socials) !== JSON.stringify(base.socials)) body.socials = socials.filter((s) => s.label.trim() && s.url.trim());
    const r = await api<Record<string, unknown>>('/api/v1/admin/company', { method: 'PATCH', body: JSON.stringify(body) });
    setSaving(false);
    if (!r.ok) return setError(r.message);
    setBase(r.data);
    setForm(r.data);
    toast('Company details saved.');
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Company</h1>
          <p className={styles.lead}>The registered details shown in the footer, on About and on Contact. Dates fill in milestones automatically.</p>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {!base && !error && <p className={styles.muted}>Loading…</p>}
      {base && (
        <section className={styles.card}>
          <div className={styles.grid2}>
            {COMPANY_FIELDS.map((f) => (
              <label key={f.key} className={styles.field}>
                <span>{f.label}</span>
                {f.help && <span className={styles.help}>{f.help}</span>}
                <input className={styles.input} value={String(form[f.key] ?? '')} onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))} disabled={!editable} />
              </label>
            ))}
          </div>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Social links</span>
            {socials.map((s, i) => (
              <div key={i} className={styles.grid2}>
                <input
                  className={styles.input}
                  placeholder="Label (e.g. LinkedIn)"
                  value={s.label}
                  onChange={(e) => setForm((x) => ({ ...x, socials: socials.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)) }))}
                  disabled={!editable}
                />
                <span className={styles.imageField}>
                  <input
                    className={styles.input}
                    style={{ flex: 1 }}
                    placeholder="https://…"
                    value={s.url}
                    onChange={(e) => setForm((x) => ({ ...x, socials: socials.map((y, k) => (k === i ? { ...y, url: e.target.value } : y)) }))}
                    disabled={!editable}
                  />
                  <button type="button" className={`${styles.iconBtn} ${styles.danger}`} disabled={!editable} onClick={() => setForm((x) => ({ ...x, socials: socials.filter((_, k) => k !== i) }))}>
                    Remove
                  </button>
                </span>
              </div>
            ))}
            <button type="button" className={styles.addBtn} disabled={!editable} onClick={() => setForm((x) => ({ ...x, socials: [...socials, { label: '', url: '' }] }))}>
              + Add link
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {editable && <SaveBar dirty={dirty} saving={saving} note="Saved" onSave={save} />}
        </section>
      )}
    </>
  );
}

/* ── Team accounts ───────────────────────────────────────── */

interface Account {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

const ROLE_HELP: Record<string, string> = {
  super_admin: 'Everything, including team accounts.',
  admin: 'Edits and publishes every page, reads the inbox and adds team accounts (not super admins).',
  editor: 'Drafts content (an admin publishes); reads the inbox.',
  viewer: 'Reads the admin and the inbox.',
};

export function UsersPanel({ viewer }: { viewer: Viewer }) {
  const toast = useToast();
  const [users, setUsers] = useState<Account[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const superViewer = viewer.user.role === 'super_admin';

  useEffect(() => {
    void api<Account[]>('/api/v1/admin/users').then((r) => (r.ok ? setUsers(r.data) : setError(r.message)));
  }, []);

  const update = async (u: Account, patch: Partial<Account> & { password?: string }) => {
    const r = await api<Account>(`/api/v1/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    if (!r.ok) return toast(r.message);
    setUsers((list) => list?.map((x) => (x.id === u.id ? { ...x, ...r.data } : x)) ?? null);
    toast(patch.password ? `New password set for ${u.name}. They have been signed out.` : 'Saved.');
  };

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { name: String(f.get('name') ?? '').trim(), email: String(f.get('email') ?? '').trim(), role: String(f.get('role')), password: String(f.get('password') ?? '') };
    const r = await api<Account>('/api/v1/admin/users', { method: 'POST', body: JSON.stringify(body) });
    if (!r.ok) return setError(r.message);
    setUsers((list) => [...(list ?? []), { ...r.data, isActive: true, lastLoginAt: null }]);
    setAdding(false);
    setError('');
    toast(`Account created for ${r.data.name}. Share the password with them privately.`);
  };

  const resetPassword = (u: Account) => {
    const p = window.prompt(`New password for ${u.name} (at least 12 characters). Share it with them privately.`);
    if (p === null) return;
    if (p.length < 12) return toast('Use at least 12 characters.');
    void update(u, { password: p });
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Team accounts</h1>
          <p className={styles.lead}>Who can sign in to this admin, and what they can do.</p>
        </div>
        <Button type="button" onClick={() => setAdding((a) => !a)}>
          {adding ? 'Cancel' : 'Add a person'}
        </Button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {adding && (
        <form className={styles.card} onSubmit={create} style={{ marginBottom: 'var(--sp-6)' }}>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Name</span>
              <input name="name" className={styles.input} required minLength={2} />
            </label>
            <label className={styles.field}>
              <span>Email (their sign-in)</span>
              <input name="email" type="email" className={styles.input} required />
            </label>
            <label className={styles.field}>
              <span>Role</span>
              <select name="role" className={styles.select} defaultValue="editor">
                {Object.entries(ROLE_LABEL)
                  .filter(([k]) => superViewer || k !== 'super_admin')
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}: {ROLE_HELP[k]}
                    </option>
                  ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>First password</span>
              <span className={styles.help}>At least 12 characters. They can change it under Account.</span>
              <input name="password" type="text" className={styles.input} required minLength={12} autoComplete="new-password" />
            </label>
          </div>
          <div className={styles.bar}>
            <span className={styles.barNote} />
            <Button type="submit" size="sm">
              Create account
            </Button>
          </div>
        </form>
      )}
      {!users && !error && <p className={styles.muted}>Loading…</p>}
      {users && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Person</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === viewer.user.id;
                // Only a super admin can change a super admin account.
                const locked = !superViewer && u.role === 'super_admin';
                return (
                  <tr key={u.id}>
                    <td>
                      <b style={{ fontWeight: 500 }}>{u.name}</b>
                      {self && <span className={styles.muted}> (you)</span>}
                      <br />
                      <span className={styles.muted}>{u.email}</span>
                    </td>
                    <td>
                      <select className={styles.select} value={u.role} disabled={self || locked} onChange={(e) => update(u, { role: e.target.value })} aria-label={`Role for ${u.name}`}>
                        {Object.entries(ROLE_LABEL)
                          .filter(([k]) => superViewer || k !== 'super_admin' || u.role === 'super_admin')
                          .map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>{u.isActive ? 'Active' : <span className={styles.muted}>Deactivated</span>}</td>
                    <td className={styles.muted}>{u.lastLoginAt ? when(u.lastLoginAt) : 'Never'}</td>
                    <td>
                      <span className={styles.itemTools} hidden={locked}>
                        <button type="button" className={styles.iconBtn} onClick={() => resetPassword(u)}>
                          Set password
                        </button>
                        {!self && (
                          <button type="button" className={`${styles.iconBtn} ${u.isActive ? styles.danger : ''}`} onClick={() => update(u, { isActive: !u.isActive })}>
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ── Your account ────────────────────────────────────────── */

export function AccountPanel({ viewer, onSignOut }: { viewer: Viewer; onSignOut: () => void }) {
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const next = String(f.get('next') ?? '');
    if (next !== String(f.get('confirm') ?? '')) return setError('The two new passwords do not match.');
    setBusy(true);
    setError('');
    const r = await api('/api/v1/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword: f.get('current'), newPassword: next }) });
    setBusy(false);
    if (!r.ok) return setError(r.status === 429 ? 'Too many attempts. Wait a few minutes.' : r.message);
    form.reset();
    toast('Password changed. Other devices have been signed out.');
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Your account</h1>
          <p className={styles.lead}>
            Signed in as {viewer.user.name} ({viewer.user.email}), {ROLE_LABEL[viewer.user.role] ?? viewer.user.role}.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onSignOut}>
          Sign out of this device
        </Button>
      </div>
      <form className={styles.card} onSubmit={submit} style={{ maxWidth: '34rem' }}>
        <h2 className={styles.cardTitle}>Change your password</h2>
        <label className={styles.field}>
          <span>Current password</span>
          <input name="current" type="password" className={styles.input} autoComplete="current-password" required />
        </label>
        <label className={styles.field}>
          <span>New password</span>
          <span className={styles.help}>At least 12 characters. A short sentence works well.</span>
          <input name="next" type="password" className={styles.input} autoComplete="new-password" minLength={12} required />
        </label>
        <label className={styles.field}>
          <span>New password, again</span>
          <input name="confirm" type="password" className={styles.input} autoComplete="new-password" minLength={12} required />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.bar}>
          <span className={styles.barNote} />
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </Button>
        </div>
      </form>
    </>
  );
}

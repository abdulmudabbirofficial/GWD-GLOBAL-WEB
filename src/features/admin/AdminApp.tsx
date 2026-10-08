'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { api, can, ROLE_LABEL, type Viewer } from './api';
import { CollectionPanel } from './CollectionPanel';
import { COLLECTIONS } from './collections-spec';
import { Registrations } from './Inbox';
import { Overview } from './Overview';
import { ImagesPanel, PagesPanel } from './PagesPanel';
import { AccountPanel, CompanyPanel, UsersPanel } from './SettingsPanels';
import { AlbumProvider, ToastProvider } from './ui';
import styles from './Admin.module.css';

interface Section {
  key: string;
  label: string;
  group: string;
  permission?: string;
}

const SECTIONS: Section[] = [
  { key: 'overview', label: 'Overview', group: 'Daily' },
  { key: 'inbox', label: 'Registrations', group: 'Daily' },
  { key: 'pages', label: 'Pages', group: 'Website' },
  { key: 'images', label: 'Images', group: 'Website' },
  ...['events', 'gallery', 'team', 'products', 'services', 'stats', 'highlights', 'organizations', 'locations', 'recognitions', 'announcements'].map((k) => ({
    key: k,
    label: COLLECTIONS.find((c) => c.key === k)!.label,
    group: 'Content',
  })),
  { key: 'company', label: 'Company', group: 'Settings' },
  { key: 'users', label: 'Team accounts', group: 'Settings', permission: 'users:manage' },
  { key: 'account', label: 'Your account', group: 'Settings' },
];

/**
 * The site's control room: sign in, then every word, link, image and list on
 * the site, the registrations inbox, the company record and the team's
 * accounts. Uses the same API as everything else (session cookie, role
 * checks, audit log).
 */
export function AdminApp() {
  const [viewer, setViewer] = useState<Viewer | null | undefined>(undefined);
  useEffect(() => {
    void api<Viewer>('/api/v1/auth/me').then((r) => setViewer(r.ok ? r.data : null));
  }, []);
  if (viewer === undefined) return <main className={styles.signShell} aria-busy="true" />;
  if (viewer === null) return <SignIn onSignedIn={setViewer} />;
  return (
    <ToastProvider>
      <AlbumProvider>
        <Shell viewer={viewer} onSignedOut={() => setViewer(null)} />
      </AlbumProvider>
    </ToastProvider>
  );
}

function Shell({ viewer, onSignedOut }: { viewer: Viewer; onSignedOut: () => void }) {
  const visible = SECTIONS.filter((s) => !s.permission || can(viewer, s.permission));
  const [section, setSection] = useState('overview');

  // The section lives in the address (#pages), so a refresh or a shared link opens the same place.
  useEffect(() => {
    const read = () => {
      const key = window.location.hash.slice(1);
      setSection(visible.some((s) => s.key === key) ? key : 'overview');
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const go = useCallback((key: string) => {
    window.history.replaceState(null, '', `#${key}`);
    setSection(key);
    window.scrollTo({ top: 0 });
  }, []);

  const signOut = async () => {
    await api('/api/v1/auth/logout', { method: 'POST' });
    onSignedOut();
  };

  const spec = COLLECTIONS.find((c) => c.key === section);
  return (
    <div className={styles.app}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          <b>GWD Global</b>
          <span>Site admin</span>
        </div>
        <nav className={styles.nav} aria-label="Admin">
          {visible.map((s, i) => {
            const head = i === 0 || visible[i - 1]!.group !== s.group ? <p className={styles.navGroup}>{s.group}</p> : null;
            return (
              <div key={s.key} style={{ display: 'contents' }}>
                {head}
                <button type="button" className={styles.navItem} aria-current={section === s.key ? 'page' : undefined} onClick={() => go(s.key)}>
                  {s.label}
                </button>
              </div>
            );
          })}
        </nav>
        <div className={styles.who}>
          <span>
            <b>{viewer.user.name}</b>
            <br />
            <span className={styles.muted}>{ROLE_LABEL[viewer.user.role] ?? viewer.user.role}</span>
          </span>
          <span style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <Button href="/" size="sm" variant="ghost" external>
              View site
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </span>
        </div>
      </aside>
      <main className={styles.main}>
        {section === 'overview' && <Overview onOpenInbox={() => go('inbox')} />}
        {section === 'inbox' && <Registrations viewer={viewer} onSignedOut={onSignedOut} embedded />}
        {section === 'pages' && <PagesPanel viewer={viewer} />}
        {section === 'images' && <ImagesPanel viewer={viewer} />}
        {spec && <CollectionPanel key={spec.key} spec={spec} viewer={viewer} />}
        {section === 'company' && <CompanyPanel viewer={viewer} />}
        {section === 'users' && <UsersPanel viewer={viewer} />}
        {section === 'account' && <AccountPanel viewer={viewer} onSignOut={signOut} />}
      </main>
    </div>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: (v: Viewer) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    const r = await api<Viewer>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
    setBusy(false);
    if (r.ok) onSignedIn(r.data);
    else setError(r.status === 429 ? 'Too many attempts. Wait a few minutes and try again.' : r.status === 401 ? 'That email and password do not match.' : r.message);
  };

  return (
    <main className={styles.signShell}>
      <form className={styles.sign} onSubmit={submit}>
        <p className={styles.muted} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>
          GWD Global
        </p>
        <h1 className={styles.signTitle}>Site admin</h1>
        <p className={styles.muted}>Sign in with your GWD team account.</p>
        <label className={styles.field}>
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required className={styles.input} />
        </label>
        <div aria-live="polite">{error && <p className={styles.error}>{error}</p>}</div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}

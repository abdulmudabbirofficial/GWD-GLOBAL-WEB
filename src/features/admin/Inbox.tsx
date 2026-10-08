'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { INTENT_GROUPS, freeText, intentByKey, type IntentGroupKey } from '@/features/register/intents';
import { cn } from '@/lib/utils';
import styles from './Inbox.module.css';

type Status = 'new' | 'in_progress' | 'closed' | 'spam';
type GroupFilter = 'all' | IntentGroupKey | 'general';

interface Viewer {
  user: { name: string; email: string; role: string };
  permissions: string[];
}
interface Row {
  id: string;
  name: string;
  email: string;
  company: string | null;
  topic: string;
  message: string;
  intent: string | null;
  details: Record<string, string> | null;
  status: Status;
  sourcePath: string | null;
  createdAt: string;
}
interface Page {
  items: Row[];
  page: number;
  pages: number;
  total: number;
  newByIntent: Record<string, number>;
}
type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

const STATUS_LABEL: Record<Status, string> = { new: 'New', in_progress: 'In progress', closed: 'Closed', spam: 'Spam' };
const STATUS_TABS: (Status | 'all')[] = ['new', 'in_progress', 'closed', 'spam', 'all'];
const TOPIC_LABEL: Record<string, string> = {
  project: 'A project',
  partnership: 'Partnership',
  club: 'GWD Community',
  sports: 'GWD Sports',
  careers: 'Join the network',
  other: 'Something else',
};
const GROUPS: { key: GroupFilter; label: string }[] = [
  { key: 'all', label: 'Everything' },
  ...INTENT_GROUPS.map((g) => ({ key: g.key, label: g.label })),
  { key: 'general', label: 'Contact form' },
];

async function api<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
    const body = (await res.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null;
    if (res.ok && body?.data !== undefined) return { ok: true, data: body.data };
    return { ok: false, status: res.status, message: body?.error?.message ?? 'Something went wrong. Please try again.' };
  } catch {
    return { ok: false, status: 0, message: 'Could not reach the server. Check your connection.' };
  }
}

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const formTitle = (row: Row) => intentByKey(row.intent)?.title ?? `Contact form: ${TOPIC_LABEL[row.topic] ?? row.topic}`;
const groupOf = (row: Row) => INTENT_GROUPS.find((g) => (g.intents as readonly string[]).includes(row.intent ?? ''))?.label ?? 'Contact form';

/** Sign-in, then the inbox. Uses the same API as everything else (session cookie, role checks, audit log). */
export function Inbox() {
  const [viewer, setViewer] = useState<Viewer | null | undefined>(undefined);

  useEffect(() => {
    void api<Viewer>('/api/v1/auth/me').then((r) => setViewer(r.ok ? r.data : null));
  }, []);

  if (viewer === undefined) return <main className={styles.shell} aria-busy="true" />;
  if (viewer === null) return <SignIn onSignedIn={setViewer} />;
  return <Registrations viewer={viewer} onSignedOut={() => setViewer(null)} />;
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
    else
      setError(
        r.status === 429 ? 'Too many attempts. Wait a few minutes and try again.' : r.status === 401 ? 'That email and password do not match.' : r.message,
      );
  };

  return (
    <main className={cn(styles.shell, styles.signInShell)}>
      <form className={styles.signIn} onSubmit={submit}>
        <p className={styles.brand}>GWD Global</p>
        <h1 className={styles.signInTitle}>Registrations</h1>
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

/** The registrations list and reader. Inside the admin app (embedded) the app's own frame supplies sign-out. */
export function Registrations({ viewer, onSignedOut, embedded = false }: { viewer: Viewer; onSignedOut: () => void; embedded?: boolean }) {
  const [group, setGroup] = useState<GroupFilter>('all');
  const [status, setStatus] = useState<Status | 'all'>('new');
  const [pageNo, setPageNo] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const canWrite = viewer.permissions.includes('enquiries:write');

  // Reload whenever a filter or the page changes; a slower, older response never overwrites a newer one.
  useEffect(() => {
    let current = true;
    const q = new URLSearchParams({ page: String(pageNo), pageSize: '30' });
    if (status !== 'all') q.set('status', status);
    if (group !== 'all') q.set('group', group);
    void api<Page>(`/api/v1/admin/enquiries?${q}`).then((r) => {
      if (!current) return;
      if (r.ok) {
        setData(r.data);
        setError('');
      } else if (r.status === 401) onSignedOut();
      else setError(r.message);
    });
    return () => {
      current = false;
    };
  }, [group, status, pageNo, onSignedOut]);

  const signOut = async () => {
    await api('/api/v1/auth/logout', { method: 'POST' });
    onSignedOut();
  };

  const setRowStatus = async (row: Row, next: Status) => {
    setSaving(row.id);
    const r = await api<{ id: string; status: Status }>(`/api/v1/admin/enquiries/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    setSaving(null);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    // Keep the row on screen with its new status; the list refreshes on the next filter change.
    setData((d) => (d ? { ...d, items: d.items.map((i) => (i.id === row.id ? { ...i, status: next } : i)) } : d));
  };

  const unread = (key: GroupFilter) => {
    const counts = data?.newByIntent ?? {};
    if (key === 'all') return Object.values(counts).reduce((a, b) => a + b, 0);
    if (key === 'general') return counts.general ?? 0;
    return (INTENT_GROUPS.find((g) => g.key === key)?.intents ?? []).reduce((a, k) => a + (counts[k] ?? 0), 0);
  };

  const current = data?.items.find((i) => i.id === selected) ?? null;

  const Shell = embedded ? 'div' : 'main';
  return (
    <Shell className={embedded ? undefined : styles.shell}>
      <header className={styles.top}>
        <div>
          <p className={styles.brand}>GWD Global</p>
          <h1 className={styles.title}>Registrations</h1>
        </div>
        {!embedded && (
          <div className={styles.who}>
            <span className={styles.muted}>{viewer.user.email}</span>
            <Button type="button" variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        )}
      </header>

      <nav className={styles.filters} aria-label="Filter registrations">
        <div className={styles.chips} role="group" aria-label="Page">
          {GROUPS.map((g) => {
            const n = unread(g.key);
            return (
              <button
                key={g.key}
                type="button"
                className={cn(styles.chip, group === g.key && styles.chipOn)}
                aria-pressed={group === g.key}
                onClick={() => {
                  setGroup(g.key);
                  setPageNo(1);
                  setSelected(null);
                }}
              >
                {g.label}
                {n > 0 && <span className={styles.badge}>{n}</span>}
              </button>
            );
          })}
        </div>
        <div className={styles.tabs} role="group" aria-label="Status">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(styles.tab, status === s && styles.tabOn)}
              aria-pressed={status === s}
              onClick={() => {
                setStatus(s);
                setPageNo(1);
                setSelected(null);
              }}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </nav>

      {error && <p className={styles.error}>{error}</p>}

      <div className={cn(styles.panes, current && styles.panesDetail)}>
        <section className={styles.list} aria-label="Registrations" aria-busy={!data}>
          {data && data.items.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nothing here.</p>
              <p className={styles.muted}>New registrations from the site appear here as soon as they are sent.</p>
            </div>
          )}
          <ul>
            {data?.items.map((row) => (
              <li key={row.id}>
                <button type="button" className={cn(styles.item, row.id === selected && styles.itemOn)} onClick={() => setSelected(row.id)}>
                  <span className={styles.itemTop}>
                    <span className={styles.itemName}>{row.name}</span>
                    <time className={styles.itemDate} dateTime={row.createdAt}>
                      {dateFormat.format(new Date(row.createdAt))}
                    </time>
                  </span>
                  <span className={styles.itemForm}>{formTitle(row)}</span>
                  <span className={styles.itemMeta}>
                    <span className={cn(styles.dot, styles[row.status])} aria-hidden="true" />
                    {STATUS_LABEL[row.status]}
                    {row.company && <> · {row.company}</>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {data && data.pages > 1 && (
            <div className={styles.pager}>
              <Button type="button" variant="outline" size="sm" disabled={pageNo <= 1} onClick={() => setPageNo((p) => p - 1)}>
                Newer
              </Button>
              <span className={styles.muted}>
                Page {data.page} of {data.pages}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={pageNo >= data.pages} onClick={() => setPageNo((p) => p + 1)}>
                Older
              </Button>
            </div>
          )}
        </section>

        <section className={styles.detail} aria-label="Selected registration">
          {current ? (
            <Detail
              row={current}
              canWrite={canWrite}
              saving={saving === current.id}
              onStatus={(s) => setRowStatus(current, s)}
              onBack={() => setSelected(null)}
            />
          ) : (
            <p className={cn(styles.muted, styles.pick)}>Choose a registration to read it.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}

interface DetailProps {
  row: Row;
  canWrite: boolean;
  saving: boolean;
  onStatus: (s: Status) => void;
  onBack: () => void;
}

function Detail({ row, canWrite, saving, onStatus, onBack }: DetailProps) {
  const intent = intentByKey(row.intent);
  const answers = intent ? intent.fields.filter((f) => row.details?.[f.name]) : [];
  const text = intent ? freeText(intent, row.details, row.message) : row.message;
  const phone = row.details?.phone;
  const ref = useRef<HTMLElement>(null);

  // On phones the detail replaces the list, so bring its top into view.
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) ref.current?.scrollIntoView({ block: 'start' });
  }, [row.id]);

  return (
    <article ref={ref} className={styles.card}>
      <button type="button" className={styles.back} onClick={onBack}>
        ← All registrations
      </button>
      <p className={styles.group}>{groupOf(row)}</p>
      <h2 className={styles.cardTitle}>{row.name}</h2>
      <p className={styles.muted}>
        {formTitle(row)} · {dateFormat.format(new Date(row.createdAt))}
        {row.sourcePath && <> · sent from {row.sourcePath}</>}
      </p>

      <div className={styles.actions}>
        <a className={styles.action} href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${intent?.title ?? 'Your message to GWD'}`)}`}>
          Email {row.email}
        </a>
        {phone && (
          <a className={styles.action} href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
            Call {phone}
          </a>
        )}
      </div>

      <dl className={styles.answers}>
        {row.company && !answers.some((f) => 'organisation' in f && f.organisation) && (
          <div>
            <dt>Company or college</dt>
            <dd>{row.company}</dd>
          </div>
        )}
        {answers.map((f) => (
          <div key={f.name}>
            <dt>{f.label}</dt>
            <dd>
              {f.type === 'url' ? (
                <a href={row.details![f.name]} target="_blank" rel="noreferrer noopener">
                  {row.details![f.name]}
                </a>
              ) : (
                row.details![f.name]
              )}
            </dd>
          </div>
        ))}
      </dl>

      {text && (
        <div className={styles.message}>
          <p className={styles.group}>{intent?.message.label ?? 'Message'}</p>
          <p>{text}</p>
        </div>
      )}

      {canWrite && (
        <div className={styles.status} role="group" aria-label="Set status">
          <span className={styles.muted} aria-live="polite">
            {saving ? 'Saving…' : `Status: ${STATUS_LABEL[row.status]}`}
          </span>
          {row.status !== 'in_progress' && (
            <Button type="button" size="sm" disabled={saving} onClick={() => onStatus('in_progress')}>
              {row.status === 'new' ? 'Mark in progress' : 'Reopen'}
            </Button>
          )}
          {row.status !== 'closed' && (
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onStatus('closed')}>
              Close
            </Button>
          )}
          {row.status !== 'spam' && (
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => onStatus('spam')}>
              Mark as spam
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

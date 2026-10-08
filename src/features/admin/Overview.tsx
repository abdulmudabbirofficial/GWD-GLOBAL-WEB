'use client';

import { useEffect, useMemo, useState } from 'react';
import { intentByKey } from '@/features/register/intents';
import { api } from './api';
import { when } from './ui';
import styles from './Admin.module.css';
import o from './Overview.module.css';

interface Insights {
  days: number;
  totals: { clicks: number; visitors: number };
  actions: { cta: string; page: string; label: string | null; clicks: number; visitors: number; last: string }[];
  daily: { day: string; clicks: number }[];
  devices: { device: string | null; clicks: number }[];
  recent: { page: string; cta: string; label: string | null; device: string | null; at: string }[];
  forms: { intent: string | null; page: string | null; sent: number; fresh: number; last: string }[];
}

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: 'A year' },
];

const PAGES: [RegExp, string][] = [
  [/^\/$/, 'Home'],
  [/^\/services\/(.+)/, 'Service: $1'],
  [/^\/services/, 'Services'],
  [/^\/products/, 'Products'],
  [/^\/sports/, 'GWD Sports'],
  [/^\/community/, 'Community'],
  [/^\/about/, 'About'],
  [/^\/contact/, 'Contact'],
];
const pageName = (path: string | null) => {
  if (!path) return 'Unknown page';
  const clean = path.split('?')[0]!;
  for (const [re, name] of PAGES) if (re.test(clean)) return clean.replace(re, name).replace(/-/g, ' ');
  return clean;
};

/** What kind of action a click key is, in words. */
function kind(cta: string) {
  if (cta.startsWith('register:')) return `Opens the “${intentByKey(cta.slice(9))?.title ?? cta.slice(9)}” form`;
  if (cta === 'social-instagram') return 'Instagram icon';
  if (cta === 'social-linkedin') return 'LinkedIn icon';
  if (cta.startsWith('external:')) return `Leaves for ${cta.slice(9)}`;
  if (cta.startsWith('link:')) return `Goes to ${cta.slice(5)}`;
  if (cta === 'mailto') return 'Email link';
  if (cta === 'tel') return 'Phone link';
  return 'Button';
}

/**
 * The first screen after sign-in: what visitors clicked and which forms they
 * sent, page by page. Clicks are anonymous counts; the people who sent a form
 * are in Registrations.
 */
export function Overview({ onOpenInbox }: { onOpenInbox: () => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    const load = () =>
      void api<Insights>(`/api/v1/admin/insights?days=${days}`).then((r) => {
        if (!live) return;
        if (r.ok) {
          setData(r.data);
          setError('');
        } else setError(r.message);
      });
    load();
    // New clicks and forms appear without a refresh.
    const t = window.setInterval(load, 30_000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [days]);

  const sent = useMemo(() => data?.forms.reduce((n, f) => n + f.sent, 0) ?? 0, [data]);
  const fresh = useMemo(() => data?.forms.reduce((n, f) => n + f.fresh, 0) ?? 0, [data]);
  const peak = useMemo(() => Math.max(1, ...(data?.daily.map((d) => d.clicks) ?? [1])), [data]);
  const deviceTotal = useMemo(() => data?.devices.reduce((n, d) => n + d.clicks, 0) ?? 0, [data]);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Overview</h1>
          <p className={styles.lead}>
            Every button, form link and social icon clicked on the site, and every form sent, page by page. Clicks are counted anonymously; the people who
            filled a form, with their details, are in Registrations.
          </p>
        </div>
      </div>
      <div className={styles.tabs} role="group" aria-label="Period">
        {RANGES.map((r) => (
          <button key={r.days} type="button" className={styles.tab} aria-pressed={days === r.days} onClick={() => setDays(r.days)}>
            {r.label}
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {!data && !error && <p className={styles.muted}>Loading…</p>}
      {data && (
        <div className={styles.stack}>
          <div className={o.kpis}>
            <div className={o.kpi}>
              <span>Forms sent</span>
              <b>{sent}</b>
              <small>{fresh} still new</small>
            </div>
            <div className={o.kpi}>
              <span>Clicks on calls to action</span>
              <b>{data.totals.clicks}</b>
              <small>{data.actions.length} different actions</small>
            </div>
            <div className={o.kpi}>
              <span>Visitors who clicked</span>
              <b>{data.totals.visitors}</b>
              <small>
                {deviceTotal ? data.devices.map((d) => `${Math.round((d.clicks / deviceTotal) * 100)}% ${d.device ?? 'other'}`).join(' · ') : 'No clicks yet'}
              </small>
            </div>
          </div>

          {data.daily.length > 1 && (
            <section className={styles.card} aria-label="Clicks per day">
              <h2 className={styles.cardTitle}>Clicks per day</h2>
              <div className={o.bars}>
                {data.daily.map((d) => (
                  <span key={d.day} className={o.bar} style={{ ['--h' as string]: `${(d.clicks / peak) * 100}%` }}>
                    <span className={o.barTip}>
                      {new Date(d.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: {d.clicks}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Forms sent, by form and page</h2>
              <button type="button" className={styles.tab} onClick={onOpenInbox}>
                Open Registrations
              </button>
            </div>
            {data.forms.length ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Form</th>
                      <th>Sent from</th>
                      <th>Sent</th>
                      <th>New</th>
                      <th>Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forms.map((f) => (
                      <tr key={`${f.intent}-${f.page}`}>
                        <td>{f.intent ? (intentByKey(f.intent)?.title ?? f.intent) : 'Contact form'}</td>
                        <td>{pageName(f.page)}</td>
                        <td>
                          <b className={o.num}>{f.sent}</b>
                        </td>
                        <td>{f.fresh ? <span className={o.badge}>{f.fresh}</span> : <span className={styles.muted}>0</span>}</td>
                        <td className={styles.muted}>{when(f.last)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.muted}>No forms sent in this period.</p>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Calls to action, by page</h2>
            {data.actions.length ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Clicked</th>
                      <th>On page</th>
                      <th>Clicks</th>
                      <th>Visitors</th>
                      <th>Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.actions.map((a) => (
                      <tr key={`${a.cta}-${a.page}`}>
                        <td>
                          <b style={{ fontWeight: 500 }}>{a.label || kind(a.cta)}</b>
                          <br />
                          <span className={styles.muted}>{kind(a.cta)}</span>
                        </td>
                        <td>{pageName(a.page)}</td>
                        <td>
                          <b className={o.num}>{a.clicks}</b>
                        </td>
                        <td>{a.visitors}</td>
                        <td className={styles.muted}>{when(a.last)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.muted}>No clicks in this period yet. They appear here as visitors use the site.</p>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Latest clicks</h2>
            {data.recent.length ? (
              <ol role="list" className={o.feed}>
                {data.recent.map((r, i) => (
                  <li key={i}>
                    <span className={styles.muted}>{when(r.at)}</span>
                    <span>
                      <b style={{ fontWeight: 500 }}>{r.label || kind(r.cta)}</b> <span className={styles.muted}>on {pageName(r.page)}</span>
                    </span>
                    <span className={styles.muted}>{r.device ?? ''}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.muted}>Nothing yet.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}

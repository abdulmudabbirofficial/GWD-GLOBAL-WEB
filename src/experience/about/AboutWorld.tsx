'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Render } from '@/components/media/Render';
import { gsap, useGsap } from '@/features/motion/gsap';
import { formatIsoDate } from '@/lib/format';
import type { CompanyProfile, Location, TeamMember } from '@/types/content';
import styles from './AboutWorld.module.css';

/*
 * About is the ascent: the page sits on an evening mountain the camera climbs
 * as you read, so every section here is see-through, set in dusk glass.
 */

export interface Milestone {
  when: string;
  title: string;
  body: string;
  highlight?: boolean;
}

/* ── Hero: the studio opens up from a lit window ─────────────────────── */

export function WindowHero({ label, title, lead, facts }: { label: string; title: string; lead: string; facts: { value: string; label: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      const win = scope.querySelector('[data-window]');
      const copy = scope.querySelector('[data-copy]');
      // The window starts beside the copy (below it on narrow screens) and opens to fill the view.
      const start = window.innerWidth >= 900 ? 'inset(16% 5% 7% 54% round 999px 999px 2rem 2rem)' : 'inset(56% 8% 4% 8% round 999px 999px 2rem 2rem)';
      const tl = gsap.timeline({ scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      tl.fromTo(win, { clipPath: start }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0rem 0rem)', ease: 'none' }, 0);
      tl.to(copy, { xPercent: -12, opacity: 0, ease: 'none', duration: 0.5 }, 0);
    },
    ref,
  );
  return (
    <section ref={ref} className={styles.hero} aria-labelledby="about-title">
      <div className={styles.heroSticky}>
        <div className={styles.window} data-window="">
          <div className={styles.windowGlow} aria-hidden="true" />
          <div className={styles.office}>
            <Render
              name="gwd-office"
              alt="A model of the GWD studio: desks under pendant lights, a glass meeting room, a lounge, a coffee bar and the GWD sign with GET WORK DONE on the wall"
              sizes="(min-width: 960px) 70vw, 100vw"
              priority
            />
          </div>
        </div>
        <div className={`container ${styles.heroCopy}`} data-copy="">
          <p className="chapter-label">{label}</p>
          <h1 id="about-title" className={styles.heroTitle}>
            {title}
          </h1>
          <p className={`t-lead ${styles.heroLead}`}>{lead}</p>
          <dl className={styles.heroFacts}>
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="meta">{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ── The road so far: an altimeter climbs beside the milestones ──────── */

export function AltimeterStory({ label, title, milestones }: { label: string; title: string; milestones: Milestone[] }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useGsap(
    ({ reduced, scope }) => {
      const marker = scope.querySelector('[data-marker]');
      if (reduced || !marker) return;
      gsap.fromTo(marker, { top: '100%' }, { top: '0%', ease: 'none', scrollTrigger: { trigger: scope.querySelector('[data-list]'), start: 'top 55%', end: 'bottom 55%', scrub: true } });
    },
    ref,
  );
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>('[data-step]')];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const now = milestones[active];
  return (
    <section ref={ref} className={styles.section} aria-labelledby="story-title">
      <div className={`container ${styles.storyGrid}`}>
        <div className={styles.gaugeCol}>
          <div className={styles.gaugeSticky}>
            <p className="chapter-label">{label}</p>
            <h2 id="story-title" className={styles.title}>
              {title}
            </h2>
            <div className={styles.gauge} aria-hidden="true">
              <div className={styles.ruler} />
              <div className={styles.marker} data-marker="">
                <span key={active} className={styles.markerLabel}>
                  {now?.when}
                </span>
              </div>
            </div>
          </div>
        </div>
        <ol role="list" className={styles.steps} data-list="">
          {milestones.map((m, i) => (
            <li key={m.title} data-step={i} className={styles.step} data-on={i === active || undefined} data-past={i < active || undefined} data-hl={m.highlight || undefined}>
              <span className={styles.stepWhen}>{m.when}</span>
              <h3 className={styles.stepTitle}>{m.title}</h3>
              <p className="t-body">{m.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Purpose: mission and vision, then the three stages stack up ─────── */

export function PurposeStack({ mission, vision, stages }: { mission: string; vision: string; stages: { label: string; statement: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      gsap.utils.toArray<HTMLElement>('[data-curtain]', scope).forEach((el) => {
        gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)', y: 40 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
      });
      const cards = gsap.utils.toArray<HTMLElement>('[data-stage]', scope);
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card, { scale: 0.92, filter: 'brightness(0.6)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 25%', scrub: true } });
      });
    },
    ref,
  );
  return (
    <section ref={ref} className={styles.section} aria-labelledby="purpose-title">
      <div className="container">
        <h2 id="purpose-title" className="sr-only">
          Mission and vision
        </h2>
        <div className={styles.purpose}>
          <div className={styles.statement} data-curtain="">
            <p className="chapter-label">Mission</p>
            <p className={styles.statementText}>{mission}</p>
          </div>
          <div className={styles.statement} data-curtain="">
            <p className="chapter-label">Vision</p>
            <p className={styles.statementText}>{vision}</p>
          </div>
        </div>
        <ol role="list" className={styles.stack}>
          {stages.map((s, i) => (
            <li key={s.label} className={styles.stage} data-stage="" style={{ '--i': i } as CSSProperties}>
              <p className={styles.stageLabel}>{s.label}</p>
              <p className={styles.stageText}>{s.statement}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── People: co-founders under a spotlight, founding members on a board ─ */

const initials = (name: string) =>
  name
    .split(' ')
    .filter((w) => !/^(mohd|mohammed|md)$/i.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function Spotlight({ f, note }: { f: TeamMember; note?: string }) {
  const move = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <article className={styles.founder} onPointerMove={move} aria-labelledby={`founder-${f.slug}`}>
      {f.photoUrl ? (
        <div className={styles.portrait}>
          {/* eslint-disable-next-line @next/next/no-img-element -- CMS-provided portrait of unknown dimensions */}
          <img src={f.photoUrl} alt={f.name} loading="lazy" />
        </div>
      ) : (
        <span className={styles.monogram} aria-hidden="true">
          {initials(f.name)}
        </span>
      )}
      <div className={styles.founderBody}>
      <p className="meta">{f.role}</p>
      <h3 id={`founder-${f.slug}`} className={styles.founderName}>
        {f.name}
      </h3>
      {f.bio && (
        <ul role="list" className={styles.lanes} aria-label="Lanes">
          {f.bio.split(' · ').map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
      {note && <p className={styles.founderNote}>{note}</p>}
      </div>
    </article>
  );
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** A departure board: each name flips through letters before it settles. */
function FlapName({ name, go, delay }: { name: string; go: boolean; delay: number }) {
  const target = name.toUpperCase();
  const [shown, setShown] = useState(() => target.replace(/[A-Z]/g, ' '));
  useEffect(() => {
    if (!go) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const now = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(now);
    }
    let frame = 0;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        frame++;
        const settled = Math.floor(frame / 2);
        setShown(
          [...target]
            .map((c, i) => (c === ' ' || i < settled ? c : GLYPHS[(i * 7 + frame * 3) % GLYPHS.length]))
            .join(''),
        );
        if (settled >= target.length) window.clearInterval(id);
      }, 55);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [go, target, delay]);
  return (
    <span className={styles.flapRow} aria-label={name} role="img">
      {target.split(' ').map((word, w, words) => {
        const from = words.slice(0, w).reduce((n, x) => n + x.length + 1, 0);
        return (
          <span key={w} className={styles.flapWord}>
            {[...word].map((_, k) => {
              const c = shown[from + k] ?? ' ';
              return (
                <span key={`${k}-${c}`} className={styles.flap}>
                  {c}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

export function People({
  label,
  title,
  boardTitle,
  founders,
  members,
  notes,
}: {
  label: string;
  title: string;
  boardTitle: string;
  founders: TeamMember[];
  members: TeamMember[];
  notes: Record<string, string>;
}) {
  const board = useRef<HTMLUListElement>(null);
  const featured = members.filter((m) => m.tier === 'executive');
  const rest = members.filter((m) => m.tier !== 'executive');
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setGo(true), io.disconnect()), { rootMargin: '0px 0px -25% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section className={styles.section} aria-labelledby="team-title">
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">{label}</p>
          <h2 id="team-title" className={styles.title}>
            {title}
          </h2>
        </div>
        <div className={styles.founders}>
          {founders.map((f) => (
            <Spotlight key={f.slug} f={f} note={notes[f.slug]} />
          ))}
        </div>
        {members.length > 0 && (
          <div className={styles.boardWrap}>
            <h3 className={styles.boardTitle}>{boardTitle}</h3>
            {/* Featured founding members (tier "executive" in the CMS): a portrait and a larger board. */}
            {featured.map((m, i) => (
              <article key={m.slug} className={styles.featured} aria-label={m.name}>
                {m.photoUrl && (
                  <div className={styles.featuredPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- CMS-provided portrait of unknown dimensions */}
                    <img src={m.photoUrl} alt={m.name} loading="lazy" />
                  </div>
                )}
                <div className={styles.featuredBody}>
                  <p className={styles.featuredRole}>{m.role}</p>
                  <div className={styles.featuredName}>
                    <FlapName name={m.name} go={go} delay={i * 140} />
                  </div>
                  {m.bio && <p className={styles.featuredBio}>{m.bio}</p>}
                </div>
              </article>
            ))}
            <ul ref={board} role="list" className={styles.board}>
              {rest.map((m, i) => (
                <li key={m.slug} className={styles.boardRow}>
                  {m.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- CMS-provided portrait of unknown dimensions
                    <img src={m.photoUrl} alt="" className={styles.boardFace} loading="lazy" />
                  )}
                  <FlapName name={m.name} go={go} delay={(featured.length + i) * 140} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── The company: a registry certificate with its seal ──────────────── */

export function Registry({ label, title, company, locations }: { label: string; title: string; company: CompanyProfile; locations: Location[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setSeen(true), io.disconnect()), { rootMargin: '0px 0px -30% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const rows = [
    { k: 'Legal name', v: company.legalName },
    { k: 'Incorporated', v: formatIsoDate(company.incorporatedOn) },
    { k: 'CIN', v: company.cin },
    { k: 'GSTIN', v: company.gstin },
    { k: 'Headquarters', v: `${company.locality}, ${company.city}, ${company.region}, ${company.country}` },
  ];
  const countries = [...new Map(locations.map((l) => [l.country, l])).values()].sort((a, b) => Number(b.isHq) - Number(a.isHq));
  return (
    <section className={styles.section} aria-labelledby="company-title">
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">{label}</p>
          <h2 id="company-title" className={styles.title}>
            {title}
          </h2>
        </div>
        <div ref={ref} className={styles.certificate} data-in={seen || undefined}>
          <dl className={styles.ledger}>
            {rows.map((r, i) => (
              <div key={r.k} style={{ '--i': i } as CSSProperties}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
          <svg className={styles.seal} viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id="seal-ring" d="M100 100 m-72 0 a72 72 0 1 1 144 0 a72 72 0 1 1 -144 0" />
            </defs>
            <circle cx="100" cy="100" r="92" pathLength={1} className={styles.sealRing} />
            <circle cx="100" cy="100" r="56" pathLength={1} className={styles.sealRing} />
            <text className={styles.sealText}>
              <textPath href="#seal-ring">
                {company.legalName.toUpperCase()} · {company.city.toUpperCase()} ·
              </textPath>
            </text>
            <text x="100" y="96" textAnchor="middle" className={styles.sealYear}>
              {company.incorporatedOn.slice(0, 4)}
            </text>
            <text x="100" y="118" textAnchor="middle" className={styles.sealSmall}>
              INCORPORATED
            </text>
          </svg>
          <ul role="list" className={styles.countries}>
            {countries.map((l, i) => (
              <li key={l.country} style={{ '--i': i } as CSSProperties} data-hq={l.isHq || undefined}>
                {l.country}
                {l.isHq && <span className="meta">HQ · {l.city}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

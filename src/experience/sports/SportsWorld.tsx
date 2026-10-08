'use client';

import Image from 'next/image';
import { useRef, useState, type PointerEvent } from 'react';
import { Render } from '@/components/media/Render';
import { gsap, useGsap } from '@/features/motion/gsap';
import type { Organization } from '@/types/content';
import styles from './SportsWorld.module.css';

/* GWD Sports sits on the floodlit pitch: every section is transparent or dark glass. */

export function ProblemSlam({ label, title, items }: { label: string; title: string; items: readonly { title: string; body: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      gsap.utils.toArray<HTMLElement>('[data-slam]', scope).forEach((el, i) => {
        gsap.fromTo(
          el,
          { scale: 2.4, opacity: 0, filter: 'blur(14px)', rotate: i % 2 ? 4 : -4 },
          { scale: 1, opacity: 1, filter: 'blur(0px)', rotate: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } },
        );
      });
    },
    ref,
  );
  return (
    <section ref={ref} className={styles.section} aria-labelledby="problem-title">
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">{label}</p>
          <h2 id="problem-title" className={styles.bigTitle}>
            {title}
          </h2>
        </div>
        <ol role="list" className={styles.problems}>
          {items.map((p, i) => (
            <li key={p.title} className={styles.problem}>
              <span className={styles.slam} data-slam="">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.problemTitle}>{p.title}</h3>
              <p className="t-body">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

interface Pillar {
  key: string;
  name: string;
  line: string;
  render: { name: string; alt: string };
  points: readonly { title: string; body: string }[];
}

export function PillarTabs({ label, title, pillars }: { label: string; title: string; pillars: readonly Pillar[] }) {
  const [on, setOn] = useState(0);
  const p = pillars[on]!;
  return (
    <section className={styles.section} aria-labelledby="pillars-title">
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">{label}</p>
          <h2 id="pillars-title" className={styles.bigTitle}>
            {title}
          </h2>
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Pillars">
          {pillars.map((pl, i) => (
            <button
              key={pl.key}
              type="button"
              role="tab"
              id={`tab-${pl.key}`}
              aria-selected={on === i}
              aria-controls={`panel-${pl.key}`}
              className={styles.tab}
              onClick={() => setOn(i)}
              onPointerEnter={(e: PointerEvent) => e.pointerType === 'mouse' && setOn(i)}
            >
              <span className={styles.tabN}>{String(i + 1).padStart(2, '0')}</span>
              {pl.name}
            </button>
          ))}
        </div>
        <div key={p.key} className={styles.panel} role="tabpanel" id={`panel-${p.key}`} aria-labelledby={`tab-${p.key}`}>
          <div className={styles.panelMedia}>
            <Render name={p.render.name} alt={p.render.alt} sizes="(min-width: 960px) 48vw, 92vw" />
          </div>
          <div className={styles.panelCopy}>
            <p className={styles.panelLine}>{p.line}</p>
            <ul role="list" className={styles.points}>
              {p.points.map((pt, i) => (
                <li key={pt.title} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                  <h3 className="t-h4">{pt.title}</h3>
                  <p className="t-body">{pt.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Scoreboard({ label, title, body, facts }: { label: string; title: string; body: string; facts: readonly { value: string; label: string }[] }) {
  return (
    <section className={styles.section} aria-labelledby="promise-title">
      <div className="container">
        <div className={styles.board}>
          <p className="chapter-label">{label}</p>
          <h2 id="promise-title" className={styles.boardTitle}>
            {title}
          </h2>
          <dl className={styles.cells}>
            {facts.map((f) => (
              <div key={f.label} className={styles.cell}>
                <dd className={styles.led}>{f.value}</dd>
                <dt className="meta">{f.label}</dt>
              </div>
            ))}
          </dl>
          <p className={`t-body ${styles.boardBody}`}>{body}</p>
        </div>
      </div>
    </section>
  );
}

interface Deployment {
  name: string;
  org: string;
  crest: string;
  body: string;
  facts: readonly { value: string; label: string }[];
}

export function DeploymentReel({ label, title, hint, items }: { label: string; title: string; hint: string; items: readonly Deployment[] }) {
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; on: boolean }>({ x: 0, left: 0, on: false });
  const down = (e: PointerEvent) => {
    const el = track.current;
    if (!el || e.pointerType !== 'mouse') return;
    drag.current = { x: e.clientX, left: el.scrollLeft, on: true };
    el.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const el = track.current;
    if (!el || !drag.current.on) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const up = () => {
    drag.current.on = false;
  };
  return (
    <section className={styles.section} aria-labelledby="deploy-title">
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">{label}</p>
          <h2 id="deploy-title" className={styles.bigTitle}>
            {title}
          </h2>
          <p className="meta">{hint}</p>
        </div>
      </div>
      <ul ref={track} role="list" className={styles.reel} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {items.map((d) => (
          <li key={d.name} className={styles.deploy}>
            <span className={styles.crest}>
              <Image src={d.crest} alt={`${d.org} crest`} fill sizes="88px" className={styles.crestImg} draggable={false} />
            </span>
            <p className="meta">{d.org}</p>
            <h3 className={styles.deployName}>{d.name}</h3>
            <p className="t-body">{d.body}</p>
            <dl className={styles.deployFacts}>
              {d.facts.map((f) => (
                <div key={f.label}>
                  <dd>{f.value}</dd>
                  <dt className="meta">{f.label}</dt>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CrestMarquee({ label, title, lead, orgs }: { label: string; title: string; lead: string; orgs: Organization[] }) {
  const rows = [orgs, [...orgs].reverse()];
  return (
    <section className={styles.section} aria-labelledby="crests-title">
      <div className={`container ${styles.headCenter}`}>
        <p className="chapter-label">{label}</p>
        <h2 id="crests-title" className={styles.bigTitle}>
          {title}
        </h2>
        <p className="t-lead">{lead}</p>
      </div>
      <div className={styles.marquee}>
        {rows.map((row, r) => (
          <div key={r} className={styles.run} data-dir={r ? 'right' : 'left'}>
            {[0, 1].map((copy) => (
              <ul key={copy} role="list" className={styles.runList} aria-hidden={copy === 1 || undefined}>
                {row.map((o) =>
                  o.logoUrl ? (
                    <li key={o.slug} className={styles.crestTile}>
                      <Image src={o.logoUrl} alt={copy === 0 ? `${o.name} crest` : ''} fill sizes="120px" className={styles.crestImg} />
                      <span className="sr-only">{o.name}</span>
                    </li>
                  ) : null,
                )}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PartnerTable({ label, title, items }: { label: string; title: string; items: readonly { who: string; what: string; terms: string }[] }) {
  return (
    <section className={styles.section} aria-labelledby="partners-title">
      <div className="container">
        <div className={styles.head}>
          <p className="chapter-label">{label}</p>
          <h2 id="partners-title" className={styles.bigTitle}>
            {title}
          </h2>
        </div>
        <ul role="list" className={styles.table}>
          {items.map((p) => (
            <li key={p.who} className={styles.row}>
              <h3 className={styles.who}>{p.who}</h3>
              <p className="t-body">{p.what}</p>
              <p className={styles.terms}>{p.terms}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { OrgLogo } from '@/components/ui/OrgLogo';
import { gsap, useGsap } from '@/features/motion/gsap';
import { TransitionLink } from '@/features/transition/TransitionLink';
import type { GalleryPhoto, Organization } from '@/types/content';
import styles from './HomeWorld.module.css';

/*
 * The home page is one journey through the GWD world (src/3d/backdrops/
 * gwdworld.ts). Every chapter here is a tall section marked `data-zone`; the
 * camera reads those sections to know where it is, so the copy and the 3D
 * stay in step. Chapters hold their copy in a sticky panel while the world
 * moves behind it.
 */

/**
 * Progress through a chapter's sticky stretch, 0..1: 0 when its top reaches the
 * viewport top, 1 when its bottom reaches the viewport bottom (the moment the
 * sticky panel starts to leave). The world reads chapters the same way.
 */
function useSectionProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setP(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return [ref, p] as const;
}

/** Scroll so a chapter's progress lands on `at`. */
function scrollToProgress(el: HTMLElement | null, at: number) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top + at * Math.max(1, el.offsetHeight - window.innerHeight), behavior: 'smooth' });
}

/* ── 1. Arrival: the mark stands in the world; the words rise beneath it. ── */

export function WorldHero({
  title,
  lead,
  place,
  brandLine,
  scrollCue,
  children,
}: {
  title: string;
  lead: string;
  place: string;
  brandLine: string;
  scrollCue: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      const inner = scope.querySelector('[data-inner]');
      gsap.to(inner, { opacity: 0, y: -80, filter: 'blur(8px)', ease: 'none', scrollTrigger: { trigger: scope, start: 'top top', end: '30% top', scrub: true } });
    },
    ref,
  );
  const words = title.split(' ');
  return (
    <section ref={ref} className={styles.hero} data-zone="hero" aria-labelledby="home-title">
      <div className={styles.sticky}>
        <div className={`container ${styles.heroInner}`} data-inner="">
          <div className={styles.fallbackMark} aria-hidden="true">
            <Logo title={null} />
            <span>{brandLine}</span>
          </div>
          <div className={styles.heroBottom}>
            <h1 id="home-title" className={styles.heroTitle} aria-label={title}>
              {words.map((w, i) => (
                <Fragment key={i}>
                  <span className={styles.word} aria-hidden="true">
                    <span style={{ animationDelay: `${0.35 + i * 0.09}s` }}>{w}</span>
                  </span>
                  {i < words.length - 1 && ' '}
                </Fragment>
              ))}
            </h1>
            <div className={styles.heroSide}>
              <p className={`t-lead ${styles.heroLead}`}>{lead}</p>
              <div className={styles.actions}>{children}</div>
            </div>
          </div>
          <p className={styles.place}>
            <span>{place}</span>
            <span className={styles.cue} aria-hidden="true" />
            <span>{scrollCue}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── 2. The network: the people behind the work, counted in as it connects. ── */

export interface NetworkFact {
  value: number;
  suffix: string;
  label: string;
  body: string;
}

export function NetworkChapter({ label, title, facts }: { label: string; title: string; facts: NetworkFact[] }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      const rows = gsap.utils.toArray<HTMLElement>('[data-fact]', scope);
      const nums = gsap.utils.toArray<HTMLElement>('[data-count]', scope);
      if (reduced) {
        nums.forEach((n) => (n.textContent = n.dataset.count ?? ''));
        return;
      }
      // Starts as the chapter rises into view, so the network arrives straight after the mark leaves.
      const tl = gsap.timeline({ scrollTrigger: { trigger: scope, start: 'top 98%', end: '78% bottom', scrub: 0.6 } });
      tl.from(scope.querySelector('[data-head]'), { opacity: 0, y: 60, duration: 0.6 });
      rows.forEach((row, i) => {
        const num = nums[i]!;
        const to = Number(num.dataset.count);
        const box = { v: 0 };
        tl.from(row, { opacity: 0, x: 120, filter: 'blur(10px)', duration: 0.8 }, 0.4 + i * 0.9);
        tl.to(box, { v: to, duration: 0.8, ease: 'none', onUpdate: () => (num.textContent = String(Math.round(box.v))) }, 0.4 + i * 0.9);
      });
    },
    ref,
  );
  return (
    <section ref={ref} className={styles.network} data-zone="network" aria-labelledby="network-title">
      <div className={styles.sticky} data-exit="">
        <div className={`container ${styles.networkInner}`}>
          <div className={styles.networkHead} data-head="">
            <p className="chapter-label">{label}</p>
            <h2 id="network-title" className={styles.title}>
              {title}
            </h2>
          </div>
          <ol role="list" className={styles.facts}>
            {facts.map((f) => (
              <li key={f.label} className={styles.fact} data-fact="">
                <p className={styles.factNum}>
                  <span data-count={f.value}>{f.value}</span>
                  <span className={styles.factSuffix}>{f.suffix}</span>
                </p>
                <div className={styles.factText}>
                  <p className={styles.factLabel}>{f.label}</p>
                  <p className="t-body">{f.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ── 3. Services: the ring turns to each one; the panel reads it out. ── */

export interface RingService {
  slug: string;
  n: string;
  name: string;
  summary: string;
  render: string;
}

export function ServiceRing({ items, copy }: { items: RingService[]; copy: { label: string; title: string; explore: string; all: { label: string; href: string } } }) {
  const [ref, p] = useSectionProgress<HTMLElement>();
  // The "all services" link closes the chapter, then fades as it rises over the road that follows.
  useGsap(
    ({ reduced, scope }) => {
      const all = scope.querySelector('[data-all]');
      if (reduced || !all) return;
      gsap.to(all, { opacity: 0, y: -30, ease: 'none', scrollTrigger: { trigger: all, start: 'top 72%', end: 'top 42%', scrub: true } });
    },
    ref,
  );
  const N = items.length;
  const active = Math.min(N - 1, Math.max(0, Math.round(p * N - 0.37)));
  const it = items[active]!;
  return (
    <section
      ref={ref}
      className={styles.ring}
      data-zone="services"
      data-renders={items.map((s) => s.render).join(',')}
      style={{ '--count': N } as CSSProperties}
      aria-labelledby="ring-title"
    >
      <div className={styles.sticky} data-exit="">
        <div className={`container ${styles.ringInner}`}>
          <div className={styles.panel}>
            <p className="chapter-label">{copy.label}</p>
            <h2 id="ring-title" className={styles.ringTitle}>
              {copy.title}
            </h2>
            <div key={it.slug} className={styles.current}>
              <p className={styles.counter}>
                <span>{it.n}</span> / {String(N).padStart(2, '0')}
              </p>
              <h3 className={styles.serviceName}>{it.name}</h3>
              <p className={styles.serviceLine}>{it.summary}</p>
              <TransitionLink href={`/services/${it.slug}`} className={styles.explore} data-cta="">
                {copy.explore} {it.name} <span aria-hidden="true">→</span>
              </TransitionLink>
            </div>
          </div>
          <ol role="list" className={styles.index} aria-label="All services">
            {items.map((s, i) => (
              <li key={s.slug}>
                <button type="button" data-on={i === active || undefined} onClick={() => scrollToProgress(ref.current, (i + 0.4) / N)}>
                  <span>{s.n}</span>
                  {s.name}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className={styles.ringAll} data-all="">
        <Button href={copy.all.href} variant="outline" size="sm">
          {copy.all.label}
        </Button>
      </p>
    </section>
  );
}

/* ── 4. How we work: walking the red road past each step. ── */

export function ProcessRoad({ label, title, steps }: { label: string; title: string; steps: readonly { title: string; body: string }[] }) {
  const [ref, p] = useSectionProgress<HTMLElement>();
  // The heading and the first step glide up into place while the camera runs down the road to it.
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      const parts = gsap.utils.toArray<HTMLElement>('[data-road-in]', scope);
      gsap.from(parts, {
        y: 90,
        opacity: 0,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: scope, start: 'top 92%', end: 'top 20%', scrub: 0.8 },
      });
    },
    ref,
  );
  const N = steps.length;
  const active = Math.min(N - 1, Math.max(0, Math.round(p * N - 0.37)));
  const st = steps[active]!;
  return (
    <section ref={ref} className={styles.road} data-zone="process" aria-labelledby="road-title">
      <div className={styles.sticky} data-exit="">
        <div className={`container ${styles.roadInner}`}>
          <p className="chapter-label" data-road-in="">
            {label}
          </p>
          <h2 id="road-title" className={styles.title} data-road-in="">
            {title}
          </h2>
          <div data-road-in="">
            <div className={styles.roadStep} key={active}>
              <span className={styles.roadNum}>{String(active + 1).padStart(2, '0')}</span>
              <div>
                <h3 className={styles.roadName}>{st.title}</h3>
                <p className="t-body">{st.body}</p>
              </div>
            </div>
          </div>
          <ol role="list" className={styles.roadDots} aria-label="Steps">
            {steps.map((s, i) => (
              <li key={s.title} data-on={i === active || undefined} data-past={i < active || undefined}>
                <button type="button" onClick={() => scrollToProgress(ref.current, (i + 0.4) / N)}>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ── 5. Clients: from above the world, the logos fly in and lock into place. ── */

export function ClientAssembly({ label, title, orgs }: { label: string; title: string; orgs: Organization[] }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      let seed = 11;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const tiles = gsap.utils.toArray<HTMLElement>('[data-tile]', scope);
      const tl = gsap.timeline({ scrollTrigger: { trigger: scope, start: 'top 70%', end: '55% top', scrub: 0.8 } });
      tiles.forEach((t, i) => {
        tl.from(
          t,
          {
            x: (rnd() - 0.5) * 1400,
            y: (rnd() - 0.5) * 900,
            z: -600 - rnd() * 1400,
            rotationX: (rnd() - 0.5) * 180,
            rotationY: (rnd() - 0.5) * 220,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            force3D: true,
          },
          (i % 12) * 0.035,
        );
      });
    },
    ref,
  );
  return (
    <section ref={ref} className={styles.clients} data-zone="clients" aria-labelledby="clients-title">
      <div className={styles.sticky} data-exit="">
        <div className={`container ${styles.clientsInner}`}>
          <div className={styles.centerHead}>
            <p className="chapter-label">{label}</p>
            <h2 id="clients-title" className={styles.title}>
              {title}
            </h2>
          </div>
          <ul role="list" className={styles.wall}>
            {orgs.map((o) => (
              <li key={o.slug} className={styles.tile} data-tile="">
                <OrgLogo org={o} size="md" className={styles.tileLogo} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── 7. The people: the team, its numbers, and the community around it. ── */

export interface TeamCopy {
  label: string;
  title: string;
  communityLabel: string;
  communityLine: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}

export function TeamChapter({ copy, facts, photos }: { copy: TeamCopy; facts: { value: string; label: string }[]; photos: GalleryPhoto[] }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      gsap.from(scope.querySelectorAll('[data-rise]'), {
        y: 90,
        opacity: 0,
        rotate: (i) => (i % 2 ? 2.5 : -2.5),
        stagger: 0.12,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: scope, start: 'top 55%' },
      });
    },
    ref,
  );
  return (
    <section ref={ref} className={styles.team} data-zone="team" aria-labelledby="team-title">
      <div className={`container ${styles.teamInner}`}>
        <div className={styles.teamHead}>
          <p className="chapter-label">{copy.label}</p>
          <h2 id="team-title" className={styles.title}>
            {copy.title}
          </h2>
          <dl className={styles.teamFacts}>
            {facts.map((f) => (
              <div key={f.label}>
                <dd>{f.value}</dd>
                <dt className="meta">{f.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className={styles.community}>
          <div className={styles.communityText} data-rise="">
            <p className="chapter-label">{copy.communityLabel}</p>
            <p className={styles.communityLine}>{copy.communityLine}</p>
            <div className={styles.actions}>
              <Button href={copy.primary.href}>{copy.primary.label}</Button>
              <Button href={copy.secondary.href} variant="outline">
                {copy.secondary.label}
              </Button>
            </div>
          </div>
          <ul role="list" className={styles.strip}>
            {photos.map((ph, i) => (
              <li key={ph.slug} data-rise="" style={{ '--i': i } as CSSProperties}>
                <Image src={ph.url} alt={ph.alt} fill sizes="(min-width: 960px) 20vw, 45vw" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── 9. Full circle: the mark again, and the way in. ── */

export function Finale({ motto, title, children }: { motto: string; title: string; children?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      gsap.from(scope.querySelectorAll('[data-up]'), { y: 60, opacity: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: scope, start: 'top 45%' } });
    },
    ref,
  );
  return (
    <section ref={ref} className={styles.finale} data-zone="finale" aria-labelledby="finale-title">
      <div className={`container ${styles.finaleInner}`}>
        <p className={styles.motto} data-up="">
          {motto}
        </p>
        <h2 id="finale-title" className={styles.finaleTitle} data-up="">
          {title}
        </h2>
        {children && (
          <div className={styles.actions} data-up="">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Each pinned chapter's content fades and lifts away over the last stretch of
 * its scroll, so a chapter never lingers over the next one's world. One
 * listener for the whole page, one write per chapter per frame.
 */
export function ChapterExits() {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const zone of document.querySelectorAll<HTMLElement>('[data-zone]')) {
        const items = zone.querySelectorAll<HTMLElement>('[data-exit]');
        if (!items.length) continue;
        const r = zone.getBoundingClientRect();
        const p = -r.top / Math.max(1, r.height - vh);
        const exit = Math.min(1, Math.max(0, (p - 0.86) / 0.14));
        for (const el of items) {
          el.style.opacity = exit > 0 ? String(1 - exit) : '';
          el.style.transform = exit > 0 ? `translate3d(0, ${(-exit * 5).toFixed(2)}vh, 0)` : '';
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return null;
}

'use client';

import Image from 'next/image';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { gsap, useGsap } from '@/features/motion/gsap';
import type { GalleryPhoto, GalleryTag, Organization, TeamMember } from '@/types/content';
import styles from './CommunityWorld.module.css';

/*
 * GWD Community is warm and hand-made: the page sits on a haze the album
 * flies through, and every section is built from the community's own photos.
 */

type Tag = GalleryTag;
type Photo = GalleryPhoto;

/* The album (from the CMS) for every section on the page; sections pick photos by slug. */
const AlbumContext = createContext<Photo[]>([]);
export function AlbumProvider({ photos, children }: { photos: Photo[]; children: ReactNode }) {
  return <AlbumContext.Provider value={photos}>{children}</AlbumContext.Provider>;
}
function useAlbum() {
  const photos = useContext(AlbumContext);
  return useMemo(() => {
    const by = new Map(photos.map((p) => [p.slug, p]));
    return { photos, photo: (slug: string | undefined) => (slug ? by.get(slug) : undefined) };
  }, [photos]);
}
const src = (p: Photo, small = false) => (small ? (p.smallUrl ?? p.url) : p.url);

function useInView<T extends HTMLElement>(margin = '0px 0px -20% 0px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, seen] as const;
}

/* ── Hero: three arched windows onto the community ───────────────────── */

interface HeroProps {
  label: string;
  title: string;
  struck: string;
  lead: string;
  join: { label: string; href: string };
  campus: { label: string; href: string };
  facts: { value: string; label: string }[];
  arches: string[][];
}

export function ArchHero({ label, title, struck, lead, join, campus, facts, arches }: HeroProps) {
  const { photo } = useAlbum();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 3400);
    return () => window.clearInterval(id);
  }, []);
  return (
    <section className={styles.hero} aria-labelledby="community-title">
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <p className="chapter-label">{label}</p>
          <h1 id="community-title" className={styles.heroTitle}>
            {title} {struck && <span className={styles.struck}>{struck}</span>}.
          </h1>
          <p className={`t-lead ${styles.heroLead}`}>{lead}</p>
          <div className={styles.actions}>
            <Button href={join.href} external={join.href.startsWith('http')}>
              {join.label}
            </Button>
            <Button href={campus.href} external={campus.href.startsWith('http')} variant="outline">
              {campus.label}
            </Button>
          </div>
          <dl className={styles.facts}>
            {facts.map((f) => (
              <div key={f.label}>
                <dd>{f.value}</dd>
                <dt className="meta">{f.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className={styles.arches}>
          {arches.map((slugs, a) => {
            const set = slugs.map((slug) => photo(slug)).filter((p): p is Photo => Boolean(p));
            return (
              <div key={a} className={styles.arch} style={{ '--d': `${0.2 + a * 0.18}s` } as CSSProperties}>
                {set.map((p, k) => {
                  const on = (tick + a) % set.length === k;
                  return (
                    <Image
                      key={p.slug}
                      src={src(p)}
                      alt={k === 0 ? p.alt : ''}
                      fill
                      sizes="(min-width: 960px) 36vw, 64vw"
                      className={styles.archImg}
                      data-on={on || undefined}
                      priority={k === 0}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── How we built it: photographs that develop as you reach them ─────── */

export interface Chapter {
  head: string;
  body: string;
  main: string;
  side1?: string;
  side2?: string;
}

function StoryChapter({ c, i }: { c: Chapter; i: number }) {
  const [ref, seen] = useInView<HTMLLIElement>('0px 0px -30% 0px');
  const { photo } = useAlbum();
  const main = photo(c.main);
  const sides = [c.side1, c.side2].map((slug) => photo(slug)).filter((p): p is Photo => Boolean(p));
  return (
    <li ref={ref} className={styles.chapter} data-in={seen || undefined} data-flip={i % 2 || undefined}>
      <div className={styles.chapterText}>
        <h3 className={styles.chapterHead}>{c.head}</h3>
        <p className="t-body">{c.body}</p>
      </div>
      {main && (
        <figure className={styles.print}>
          <div className={styles.printImg} style={{ aspectRatio: `${main.width} / ${main.height}` }}>
            <Image src={src(main)} alt={main.alt} fill sizes="(min-width: 960px) 44vw, 92vw" />
          </div>
          <figcaption className={styles.caption}>{main.alt}</figcaption>
        </figure>
      )}
      <div className={styles.sides} aria-hidden="true">
        {sides.map((p, k) => {
          return (
            <div key={p.slug} className={styles.side} style={{ aspectRatio: `${p.width} / ${p.height}`, '--k': k } as CSSProperties}>
              <Image src={src(p, true)} alt="" fill sizes="(min-width: 960px) 16vw, 40vw" />
            </div>
          );
        })}
      </div>
    </li>
  );
}

export function BuiltStory({ label, title, chapters }: { label: string; title: string; chapters: Chapter[] }) {
  const ref = useRef<HTMLElement>(null);
  useGsap(({ reduced, scope }) => {
    if (reduced) return;
    const bar = scope.querySelector<HTMLElement>('[data-thread]');
    if (!bar) return;
    gsap.fromTo(bar, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: scope, start: 'top 60%', end: 'bottom 70%', scrub: true } });
  }, ref);
  return (
    <section ref={ref} className={styles.story} aria-labelledby="story-title">
      <div className="container">
        <div className={styles.storyHead}>
          <p className="chapter-label">{label}</p>
          <h2 id="story-title" className={styles.title}>
            {title}
          </h2>
        </div>
        <div className={styles.thread} aria-hidden="true">
          <span data-thread="" />
        </div>
        <ol role="list" className={styles.chapters}>
          {chapters.map((c, i) => (
            <StoryChapter key={`${i}-${c.head}`} c={c} i={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── The team: a pinned walk past the people, photo by photo ────────── */

export function TeamReel({
  label,
  title,
  photos,
  facts,
}: {
  label: string;
  title: string;
  photos: { slug: string; caption?: string }[];
  facts: { value: string; label: string }[];
}) {
  const ref = useRef<HTMLElement>(null);
  const { photo } = useAlbum();
  const shots = photos.flatMap((r) => {
    const p = photo(r.slug);
    return p ? [{ ...p, caption: r.caption?.trim() || p.alt }] : [];
  });
  useGsap(({ reduced, scope }) => {
    if (reduced) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const track = scope.querySelector<HTMLElement>('[data-track]');
      if (!track) return;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true },
      });
      gsap.utils.toArray<HTMLElement>('[data-par]', scope).forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -10, scale: 1.18 },
          {
            xPercent: 10,
            scale: 1.08,
            ease: 'none',
            scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          },
        );
      });
    });
    return () => mm.revert();
  }, ref);
  return (
    <section ref={ref} className={styles.reel} aria-labelledby="reel-title">
      <div className={styles.reelTrack} data-track="">
        <div className={styles.reelIntro}>
          <p className="chapter-label">{label}</p>
          <h2 id="reel-title" className={styles.title}>
            {title}
          </h2>
          <dl className={styles.reelFacts}>
            {facts.map((f) => (
              <div key={f.label}>
                <dd>{f.value}</dd>
                <dt className="meta">{f.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        {shots.map((p, i) => {
          return (
            <figure key={p.slug} className={styles.reelFrame} data-tall={i % 3 === 1 || undefined}>
              <div className={styles.reelImg}>
                <Image src={src(p)} alt={p.alt} fill sizes="(min-width: 900px) 46vw, 86vw" data-par="" />
              </div>
              <figcaption className={styles.reelCap}>
                <span className="meta">{String(i + 1).padStart(2, '0')}</span>
                {p.caption}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/* ── Pillars: outlined titles that fill with ink as you read them ────── */

export interface SectionCopy {
  label: string;
  title: string;
  lead?: string;
}

export function InkPillars({
  copy,
  note,
  items,
}: {
  copy: SectionCopy;
  note?: { big: string; small: string };
  items: { title: string; summary: string; detail: string | null; metric?: string | null }[];
}) {
  const ref = useRef<HTMLElement>(null);
  useGsap(({ reduced, scope }) => {
    if (reduced) return;
    gsap.utils.toArray<HTMLElement>('[data-ink]', scope).forEach((el) => {
      gsap.fromTo(el, { '--fill': '0%' }, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 48%', scrub: true } });
    });
  }, ref);
  return (
    <section ref={ref} className={styles.section} aria-labelledby="pillars-title">
      <div className="container">
        <div className={styles.split}>
          <div className={styles.splitHead}>
            <p className="chapter-label">{copy.label}</p>
            <h2 id="pillars-title" className={styles.title}>
              {copy.title}
            </h2>
            {copy.lead && <p className="t-lead">{copy.lead}</p>}
            {note && (
              <p className={styles.freeNote}>
                <span className={styles.freeBig} data-ink="">
                  {note.big}
                </span>
                <span>{note.small}</span>
              </p>
            )}
          </div>
          <ul role="list" className={styles.inkList}>
            {items.map((p) => (
              <li key={p.title} className={styles.ink}>
                <div className={styles.inkHead}>
                  <h3 className={styles.inkTitle} data-ink="">
                    {p.title}
                  </h3>
                  {p.metric && <span className={styles.badge}>{p.metric}</span>}
                </div>
                <p className={styles.inkSummary}>{p.summary}</p>
                {p.detail && <p className="t-body">{p.detail}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── The difference: the old list gets struck out, the new one lights ── */

export function StrikeContrast({
  copy,
  oldLabel,
  oldLines,
  newLabel,
  newLines,
  note,
}: {
  copy: SectionCopy;
  oldLabel: string;
  oldLines: string[];
  newLabel: string;
  newLines: string[];
  note: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>('0px 0px -35% 0px');
  return (
    <section className={styles.section} aria-labelledby="contrast-title">
      <div className="container">
        <div className={styles.centerHead}>
          <p className="chapter-label">{copy.label}</p>
          <h2 id="contrast-title" className={styles.title}>
            {copy.title}
          </h2>
        </div>
        <div ref={ref} className={styles.contrast} data-in={seen || undefined}>
          <div className={styles.old}>
            <p className="meta">{oldLabel}</p>
            <ul role="list">
              {oldLines.map((t, i) => (
                <li key={t} style={{ '--i': i } as CSSProperties}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.new}>
            <p className="meta">{newLabel}</p>
            <ul role="list">
              {newLines.map((t, i) => (
                <li key={t} style={{ '--i': i } as CSSProperties}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.note}>{note}</p>
      </div>
    </section>
  );
}

/* ── Formats: three tickets, printed as you arrive ───────────────────── */

export function FormatTickets({ copy, items }: { copy: SectionCopy; items: { title: string; summary: string }[] }) {
  const [ref, seen] = useInView<HTMLUListElement>('0px 0px -25% 0px');
  return (
    <section className={styles.section} aria-labelledby="formats-title">
      <div className="container">
        <div className={styles.centerHead}>
          <p className="chapter-label">{copy.label}</p>
          <h2 id="formats-title" className={styles.title}>
            {copy.title}
          </h2>
          {copy.lead && <p className="t-lead">{copy.lead}</p>}
        </div>
        <ul ref={ref} role="list" className={styles.tickets} data-in={seen || undefined}>
          {items.map((f, i) => (
            <li key={f.title} className={styles.ticket} style={{ '--i': i } as CSSProperties}>
              <div className={styles.ticketMain}>
                <p className="meta">GWD Community presents</p>
                <h3 className={styles.ticketTitle}>{f.title}</h3>
                <p className="t-body">{f.summary}</p>
              </div>
              <div className={styles.stub} aria-hidden="true">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <i />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Pathway: a route drawn down the page as you follow it ───────────── */

export function PathwayRoute({ copy, note, steps }: { copy: SectionCopy; note?: string; steps: { tag?: string; title: string; body: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  const [reached, setReached] = useState(-1);
  useGsap(({ reduced, scope }) => {
    const path = scope.querySelector<SVGPathElement>('[data-route]');
    if (!path) return;
    if (reduced) {
      setReached(steps.length - 1);
      return;
    }
    const list = scope.querySelector<HTMLElement>('[data-stops]');
    gsap.fromTo(
      path,
      { strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: list,
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: true,
          onUpdate: (st) => setReached(Math.floor(st.progress * steps.length - 0.15)),
        },
      },
    );
  }, ref);
  return (
    <section ref={ref} className={styles.section} aria-labelledby="pathway-title">
      <div className="container">
        <div className={styles.centerHead}>
          <p className="chapter-label">{copy.label}</p>
          <h2 id="pathway-title" className={styles.title}>
            {copy.title}
          </h2>
          {copy.lead && <p className="t-lead">{copy.lead}</p>}
        </div>
        <div className={styles.route}>
          <svg className={styles.routeSvg} viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true">
            <path d="M50 0 C 90 100, 90 200, 50 250 S 10 400, 50 500 S 90 650, 50 750 S 10 900, 50 1000" className={styles.routeBase} />
            <path
              data-route=""
              pathLength={1}
              d="M50 0 C 90 100, 90 200, 50 250 S 10 400, 50 500 S 90 650, 50 750 S 10 900, 50 1000"
              className={styles.routeLine}
            />
          </svg>
          <ol role="list" className={styles.stops} data-stops="">
            {steps.map((s, i) => (
              <li key={s.title} className={styles.stop} data-on={i <= reached || undefined} data-side={i % 2 ? 'r' : 'l'}>
                <span className={styles.stopDot} aria-hidden="true" />
                <div className={styles.stopCard} data-last={i === steps.length - 1 || undefined}>
                  {s.tag && <p className={styles.stopTag}>{s.tag}</p>}
                  <h3 className={styles.stopTitle}>{s.title}</h3>
                  <p className="t-body">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {note && (
          <p className={styles.pathNote}>
            <span className={styles.pathArrow} aria-hidden="true">
              →
            </span>
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

/* ── Startup ideas: a stepper that charges up to "Invest" ─────────────── */

export function IdeaBacking({ copy, steps, note }: { copy: SectionCopy; steps: { title: string; body: string }[]; note?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [lit, setLit] = useState(-1);
  useGsap(({ reduced, scope }) => {
    if (reduced) {
      setLit(steps.length - 1);
      return;
    }
    const bar = scope.querySelector('[data-charge]');
    gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: scope.querySelector('[data-steps]'),
          start: 'top 80%',
          end: 'top 25%',
          scrub: true,
          onUpdate: (st) => setLit(Math.min(steps.length - 1, Math.floor(st.progress * steps.length - 0.05))),
        },
      },
    );
  }, ref);
  return (
    <section ref={ref} className={styles.section} aria-labelledby="ideas-title">
      <div className="container">
        <div className={styles.ideaHead}>
          <p className="chapter-label">{copy.label}</p>
          <h2 id="ideas-title" className={styles.ideaTitle}>
            {copy.title}
          </h2>
          {copy.lead && <p className="t-lead">{copy.lead}</p>}
        </div>
        <div className={styles.charge} aria-hidden="true">
          <span data-charge="" />
          {steps.map((s, i) => (
            <i key={s.title} data-on={i <= lit || undefined} style={{ left: `${(i / steps.length) * 100 + 100 / steps.length / 2}%` }} />
          ))}
        </div>
        <ol role="list" className={styles.ideaSteps} data-steps="">
          {steps.map((s, i) => (
            <li key={s.title} className={styles.ideaStep} data-on={i <= lit || undefined} data-final={i === steps.length - 1 || undefined}>
              <p className={styles.ideaN}>Step {i + 1}</p>
              <h3 className={styles.ideaName}>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
        {note && (
          <p className={styles.pathNote}>
            <span className={styles.pathArrow} aria-hidden="true">
              →
            </span>
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

/* ── Across Hyderabad: campuses light up on a line, one by one ─────────── */

export function CampusExpansion({
  copy,
  steps,
  target,
  longGame,
}: {
  copy: SectionCopy;
  steps: { title: string; body: string }[];
  target: { value: string; label: string } | null;
  longGame: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>('0px 0px -30% 0px');
  return (
    <section className={styles.section} aria-labelledby="campus-title">
      <div className="container">
        <div className={styles.campusGrid}>
          <div className={styles.campusHead}>
            <p className="chapter-label">{copy.label}</p>
            <h2 id="campus-title" className={styles.title}>
              {copy.title}
            </h2>
            {copy.lead && <p className="t-lead">{copy.lead}</p>}
            {target && (
              <p className={styles.target} data-in={seen || undefined}>
                <strong>{target.value}</strong>
                <span>{target.label}</span>
              </p>
            )}
          </div>
          <div ref={ref} className={styles.campusSteps} data-in={seen || undefined}>
            {steps.map((s, i) => (
              <div key={s.title} className={styles.campusStep} style={{ '--i': i } as CSSProperties}>
                <span className={styles.campusN}>{i + 1}</span>
                <div>
                  <h3 className={styles.campusName}>{s.title}</h3>
                  <p className="t-body">{s.body}</p>
                </div>
              </div>
            ))}
            <p className={styles.longGame} style={{ '--i': steps.length } as CSSProperties}>
              <span>The long game</span>
              <strong>{longGame}</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Gallery: the whole album, filterable, with a lightbox ───────────── */

const TAGS: { key: 'all' | Tag; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'team', label: 'The team' },
  { key: 'events', label: 'Events' },
  { key: 'workshops', label: 'Workshops' },
];

export function Gallery({ label, title }: { label: string; title: string }) {
  const { photos: PHOTOS } = useAlbum();
  const [tag, setTag] = useState<'all' | Tag>('all');
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const list = tag === 'all' ? PHOTOS : PHOTOS.filter((p) => p.tag === tag);

  const change = (fn: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doc.startViewTransition(() => flushSync(fn));
    } else fn();
  };
  const show = (i: number) => {
    setOpen(i);
    dialog.current?.showModal();
  };
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + list.length) % list.length)), [list.length]);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    const close = () => setOpen(null);
    el.addEventListener('keydown', key);
    el.addEventListener('close', close);
    return () => {
      el.removeEventListener('keydown', key);
      el.removeEventListener('close', close);
    };
  }, [step]);
  const current = open === null ? null : list[open];

  return (
    <section className={styles.section} aria-labelledby="gallery-title">
      <div className="container">
        <div className={styles.galleryHead}>
          <div>
            <p className="chapter-label">{label}</p>
            <h2 id="gallery-title" className={styles.title}>
              {title}
            </h2>
          </div>
          <div className={styles.filters} role="group" aria-label="Filter photos">
            {TAGS.map((t) => {
              const n = t.key === 'all' ? PHOTOS.length : PHOTOS.filter((p) => p.tag === t.key).length;
              return (
                <button key={t.key} type="button" className={styles.filter} aria-pressed={tag === t.key} onClick={() => change(() => setTag(t.key))}>
                  {t.label}
                  <span>{n}</span>
                </button>
              );
            })}
          </div>
        </div>
        <ul role="list" className={styles.masonry}>
          {list.map((p, i) => (
            <li key={p.slug} className={styles.tile} style={{ viewTransitionName: `ph-${p.slug}` } as CSSProperties}>
              <button type="button" className={styles.tileBtn} onClick={() => show(i)} aria-label={`Open photo: ${p.alt}`}>
                <Image src={src(p, true)} alt={p.alt} width={p.width} height={p.height} sizes="(min-width: 1100px) 25vw, (min-width: 640px) 33vw, 50vw" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <dialog ref={dialog} className={styles.lightbox} aria-label="Photo viewer">
        {current && (
          <figure className={styles.lbFigure}>
            <Image
              key={current.slug}
              src={src(current)}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="92vw"
              className={styles.lbImg}
            />
            <figcaption className={styles.lbCaption}>
              <span>{current.alt}</span>
              <span className="meta">
                {(open ?? 0) + 1} / {list.length}
              </span>
            </figcaption>
          </figure>
        )}
        <button type="button" className={`${styles.lbBtn} ${styles.lbPrev}`} onClick={() => step(-1)} aria-label="Previous photo">
          ←
        </button>
        <button type="button" className={`${styles.lbBtn} ${styles.lbNext}`} onClick={() => step(1)} aria-label="Next photo">
          →
        </button>
        <button type="button" className={`${styles.lbBtn} ${styles.lbClose}`} onClick={() => dialog.current?.close()} aria-label="Close photo viewer">
          ×
        </button>
      </dialog>
    </section>
  );
}

/* ── Network: logos that bob on the haze ─────────────────────────────── */

export function NetworkFloat({ copy, orgs }: { copy: SectionCopy; orgs: Organization[] }) {
  const [ref, seen] = useInView<HTMLUListElement>('0px 0px -15% 0px');
  return (
    <section className={styles.section} aria-labelledby="network-title">
      <div className="container">
        <div className={styles.centerHead}>
          <p className="chapter-label">{copy.label}</p>
          <h2 id="network-title" className={styles.title}>
            {copy.title}
          </h2>
          {copy.lead && <p className="t-lead">{copy.lead}</p>}
        </div>
        <ul ref={ref} role="list" className={styles.float} data-in={seen || undefined}>
          {orgs.map((o, i) => (
            <li key={o.slug} className={styles.bubble} style={{ '--i': i, '--t': `${5 + (i % 4) * 1.3}s` } as CSSProperties}>
              <span className={styles.bubbleIn}>
                <Image src={o.logoUrl!} alt={o.name} fill sizes="140px" className={styles.bubbleImg} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Leadership: who runs it, kept small, at the foot of the page ────── */

export function Leadership({ title, people }: { title: string; people: TeamMember[] }) {
  const directors = people.filter((p) => p.tier === 'founder');
  const leads = people.filter((p) => p.tier !== 'founder');
  if (!people.length) return null;
  return (
    <section className={styles.leaders} aria-labelledby="leaders-title">
      <div className="container">
        <h2 id="leaders-title" className={styles.leadersTitle}>
          {title}
        </h2>
        <ul role="list" className={styles.directors}>
          {directors.map((p, i) => (
            <li key={p.slug} data-lead={i === 0 || undefined}>
              {p.photoUrl ? (
                <span className={styles.avatar}>
                  <Image src={p.photoUrl} alt="" fill sizes="96px" />
                </span>
              ) : (
                <span className={styles.avatarEmpty} aria-hidden="true">
                  {p.name
                    .split(' ')
                    .filter((w) => !/^(mohd|mohammed)$/i.test(w))
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              )}
              <span className={styles.directorText}>
                <span className="meta">{p.role}</span>
                <strong>{p.name}</strong>
              </span>
            </li>
          ))}
        </ul>
        {leads.length > 0 && (
          <ul role="list" className={styles.leads}>
            {leads.map((p) => (
              <li key={p.slug}>
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

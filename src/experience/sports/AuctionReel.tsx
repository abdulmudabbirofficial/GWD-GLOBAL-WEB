'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AuctionReel.module.css';

export interface Clip {
  key: string;
  src: string;
  poster: string;
  title: string;
  note: string;
  shape: 'wide' | 'tall';
}

/**
 * The night GWD Sports went live, on film. Two screens switch on like an old
 * set as you arrive; nothing plays until you press play, and then it plays
 * with its own sound (the page's ambient sound steps aside while it does).
 */
export function AuctionReel({
  eyebrow,
  title,
  lead,
  play: playLabel,
  clips,
  voice = 'stadium',
  id = 'reel-title',
}: {
  eyebrow: string;
  title: string;
  lead: string;
  play: string;
  clips: readonly Clip[];
  /** Typeface: the Sports matchday voice, or Community's warm one. */
  voice?: 'stadium' | 'warm';
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setOn(true), io.disconnect()), { rootMargin: '0px 0px -30% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const play = (key: string) => {
    for (const [k, v] of Object.entries(videos.current)) if (k !== key) v?.pause();
    const v = videos.current[key];
    if (!v) return;
    v.muted = false;
    v.controls = true;
    void v.play();
  };

  // Let the site's soundscape duck while a film is playing.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gwd:media', { detail: { playing: Boolean(playing) } }));
  }, [playing]);

  return (
    <section ref={ref} className={styles.reel} data-on={on || undefined} data-voice={voice} aria-labelledby={id}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>
            <span className={styles.air} data-live={playing ? '' : undefined} aria-hidden="true" />
            {eyebrow}
          </p>
          <h2 id={id} className={styles.title}>
            {title}
          </h2>
          <p className="t-lead">{lead}</p>
        </div>
        <div className={styles.screens}>
          {clips.map((c, i) => (
            <figure key={c.key} className={styles.screen} data-shape={c.shape} style={{ animationDelay: `${0.15 + i * 0.35}s` }}>
              <div className={styles.frame}>
                <video
                  ref={(v) => {
                    videos.current[c.key] = v;
                  }}
                  className={styles.video}
                  src={c.src}
                  poster={c.poster}
                  preload="metadata"
                  playsInline
                  onPlay={() => setPlaying(c.key)}
                  onPause={() => setPlaying((p) => (p === c.key ? null : p))}
                  onEnded={() => setPlaying((p) => (p === c.key ? null : p))}
                  aria-label={c.title}
                />
                {playing !== c.key && (
                  <button type="button" className={styles.play} onClick={() => play(c.key)} aria-label={`Play ${c.title}, with sound`}>
                    <span className={styles.playIcon} aria-hidden="true" />
                    <span className={styles.playText}>{playLabel}</span>
                  </button>
                )}
                <span className={styles.scan} aria-hidden="true" />
              </div>
              <figcaption className={styles.caption}>
                <strong>{c.title}</strong>
                <span>{c.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

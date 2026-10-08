'use client';

import { useEffect, type ReactNode } from 'react';
import { PageBackdrop, type BackdropName } from '@/3d/world/PageBackdrop';
import { soundscape } from '@/features/sound/soundscape';
import styles from './PageShell.module.css';

interface PageShellProps {
  /** Which live 3D world runs behind this page. */
  world: BackdropName;
  /** The page's studio: text colours and the colour behind the 3D. */
  tone: 'dark' | 'pale' | 'dusk' | 'warm';
  /** Data the page's 3D world needs (e.g. the album), read back by `readWorldPayload()`. */
  payload?: unknown;
  children: ReactNode;
}

/**
 * Every page is its own world: a live 3D backdrop for the whole scroll, its
 * own soundscape, the page's own background tone on <html>, and the content
 * layered above.
 */
export function PageShell({ world, tone, payload, children }: PageShellProps) {
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.page = world;
    html.dataset.pageTone = tone;
    // Each world has its own sound (heard only once the visitor turns sound on).
    soundscape?.setWorld(world);
    return () => {
      soundscape?.setWorld(null);
      if (html.dataset.page === world) {
        delete html.dataset.page;
        delete html.dataset.pageTone;
      }
    };
  }, [world, tone]);

  return (
    <>
      {payload !== undefined && (
        <script id="gwd-world-payload" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, '\u003c') }} />
      )}
      <PageBackdrop name={world} />
      <div className={styles.page} data-tone={tone === 'pale' || tone === 'warm' ? 'pale' : 'dark'} data-world={world}>
        {children}
      </div>
    </>
  );
}

'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for failures in the root layout itself. It replaces
 * the whole document, so it is self-contained (inline styles, no site CSS).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#070b16',
          color: '#f3efe9',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: 520, padding: 24 }}>
          <p style={{ color: '#ff4a38', letterSpacing: '0.14em', fontSize: 12, textTransform: 'uppercase' }}>GWD Global</p>
          <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: '12px 0' }}>Something didn&rsquo;t load.</h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6 }}>The site hit an unexpected problem. It has been logged. Please try again.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={reset}
              style={{ padding: '14px 22px', borderRadius: 999, border: 0, background: '#e63946', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Try again
            </button>
            {/* A full page load is intended here: the app shell itself failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ padding: '14px 22px', borderRadius: 999, border: '1px solid #444', color: '#f3efe9', textDecoration: 'none' }}>
              Home
            </a>
          </div>
          {error.digest && <p style={{ marginTop: 24, fontSize: 12, opacity: 0.5 }}>Reference · {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}

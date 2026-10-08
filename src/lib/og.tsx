import { ImageResponse } from 'next/og';
import { MARK, MARK_VIEWBOX } from '@/components/brand/mark';

export const OG_SIZE = { width: 1200, height: 630 };

interface OgOptions {
  eyebrow: string;
  title: string;
  /** Page accent: dark (company), paper (club), pitch (sports). */
  theme?: 'dark' | 'paper' | 'pitch';
}

const THEMES = {
  dark: { bg: '#09090b', fg: '#f3f5f9', sub: 'rgba(243,245,249,0.6)', letters: '#f3f5f9' },
  paper: { bg: '#cbccd0', fg: '#0c0c0e', sub: 'rgba(12,12,14,0.6)', letters: '#0c0c0e' },
  pitch: { bg: '#0d0d0f', fg: '#f3f5f9', sub: 'rgba(243,245,249,0.6)', letters: '#f3f5f9' },
};

/** Social preview image in the site's visual language: mark, eyebrow, headline, brackets. */
export function renderOg({ eyebrow, title, theme = 'dark' }: OgOptions) {
  const t = THEMES[theme];
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: t.bg,
        color: t.fg,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 40, right: 40, width: 120, height: 120, borderTop: '14px solid #e63946', borderRight: '14px solid #e63946' }} />
      <div
        style={{ position: 'absolute', bottom: 40, left: 40, width: 120, height: 120, borderBottom: '14px solid #e63946', borderLeft: '14px solid #e63946' }}
      />
      <svg viewBox={MARK_VIEWBOX} width={220} height={90}>
        <path d={MARK.brackets.bottomLeft} fill="#e63946" />
        <path d={MARK.brackets.topRight} fill="#e63946" />
        <path d={MARK.letters.g} fill={t.letters} />
        <path d={MARK.letters.w} fill={t.letters} />
        <path d={MARK.letters.d} fill={t.letters} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 26, letterSpacing: 6, textTransform: 'uppercase', color: '#ff5a66' }}>{eyebrow}</div>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, letterSpacing: -3, maxWidth: 1000 }}>{title}</div>
      </div>
      <div style={{ fontSize: 24, color: t.sub }}>GWD Global Pvt. Ltd. · Hyderabad · Get Work Done</div>
    </div>,
    OG_SIZE,
  );
}

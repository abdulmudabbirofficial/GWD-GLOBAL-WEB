import { OG_SIZE, renderOg } from '@/lib/og';

export const alt = 'GWD Global, Get Work Done';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOg({ eyebrow: 'GWD Global', title: 'Get work done.' });
}

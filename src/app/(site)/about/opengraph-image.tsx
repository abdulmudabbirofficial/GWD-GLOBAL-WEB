import { OG_SIZE, renderOg } from '@/lib/og';

export const alt = 'About GWD, GWD Global';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOg({ eyebrow: 'About GWD', title: 'A student idea. A registered company.', theme: 'dark' });
}

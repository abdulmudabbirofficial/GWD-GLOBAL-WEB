import { OG_SIZE, renderOg } from '@/lib/og';

export const alt = 'GWD Community - GWD Global';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOg({ eyebrow: 'GWD Community', title: 'We didn’t create another college club.', theme: 'dark' });
}

import { OG_SIZE, renderOg } from '@/lib/og';

export const alt = 'Contact GWD Global';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOg({ eyebrow: 'Contact', title: 'Tell us what needs doing.', theme: 'dark' });
}

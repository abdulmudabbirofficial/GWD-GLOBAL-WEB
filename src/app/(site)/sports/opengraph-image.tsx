import { OG_SIZE, renderOg } from '@/lib/og';

export const alt = 'GWD Sports, GWD Global';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOg({ eyebrow: 'GWD Sports', title: 'Every sports academy, digital.', theme: 'pitch' });
}

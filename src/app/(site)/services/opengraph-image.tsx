import { OG_SIZE, renderOg } from '@/lib/og';

export const alt = 'Services, GWD Global';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOg({ eyebrow: 'Services', title: 'Fifteen services. One team.', theme: 'dark' });
}

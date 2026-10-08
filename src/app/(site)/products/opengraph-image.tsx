import { OG_SIZE, renderOg } from '@/lib/og';

export const alt = 'Products, GWD Global';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOg({ eyebrow: 'Products', title: 'Services pay the bills. Products build the company.', theme: 'dark' });
}

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { bigShoulders, bricolage, geist, geistMono, newsreader } from '@/lib/fonts';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'GWD Global - Get Work Done', template: `%s - ${SITE_NAME}` },
  description:
    'GWD Global is a Hyderabad technology company that builds software for clients in ten countries, runs its own products and grows the talent that does the work.',
  applicationName: SITE_NAME,
  authors: [{ name: 'GWD Global Pvt. Ltd.' }],
  creator: 'GWD Global Pvt. Ltd.',
  formatDetection: { telephone: false, address: false, email: false },
  robots: { index: true, follow: true },
  // Google Search Console's ownership check (the "HTML tag" method). Set
  // GOOGLE_SITE_VERIFICATION on Vercel to the code Search Console gives you,
  // then redeploy; with it unset, no tag is rendered.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = { themeColor: '#09090b', colorScheme: 'dark', width: 'device-width', initialScale: 1 };

/*
 * Before first paint: marks scripting (kinetic headlines wait hidden for GSAP,
 * with a safety net if scripts are slow) and starts the first-visit intro.
 */
const bootScript =
  "var d=document.documentElement;d.classList.add('js');try{if(!sessionStorage.getItem('gwd:intro-seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('intro')}catch(e){}setTimeout(function(){d.classList.add('kinetic-safe')},5000);";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} ${bigShoulders.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

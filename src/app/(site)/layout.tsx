import { Suspense, type ReactNode } from 'react';
import { WorldCanvas } from '@/3d/world/WorldCanvas';
import { CtaTracker } from '@/features/analytics/CtaTracker';
import { ScrollFX } from '@/features/motion/ScrollFX';
import { Preloader } from '@/features/preloader/Preloader';
import { RegisterDrawer } from '@/features/register/RegisterDrawer';
import { SmoothScroll } from '@/features/smooth-scroll/SmoothScroll';
import { TransitionProvider } from '@/features/transition/TransitionProvider';
import { Footer } from '@/layouts/Footer';
import { ImageOverrides } from '@/features/media/ImageOverrides';
import { Header } from '@/layouts/Header';
import { SocialLinks } from '@/layouts/SocialLinks';
import { imageOverrides } from '@/server/modules/admin/image-overrides';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';

/*
 * Layers, back to front: the single WebGL canvas (seen only through chapters
 * that ask for it), the page, the header, the page curtain and the
 * first-visit preloader.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [services, settings, copy] = await Promise.all([content.services(), content.settings(), siteCopy()]);
  const practices = services.map((s) => ({ slug: s.slug, name: s.shortName || s.name }));
  const nav = copy.doc('global.nav').items;

  return (
    <ImageOverrides value={imageOverrides(settings)}>
      <TransitionProvider nav={nav}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <WorldCanvas />
        <SmoothScroll />
        <CtaTracker />
        <ScrollFX />
        <Header nav={nav} actions={copy.doc('global.actions')} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <SocialLinks social={copy.doc('global.social')} variant="dock" />
        {/* Reads ?register= from the URL, so it renders on the client only. */}
        <Suspense fallback={null}>
          <RegisterDrawer practices={practices} />
        </Suspense>
        <Preloader />
        <div className="grain" aria-hidden="true" />
      </TransitionProvider>
    </ImageOverrides>
  );
}

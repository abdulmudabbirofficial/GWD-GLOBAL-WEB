'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { SoundToggle } from '@/features/sound/SoundToggle';
import { TransitionLink } from '@/features/transition/TransitionLink';
import { isActivePath, pageAction, type NavItem, type PageActions } from '@/lib/site';
import { Menu } from './Menu';
import styles from './Header.module.css';

/**
 * The mark, six small links (the current page carries a red dot) and the
 * page's own next step. It steps out of the way while reading down the page,
 * returns on any scroll up, and gains a smoked plate once the page has moved.
 */
export function Header({ nav, actions }: { nav: readonly NavItem[]; actions: PageActions }) {
  const pathname = usePathname();
  const action = pageAction(pathname, actions);
  const [menuOpen, setMenuOpen] = useState(false);
  const [state, setState] = useState<{ hidden: boolean; plate: boolean }>({ hidden: false, plate: false });
  const toggleRef = useRef<HTMLButtonElement>(null);

  // The menu only exists below 1024px; close it if the window grows past that.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => e.matches && setMenuOpen(false);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) < 4) return;
      last = y;
      setState((s) => {
        const hidden = y > 160 && delta > 0;
        const plate = y > 24;
        return s.hidden === hidden && s.plate === plate ? s : { hidden, plate };
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    // A new page starts with the header in view.
    const first = requestAnimationFrame(() => setState({ hidden: false, plate: window.scrollY > 24 }));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <header className={styles.header} data-hidden={state.hidden && !menuOpen} data-plate={state.plate || menuOpen} data-menu={menuOpen}>
        <div className={styles.bar}>
          <TransitionLink href="/" className={styles.brand} aria-label="GWD Global, home" onClick={() => setMenuOpen(false)}>
            <Logo className={styles.logo} title={null} />
            <span className={styles.fullForm}>Get Work Done</span>
          </TransitionLink>

          <nav className={styles.nav} aria-label="Primary">
            <ul role="list">
              {nav.map((item) => (
                <li key={item.href}>
                  <TransitionLink href={item.href} className={styles.link} aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}>
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <SoundToggle />
            <Button key={action.href} href={action.href} size="sm" className={styles.action}>
              {action.label}
            </Button>
            {/* Below 1024px the links do not fit, so phones and tablets get the menu. */}
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={styles.toggleIcon} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      <Menu open={menuOpen} onClose={closeMenu} pathname={pathname} action={action} nav={nav} />
    </>
  );
}

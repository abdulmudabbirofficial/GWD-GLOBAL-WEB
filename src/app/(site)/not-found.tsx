import type { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { StatePanel } from '@/components/ui/StatePanel';
import { TransitionLink } from '@/features/transition/TransitionLink';
import { NAV } from '@/lib/site';
import styles from './state.module.css';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div data-tone="dark">
      <StatePanel
        code="404"
        title={
          <>
            This page didn&rsquo;t <em>get done.</em>
          </>
        }
        body={<p>The address may be mistyped, or the page has moved. Everything GWD does is one of these five pages away.</p>}
        actions={
          <>
            <Button href="/">Back to home</Button>
            <Button href="/contact" variant="outline">
              Tell us what you were looking for
            </Button>
          </>
        }
        footer={
          <ul role="list" className={styles.links}>
            {NAV.map((n) => (
              <li key={n.href}>
                <TransitionLink href={n.href}>{n.label}</TransitionLink>
              </li>
            ))}
          </ul>
        }
      />
    </div>
  );
}

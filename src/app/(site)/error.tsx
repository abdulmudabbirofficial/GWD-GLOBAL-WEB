'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { StatePanel } from '@/components/ui/StatePanel';
import styles from './state.module.css';

/**
 * Route-level error boundary. Visitors get a calm explanation and a retry;
 * the error itself still reaches the console and server logs, where it can
 * be fixed. The digest ties a visitor's report to the server log entry.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div data-tone="dark">
      <StatePanel
        code="500"
        title={
          <>
            Something didn&rsquo;t <em>load.</em>
          </>
        }
        body={<p>This page hit a problem on our side. It has been logged. Try again, it usually works on the second attempt.</p>}
        actions={
          <>
            <Button onClick={reset} arrow>
              Try again
            </Button>
            <Button href="/" variant="outline">
              Back to home
            </Button>
          </>
        }
        footer={error.digest ? <p className={styles.digest}>Reference · {error.digest}</p> : undefined}
      />
    </div>
  );
}

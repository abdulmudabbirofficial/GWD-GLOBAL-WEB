import { Logo } from '@/components/brand/Logo';
import styles from './PageLoading.module.css';

/** Branded route loading state; invisible for 300ms so fast navigations never flash it. */
export function PageLoading() {
  return (
    <div className={styles.loading} data-page-theme="gwd" role="status" aria-live="polite">
      <div className={styles.loadingMark}>
        <Logo title={null} />
        <span className={styles.bar} aria-hidden="true">
          <i />
        </span>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';

/** Re-mounted on every navigation, so each page settles in once (see .route). */
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return <div className="route">{children}</div>;
}

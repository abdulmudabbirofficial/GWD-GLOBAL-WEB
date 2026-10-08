import type { Metadata } from 'next';
import { AdminApp } from '@/features/admin/AdminApp';

export const metadata: Metadata = { title: 'Site admin', robots: { index: false, follow: false } };

/** The site's admin: registrations, every page's words and images, content, the company record and team accounts. Sign-in required; never indexed. */
export default function AdminPage() {
  return <AdminApp />;
}

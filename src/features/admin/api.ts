/** The admin's one way to talk to the API: JSON in, `{ data }` or a readable error out. */
export type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

export async function api<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    const res = await fetch(path, {
      ...init,
      headers: isForm ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
      cache: 'no-store',
    });
    const body = (await res.json().catch(() => null)) as { data?: T; error?: { message?: string; details?: unknown } } | null;
    if (res.ok && body?.data !== undefined) return { ok: true, data: body.data };
    const details = body?.error?.details;
    const issue = Array.isArray(details) ? (details[0] as { path?: string; message?: string } | undefined) : undefined;
    const message = issue?.message ? `${issue.path ? `${issue.path}: ` : ''}${issue.message}` : (body?.error?.message ?? 'Something went wrong. Please try again.');
    return { ok: false, status: res.status, message };
  } catch {
    return { ok: false, status: 0, message: 'Could not reach the server. Check your connection.' };
  }
}

export interface Viewer {
  user: { id: string; name: string; email: string; role: string };
  permissions: string[];
}

export const can = (v: Viewer, permission: string) => v.permissions.includes(permission);

export interface MediaAsset {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  originalName: string;
}

/** Uploads one image to the media library. */
export async function uploadImage(file: File, alt = '') {
  const form = new FormData();
  form.append('file', file);
  form.append('alt', alt);
  return api<MediaAsset>('/api/v1/admin/media', { method: 'POST', body: form });
}

export const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

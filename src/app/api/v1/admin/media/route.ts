import { AppError } from '@/server/lib/errors';
import { handler } from '@/server/http/handler';
import { audit } from '@/server/modules/audit/service';
import { listMedia, uploadImage } from '@/server/modules/media/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';
import { hashIp } from '@/server/security/request';

export const GET = handler({ auth: 'content:read', rateLimit: RATE_LIMITS.admin }, () => listMedia());

/** multipart/form-data: `file` (image) and optional `alt`. */
export const POST = handler({ auth: 'media:write', rateLimit: RATE_LIMITS.upload, status: 201 }, async ({ request, user, ip }) => {
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) {
    throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Expected multipart/form-data.');
  }
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new AppError('VALIDATION_FAILED', 'Attach an image in the "file" field.');
  const alt = typeof form.get('alt') === 'string' ? (form.get('alt') as string) : '';

  const asset = await uploadImage(file, alt, user!.id);
  await audit({ userId: user!.id, action: 'media.upload', entity: 'media', entityId: asset.id, meta: { size: asset.sizeBytes }, ipHash: hashIp(ip) });
  return asset;
});

import { handler } from '@/server/http/handler';
import { idParam } from '@/server/http/schemas';
import { readMedia } from '@/server/modules/media/service';
import { RATE_LIMITS } from '@/server/security/rate-limit';

/**
 * Serves uploaded media. Content-Type comes from our own sniffing (never the
 * uploader), nosniff stops browsers second-guessing it, and a sandbox CSP
 * neutralises the file if it is ever opened directly.
 */
export const GET = handler<{ id: string }>({ rateLimit: RATE_LIMITS.publicRead, params: idParam }, async ({ params }) => {
  const { row, data } = await readMedia(params.id);
  return new Response(data as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Type': row.mimeType,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': 'inline',
    },
  });
});

import { contentSource } from '@/server/config/env';
import { pingDb } from '@/server/db/client';
import { handler } from '@/server/http/handler';

export const dynamic = 'force-dynamic';

/** Liveness + dependency check for load balancers and uptime monitors. */
export const GET = handler({}, async () => {
  const source = contentSource();
  const database = source === 'database' ? ((await pingDb()) ? 'up' : 'down') : 'not-configured';
  const healthy = database !== 'down';
  return Response.json(
    { data: { status: healthy ? 'ok' : 'degraded', contentSource: source, database, time: new Date().toISOString() } },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
});

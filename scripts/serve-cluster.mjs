/**
 * Production server on every CPU core. `next start` runs on one core; this
 * starts one Next.js worker per core (or WEB_CONCURRENCY), all sharing the
 * same port, and replaces any worker that exits.
 *
 *   npm run build && npm run start:cluster          (PORT, default 3000)
 *
 * Pages are prerendered and cached, so each worker serves them from the
 * cache. Note: an admin save regenerates pages in the worker that handled
 * it; the others pick the change up on their next revalidation (at most five
 * minutes). Behind a CDN, or on Vercel, use the CDN's purge instead.
 */
import cluster from 'node:cluster';
import { createServer } from 'node:http';
import os from 'node:os';
import next from 'next';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const workers = Math.max(1, Number(process.env.WEB_CONCURRENCY || os.availableParallelism()));

if (cluster.isPrimary) {
  console.log(`GWD web: starting ${workers} workers on :${port}`);
  for (let i = 0; i < workers; i++) cluster.fork();
  cluster.on('exit', (worker, code) => {
    console.warn(`worker ${worker.process.pid} exited (${code}); starting a replacement`);
    cluster.fork();
  });
} else {
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();
  createServer((req, res) => handle(req, res)).listen(port, hostname);
}

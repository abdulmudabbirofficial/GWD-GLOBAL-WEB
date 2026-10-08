import { sql as rawSql } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/server/config/env';
import { AppError } from '@/server/lib/errors';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

interface Pool {
  sql: postgres.Sql;
  db: Database;
}

/*
 * One pool per process. Stored on globalThis so Next.js dev-mode module
 * reloading (and separate RSC/route-handler module graphs) never open
 * duplicate pools against the same database.
 */
const globalRef = globalThis as typeof globalThis & { __gwdPool?: Pool };

export function getDb(): Database {
  if (globalRef.__gwdPool) return globalRef.__gwdPool.db;

  const { DATABASE_URL, DATABASE_POOL_MAX } = env();
  if (!DATABASE_URL) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Database is not configured.');
  }

  const sql = postgres(DATABASE_URL, {
    max: DATABASE_POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 5,
    // Unnamed statements keep us compatible with transaction-mode poolers
    // (PgBouncer, Supabase, Neon) and the embedded dev server's multiplexer.
    prepare: false,
    onnotice: () => undefined,
  });

  globalRef.__gwdPool = { sql, db: drizzle(sql, { schema }) };
  return globalRef.__gwdPool.db;
}

export async function closeDb(): Promise<void> {
  if (!globalRef.__gwdPool) return;
  await globalRef.__gwdPool.sql.end({ timeout: 5 });
  globalRef.__gwdPool = undefined;
}

/** Discards the pool without waiting on sockets that may never answer. */
export async function resetDb(): Promise<void> {
  const pool = globalRef.__gwdPool;
  globalRef.__gwdPool = undefined;
  await pool?.sql.end({ timeout: 0 }).catch(() => undefined);
}

export async function pingDb(timeoutMs = 3000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const db = getDb();
    await Promise.race([
      db.execute(rawSql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('ping timeout')), timeoutMs);
      }),
    ]);
    return true;
  } catch {
    void resetDb();
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export { schema };

import { getDb, schema } from '@/server/db/client';
import { logger } from '@/server/lib/logger';

export interface AuditEntry {
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ipHash?: string | null;
}

/**
 * Records who changed what. Failures are logged but never fail the request,
 * the mutation has already succeeded by the time we audit it.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await getDb()
      .insert(schema.auditLogs)
      .values({ ...entry, entityId: entry.entityId ?? null, meta: entry.meta ?? null, ipHash: entry.ipHash ?? null });
  } catch (error) {
    logger.error('audit.write_failed', { error, action: entry.action, entity: entry.entity });
  }
}

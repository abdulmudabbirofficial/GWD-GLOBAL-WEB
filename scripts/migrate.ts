import './_env';
import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { closeDb, getDb } from '@/server/db/client';
import { logger } from '@/server/lib/logger';

async function main() {
  const migrationsFolder = path.join(process.cwd(), 'src/server/db/migrations');
  logger.info('Applying migrations', { migrationsFolder });
  await migrate(getDb(), { migrationsFolder });
  logger.info('Migrations applied');
}

main()
  .catch((error: unknown) => {
    logger.error('Migration failed', { error });
    process.exitCode = 1;
  })
  .finally(closeDb);

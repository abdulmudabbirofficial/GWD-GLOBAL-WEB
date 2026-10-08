import './_env';
import { count, inArray, notInArray } from 'drizzle-orm';
import * as content from '@/content';
import album from '@/content/community-photos.json';
import { env } from '@/server/config/env';
import { closeDb, getDb, schema } from '@/server/db/client';
import { logger } from '@/server/lib/logger';
import { hashPassword } from '@/server/security/password';

/**
 * Idempotent seed. Inserts any snapshot rows that are missing and leaves
 * existing rows untouched, so edits made through the admin survive re-seeding.
 * Pass `--force` to overwrite content with the snapshot, and `--prune` to
 * delete services, products, team members, album photos and other rows that
 * are no longer in it.
 *
 * Once the site is being edited through the admin, do not run --force or
 * --prune against that database: they would replace those edits.
 */
const force = process.argv.includes('--force');
const prune = process.argv.includes('--prune');
const order = (i: number) => i * 10;

async function main() {
  const db = getDb();

  await db.transaction(async (tx) => {
    const upsert = force ? 'update' : 'skip';
    logger.info('Seeding content', { mode: upsert });

    const profile = tx.insert(schema.companyProfile).values({ id: 1, ...content.company });
    await (force ? profile.onConflictDoUpdate({ target: schema.companyProfile.id, set: content.company }) : profile.onConflictDoNothing());

    for (const [i, s] of content.stats.entries()) {
      const q = tx.insert(schema.stats).values({ ...s, sortOrder: order(i) });
      await (force ? q.onConflictDoUpdate({ target: schema.stats.key, set: { ...s, sortOrder: order(i) } }) : q.onConflictDoNothing());
    }

    for (const [i, r] of content.recognitions.entries()) {
      const q = tx.insert(schema.recognitions).values({ ...r, sortOrder: order(i) });
      await (force ? q.onConflictDoUpdate({ target: schema.recognitions.title, set: { ...r, sortOrder: order(i) } }) : q.onConflictDoNothing());
    }

    for (const [i, s] of content.services.entries()) {
      const row = { ...s, sortOrder: order(i) };
      const q = tx.insert(schema.services).values(row);
      await (force ? q.onConflictDoUpdate({ target: schema.services.slug, set: row }) : q.onConflictDoNothing());
    }

    if (prune) {
      const gone = await tx
        .delete(schema.services)
        .where(
          notInArray(
            schema.services.slug,
            content.services.map((s) => s.slug),
          ),
        )
        .returning({ slug: schema.services.slug });
      const goneProducts = await tx
        .delete(schema.products)
        .where(
          notInArray(
            schema.products.slug,
            content.products.map((p) => p.slug),
          ),
        )
        .returning({ slug: schema.products.slug });
      const goneOrgs = await tx
        .delete(schema.organizations)
        .where(
          notInArray(
            schema.organizations.slug,
            content.organizations.map((o) => o.slug),
          ),
        )
        .returning({ slug: schema.organizations.slug });
      const keep = new Set(content.highlights.map((h) => `${h.group}:${h.slug}`));
      const existing = await tx.select({ id: schema.highlights.id, group: schema.highlights.group, slug: schema.highlights.slug }).from(schema.highlights);
      const staleHighlights = existing.filter((h) => !keep.has(`${h.group}:${h.slug}`));
      if (staleHighlights.length)
        await tx.delete(schema.highlights).where(
          inArray(
            schema.highlights.id,
            staleHighlights.map((h) => h.id),
          ),
        );
      const goneTeam = await tx
        .delete(schema.teamMembers)
        .where(notInArray(schema.teamMembers.slug, content.team.map((m) => m.slug)))
        .returning({ slug: schema.teamMembers.slug });
      // Links to a removed entity go with it (ON DELETE CASCADE).
      const goneEntities = await tx
        .delete(schema.ecosystemEntities)
        .where(notInArray(schema.ecosystemEntities.slug, content.ecosystemEntities.map((e) => e.slug)))
        .returning({ slug: schema.ecosystemEntities.slug });
      logger.info('Pruned rows missing from the snapshot', {
        services: gone.map((r) => r.slug),
        products: goneProducts.map((r) => r.slug),
        organizations: goneOrgs.map((r) => r.slug),
        highlights: staleHighlights.map((h) => `${h.group}:${h.slug}`),
        ecosystem: goneEntities.map((r) => r.slug),
        team: goneTeam.map((r) => r.slug),
      });
    }

    for (const [i, p] of content.products.entries()) {
      const row = { ...p, sortOrder: order(i) };
      const q = tx.insert(schema.products).values(row);
      await (force ? q.onConflictDoUpdate({ target: schema.products.slug, set: row }) : q.onConflictDoNothing());
    }

    for (const [i, m] of content.team.entries()) {
      const row = { ...m, sortOrder: order(i) };
      const q = tx.insert(schema.teamMembers).values(row);
      await (force ? q.onConflictDoUpdate({ target: schema.teamMembers.slug, set: row }) : q.onConflictDoNothing());
    }

    for (const [i, o] of content.organizations.entries()) {
      const row = { ...o, sortOrder: order(i) };
      const q = tx.insert(schema.organizations).values(row);
      await (force ? q.onConflictDoUpdate({ target: schema.organizations.slug, set: row }) : q.onConflictDoNothing());
    }

    for (const [i, l] of content.locations.entries()) {
      const row = { ...l, sortOrder: order(i) };
      const q = tx.insert(schema.locations).values(row);
      await (force ? q.onConflictDoUpdate({ target: [schema.locations.city, schema.locations.countryCode], set: row }) : q.onConflictDoNothing());
    }

    for (const [i, h] of content.highlights.entries()) {
      const row = { ...h, sortOrder: order(i) };
      const q = tx.insert(schema.highlights).values(row);
      await (force ? q.onConflictDoUpdate({ target: [schema.highlights.group, schema.highlights.slug], set: row }) : q.onConflictDoNothing());
    }

    for (const [i, e] of content.ecosystemEntities.entries()) {
      const row = { ...e, sortOrder: order(i) };
      const q = tx.insert(schema.ecosystemEntities).values(row);
      await (force ? q.onConflictDoUpdate({ target: schema.ecosystemEntities.slug, set: row }) : q.onConflictDoNothing());
    }

    // The community album. Photos uploaded through the admin are never touched (only --prune removes unknown slugs).
    for (const [i, p] of album.photos.entries()) {
      const row = {
        slug: p.slug,
        url: `/media/community/${p.file}`,
        smallUrl: `/media/community/${p.file.replace('.webp', '-sm.webp')}`,
        width: p.w,
        height: p.h,
        tag: p.tag as 'team' | 'events' | 'workshops',
        alt: p.alt,
        sortOrder: order(i),
      };
      const q = tx.insert(schema.galleryPhotos).values(row);
      await (force ? q.onConflictDoUpdate({ target: schema.galleryPhotos.slug, set: row }) : q.onConflictDoNothing());
    }
    if (prune) {
      const gone = await tx
        .delete(schema.galleryPhotos)
        .where(
          notInArray(
            schema.galleryPhotos.slug,
            album.photos.map((p) => p.slug),
          ),
        )
        .returning({ slug: schema.galleryPhotos.slug });
      if (gone.length) logger.info('Pruned album photos', { slugs: gone.map((g) => g.slug) });
    }

    const entities = await tx.select({ id: schema.ecosystemEntities.id, slug: schema.ecosystemEntities.slug }).from(schema.ecosystemEntities);
    const idBySlug = new Map(entities.map((e) => [e.slug, e.id]));
    const links = content.ecosystemLinks
      .map((l) => ({ fromId: idBySlug.get(l.from), toId: idBySlug.get(l.to) }))
      .filter((l): l is { fromId: string; toId: string } => Boolean(l.fromId && l.toId));
    if (links.length) await tx.insert(schema.ecosystemLinks).values(links).onConflictDoNothing();
  });

  await seedAdmin();
  logger.info('Seed complete');
}

async function seedAdmin() {
  const db = getDb();
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = env();
  const [row] = await db.select({ total: count() }).from(schema.users);
  if ((row?.total ?? 0) > 0) return;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.warn('No users exist and ADMIN_EMAIL / ADMIN_PASSWORD are not set — skipping administrator creation.');
    return;
  }
  await db
    .insert(schema.users)
    .values({ email: ADMIN_EMAIL.toLowerCase(), name: 'Administrator', passwordHash: await hashPassword(ADMIN_PASSWORD), role: 'super_admin' });
  logger.info('Created super administrator', { email: ADMIN_EMAIL.toLowerCase() });
}

main()
  .catch((error: unknown) => {
    logger.error('Seed failed', { error });
    process.exitCode = 1;
  })
  .finally(closeDb);

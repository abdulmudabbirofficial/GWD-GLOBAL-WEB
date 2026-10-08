import { z } from 'zod';

/** Shared query/param schemas for the public API. */
export const slugParam = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,100}$/) });
export const idParam = z.object({ id: z.uuid() });

export const teamQuery = z.object({ group: z.enum(['core', 'club']).optional() });
export const organizationQuery = z.object({ kind: z.enum(['client', 'government', 'ecosystem', 'sports_partner', 'sports_club']).optional() });
export const eventQuery = z.object({
  scope: z.enum(['company', 'club', 'sports']).optional(),
  upcoming: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

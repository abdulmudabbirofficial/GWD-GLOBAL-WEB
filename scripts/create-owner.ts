/**
 * Creates (or, with --reset, re-keys) the site owner's admin account: a
 * super admin who can edit everything and add the rest of the team from the
 * admin's Users panel.
 *
 *   npx tsx scripts/create-owner.ts <email> "<full name>" [--reset]
 *
 * The password is generated here and written only to owner-login.local.txt
 * (git-ignored), never printed. Sign in at /admin, then change it under
 * Account.
 */
import './_env';
import { randomInt } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { closeDb, getDb, schema } from '@/server/db/client';
import { hashPassword } from '@/server/security/password';

const [email, name] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const reset = process.argv.includes('--reset');
const OUT = path.resolve('owner-login.local.txt');

/** 20 characters from four classes, shuffled: comfortably past brute force, still typeable. */
function generatePassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*-_=+?'];
  const chars = sets.map((s) => s[randomInt(s.length)]!);
  const all = sets.join('');
  while (chars.length < 20) chars.push(all[randomInt(all.length)]!);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join('');
}

async function main() {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    console.error('Usage: npx tsx scripts/create-owner.ts <email> "<full name>" [--reset]');
    process.exitCode = 1;
    return;
  }
  const db = getDb();
  const login = email.toLowerCase();
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, login));
  if (existing && !reset) {
    console.log(`An account for ${login} already exists. Run again with --reset to give it a new password.`);
    return;
  }
  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  if (existing) {
    await db.update(schema.users).set({ name, passwordHash, role: 'super_admin', isActive: true, updatedAt: new Date() }).where(eq(schema.users.id, existing.id));
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, existing.id));
  } else {
    await db.insert(schema.users).values({ email: login, name, passwordHash, role: 'super_admin' });
  }
  writeFileSync(
    OUT,
    [
      'GWD Global website: owner login',
      '',
      `Sign in at:  <your site>/admin   (locally: http://localhost:3000/admin)`,
      `Email:       ${login}`,
      `Password:    ${password}`,
      `Role:        Super admin (edits everything, manages team accounts)`,
      '',
      'Change this password after your first sign-in (Admin → Account), then delete this file.',
      'Add the rest of the team from Admin → Users.',
      '',
    ].join('\n'),
    { encoding: 'utf8', mode: 0o600 },
  );
  console.log(`${existing ? 'Reset' : 'Created'} the owner account for ${login}. The password is in ${path.basename(OUT)} (git-ignored).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);

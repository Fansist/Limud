/**
 * Limud v17.2 — OWNER User Seed Script
 *
 * Idempotently provisions the single OWNER account that the OWNER role
 * checks against at sign-in. Run ONCE per environment:
 *
 *     OWNER_EMAIL=Limud-Owner@Limud.co \
 *     OWNER_INITIAL_PASSWORD=...        \
 *     npm run db:seed-owner
 *
 * After seeding you can (and should) remove OWNER_INITIAL_PASSWORD from
 * the deployment environment. The password is then only in the DB
 * (bcrypt-hashed) and the OWNER can change it via the standard reset
 * flow.
 *
 * Re-running this script with a different OWNER_INITIAL_PASSWORD will
 * RESET the OWNER's password — that's intentional, it doubles as an
 * out-of-band reset for the account that controls finances. Print warns
 * loudly when it does so.
 *
 * The role elevation to 'OWNER' at runtime is enforced by env-var match
 * in src/lib/auth.ts (isOwnerEmail()), not by the DB role column. We
 * still set role: 'OWNER' here so admin lists and audit queries reflect
 * the intent, but the env match is the actual gate.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const rawEmail = process.env.OWNER_EMAIL?.trim();
  const password = process.env.OWNER_INITIAL_PASSWORD;

  // v17.2.1: this script also runs in the build step (see package.json
  // "build"). When the env vars aren't set, we treat that as "skip
  // seeding" — NOT as a build failure. Manual runs (`npm run
  // db:seed-owner`) still report the missing vars clearly but with
  // exit code 0, since the operator can re-run after fixing env.
  if (!rawEmail) {
    console.log('[seed-owner] OWNER_EMAIL is not set — skipping OWNER seed.');
    console.log('  To seed an OWNER user, set BOTH OWNER_EMAIL and OWNER_INITIAL_PASSWORD');
    console.log('  in the environment, then re-run (or trigger a redeploy).');
    process.exit(0);
  }

  if (!password) {
    console.log('[seed-owner] OWNER_INITIAL_PASSWORD is not set — skipping OWNER seed.');
    console.log('  OWNER_EMAIL is set to: ' + rawEmail);
    console.log('  To complete the seed: set OWNER_INITIAL_PASSWORD and redeploy.');
    console.log('  After the seed succeeds, REMOVE OWNER_INITIAL_PASSWORD from env.');
    process.exit(0);
  }

  if (password.length < 8) {
    // Length check IS a fatal validation — never let a too-short
    // password silently land in production.
    console.error('[seed-owner] OWNER_INITIAL_PASSWORD must be at least 8 characters. Aborting.');
    process.exit(1);
  }

  // Email matching is case-insensitive everywhere else; normalize here too.
  const email = rawEmail.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Update password + role; leave everything else (name, createdAt, etc.) intact.
    const updated = await prisma.user.update({
      where: { email },
      data: {
        password: passwordHash,
        role: 'OWNER',
        emailVerified: existing.emailVerified ?? new Date(),
      },
      select: { id: true, email: true, role: true, name: true },
    });
    console.log('[seed-owner] OWNER user already existed — password and role updated.');
    console.log('  id:    ', updated.id);
    console.log('  email: ', updated.email);
    console.log('  role:  ', updated.role);
    console.log('  name:  ', updated.name);
    console.warn('[seed-owner] WARNING: existing OWNER password has been REPLACED.');
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: 'Limud Owner',
        role: 'OWNER',
        accountType: 'INDIVIDUAL',
        emailVerified: new Date(),
      },
      select: { id: true, email: true, role: true },
    });
    console.log('[seed-owner] OWNER user created.');
    console.log('  id:    ', created.id);
    console.log('  email: ', created.email);
    console.log('  role:  ', created.role);
  }

  console.log('');
  console.log('[seed-owner] NEXT STEPS:');
  console.log('  1. Remove OWNER_INITIAL_PASSWORD from the deployment environment.');
  console.log('  2. Confirm OWNER_EMAIL is set in the deployment environment.');
  console.log('  3. (Optional) Set OWNER_2FA_EMAIL to a different inbox for OTP codes.');
  console.log('  4. Sign in at /login with the email + password above.');
  console.log('     A 6-digit code will be emailed to OWNER_2FA_EMAIL (or OWNER_EMAIL).');
}

main()
  .catch((err) => {
    console.error('[seed-owner] Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

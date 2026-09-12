// import { createApp } from './app';
// import { env } from './config/env';
// import prisma from './config/prisma';

// const app = createApp();

// const server = app.listen(env.port, () => {
//   // eslint-disable-next-line no-console
//   console.log(`Restaurant platform API running on port ${env.port} [${env.nodeEnv}]`);
// });

// async function shutdown(signal: string) {
//   // eslint-disable-next-line no-console
//   console.log(`${signal} received, shutting down gracefully...`);
//   server.close(async () => {
//     await prisma.$disconnect();
//     process.exit(0);
//   });
// }

// process.on('SIGINT', () => shutdown('SIGINT'));
// process.on('SIGTERM', () => shutdown('SIGTERM'));
import { createApp } from './app';
import { env } from './config/env';
import prisma from './config/prisma';
import { hashPassword } from './utils/password';
import { Role } from '@prisma/client';

/**
 * Treats an unset OR blank/whitespace-only env var as "not provided" and
 * falls back to the default. Using `??` alone is NOT enough here: an empty
 * line in .env (e.g. `SEED_ADMIN_PASSWORD=`) produces an empty string, which
 * `??` treats as a valid value and happily hashes as the password — locking
 * everyone out with a blank-password account. This is exactly what caused
 * "Invalid email or password" even with correct-looking typed credentials.
 */
function envOrDefault(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * SELF-HEALING ADMIN BOOTSTRAP
 * ----------------------------
 * If the users table is empty, create a default SUPER_ADMIN automatically so
 * the admin panel is never locked out because a manual seed step was missed.
 * Does nothing if any user already exists, so it never overwrites real accounts.
 */
async function ensureDefaultAdmin() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) return;

    const email = envOrDefault(process.env.SEED_ADMIN_EMAIL, 'admin@spicehaven.example').toLowerCase();
    const password = envOrDefault(process.env.SEED_ADMIN_PASSWORD, 'ChangeMe123!');

    await prisma.user.create({
      data: {
        name: 'Restaurant Owner',
        email,
        passwordHash: await hashPassword(password),
        role: Role.SUPER_ADMIN,
      },
    });

    // eslint-disable-next-line no-console
    console.log('----------------------------------------------------------');
    console.log('No admin users found — created a default SUPER_ADMIN:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('Change this password immediately after logging in.');
    console.log('----------------------------------------------------------');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('----------------------------------------------------------');
    console.error('Could not verify/create the default admin user.');
    console.error('This usually means database migrations have not been run yet.');
    console.error('Run: npx prisma migrate deploy   (then restart the server)');
    console.error('Underlying error:', (err as Error)?.message ?? err);
    console.error('----------------------------------------------------------');
  }
}

async function start() {
  await ensureDefaultAdmin();

  const app = createApp();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Restaurant platform API running on port ${env.port} [${env.nodeEnv}]`);
  });

  async function shutdown(signal: string) {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
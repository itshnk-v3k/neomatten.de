// NEOMATTEN database seed.
// Idempotently creates the default admin account. Run with `npx prisma db seed`
// (configured via the "prisma.seed" key in package.json).

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@neomatten.de';
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'admin12345';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'NEOMATTEN',
      isAdmin: true,
    },
  });

  console.log(`✅ Admin user ready: ${admin.email} (isAdmin=${admin.isAdmin})`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

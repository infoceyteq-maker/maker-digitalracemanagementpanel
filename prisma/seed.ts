import { runEnterpriseSeed } from '../scripts/seed';

runEnterpriseSeed()
  .then(() => {
    console.log('✅ Prisma seed complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Prisma seed error:', err);
    process.exit(1);
  });

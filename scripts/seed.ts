import 'dotenv/config';
import prisma from "../src/lib/prisma.js"
import bcrypt from 'bcryptjs';



async function main() {
  const username = process.env.FIRST_TEACHER_USERNAME || 'admin';
  const password = process.env.FIRST_TEACHER_PASSWORD || 'changeme';
  const name = process.env.FIRST_TEACHER_NAME || 'Administrator';

  const existing = await prisma.teacher.findUnique({ where: { username } });

  if (existing) {
    console.log(`ℹ️  Teacher "${username}" already exists, skipping`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.teacher.create({
    data: { username, passwordHash, name },
  });

  console.log(`✅ Teacher account created: ${username}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
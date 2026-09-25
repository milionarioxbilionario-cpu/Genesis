require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Adding cancel_pin_hash column if not exists...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "cancel_pin_hash" TEXT;');
    console.log('Column ensured.');
  } catch (err) {
    console.error('Failed to add column:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating database schema for 3 new breakthrough features...');
  
  // 1. Add chaosReport to test_runs
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "test_runs" ADD COLUMN IF NOT EXISTS "chaosReport" JSONB;
  `);

  // 2. Create pull_request_fixes table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "pull_request_fixes" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "prUrl" TEXT,
      "prNumber" INTEGER,
      "branchName" TEXT NOT NULL,
      "repoName" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT,
      "patchDiff" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'opened',
      "defectId" TEXT,
      "runId" TEXT NOT NULL REFERENCES "test_runs"("id") ON DELETE CASCADE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Create time_travel_steps table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "time_travel_steps" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "stepIndex" INTEGER NOT NULL,
      "action" TEXT NOT NULL,
      "selector" TEXT,
      "pageUrl" TEXT NOT NULL,
      "screenshotUrl" TEXT,
      "domSnapshot" TEXT,
      "consoleLogs" JSONB,
      "networkSummary" JSONB,
      "latencyMs" INTEGER,
      "runId" TEXT NOT NULL REFERENCES "test_runs"("id") ON DELETE CASCADE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database migration completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

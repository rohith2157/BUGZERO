import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const runs = await prisma.testRun.findMany({
    select: {
      id: true,
      url: true,
      createdAt: true,
      status: true,
      overallScore: true,
      totalPages: true,
      defectCount: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  console.log(JSON.stringify(runs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

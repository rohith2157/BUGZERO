import prisma from './src/db.js';

async function main() {
  const runs = await prisma.testRun.findMany({
    select: {
      id: true,
      url: true,
      createdAt: true,
      status: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log('--- TEST RUNS IN DATABASE ---');
  for (const r of runs) {
    console.log(`ID: ${r.id} | URL: ${r.url} | Status: ${r.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

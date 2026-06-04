import prisma from './src/db.js';

async function main() {
  const run1 = await prisma.testRun.findUnique({
    where: { id: '394efa29-7849-4c81-81e8-10b8df52c453' },
    include: { pages: true, defects: true }
  });

  const run2 = await prisma.testRun.findUnique({
    where: { id: '982d1deb-d10b-409c-937c-71af0395c28d' },
    include: { pages: true, defects: true }
  });

  console.log('=== RUN 1 (394efa29) ===');
  if (run1) {
    console.log(`URL: ${run1.url}`);
    console.log(`Status: ${run1.status}`);
    console.log(`Page count: ${run1.pages.length}`);
    console.log(`Defect count: ${run1.defects.length}`);
    console.log('Pages discovered:');
    run1.pages.forEach(p => console.log(`  - ${p.url} (Score: ${p.hygieneScore})`));
    console.log('Defects:');
    run1.defects.forEach(d => console.log(`  - [${d.severity}] ${d.message}`));
  } else {
    console.log('Run 1 not found');
  }

  console.log('\n=== RUN 2 (982d1deb) ===');
  if (run2) {
    console.log(`URL: ${run2.url}`);
    console.log(`Status: ${run2.status}`);
    console.log(`Page count: ${run2.pages.length}`);
    console.log(`Defect count: ${run2.defects.length}`);
    console.log('Pages discovered:');
    run2.pages.forEach(p => console.log(`  - ${p.url} (Score: ${p.hygieneScore})`));
    console.log('Defects:');
    run2.defects.forEach(d => console.log(`  - [${d.severity}] ${d.message}`));
  } else {
    console.log('Run 2 not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

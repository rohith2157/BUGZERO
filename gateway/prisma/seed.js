import prisma from '../src/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'AutonomousQA',
      plan: 'growth',
      apiQuota: 200,
    },
  });

  // Create owner user (password: "password123")
  const hashedPassword = await bcrypt.hash('password123', 12);
  const user = await prisma.user.create({
    data: {
      email: 'rohith@autonomousqa.io',
      password: hashedPassword,
      name: 'Rohith Kumar',
      role: 'owner',
      orgId: org.id,
    },
  });

  // Create team members
  const teamMembers = [
    { email: 'priya@autonomousqa.io', name: 'Priya Sharma', role: 'admin' },
    { email: 'alex@autonomousqa.io', name: 'Alex Chen', role: 'developer' },
    { email: 'sarah@autonomousqa.io', name: 'Sarah Wilson', role: 'qa-lead' },
  ];

  for (const member of teamMembers) {
    await prisma.user.create({
      data: {
        ...member,
        password: hashedPassword,
        orgId: org.id,
      },
    });
  }

  // Create auth playbooks
  const playbooks = [
    { name: 'Google Workspace SSO', domain: 'workspace.google.com', authType: 'google-sso' },
    { name: 'GitHub OAuth', domain: 'github.com', authType: 'oauth2' },
    { name: 'Form Login + TOTP', domain: 'internal.app.com', authType: 'form-totp' },
    { name: 'Basic Form Login', domain: 'staging.example.com', authType: 'form' },
    { name: 'Microsoft SSO', domain: 'outlook.office.com', authType: 'microsoft-sso' },
  ];

  for (const pb of playbooks) {
    await prisma.authPlaybook.create({
      data: { ...pb, orgId: org.id, successRate: Math.random() * 20 + 80, status: 'active' },
    });
  }

  // Create sample test runs
  const testUrls = [
    { url: 'https://app.stripe.com', score: 87, defects: 12, pages: 45, status: 'completed', duration: '18m 32s' },
    { url: 'https://dashboard.vercel.app', score: 92, defects: 5, pages: 32, status: 'completed', duration: '12m 14s' },
    { url: 'https://cloud.google.com', score: null, defects: 8, pages: 67, status: 'running', duration: null },
    { url: 'https://github.com/settings', score: 74, defects: 28, pages: 18, status: 'completed', duration: '8m 55s' },
    { url: 'https://notion.so/workspace', score: null, defects: 0, pages: 3, status: 'failed', duration: '2m 10s' },
  ];

  for (const t of testUrls) {
    await prisma.testRun.create({
      data: {
        url: t.url,
        status: t.status,
        overallScore: t.score,
        defectCount: t.defects,
        totalPages: t.pages,
        testedPages: t.status === 'completed' ? t.pages : Math.floor(t.pages * 0.7),
        duration: t.duration,
        userId: user.id,
        orgId: org.id,
        completedAt: t.status === 'completed' ? new Date() : null,
      },
    });
  }

  // Create API keys
  const keys = [
    { name: 'CI/CD Pipeline', key: 'aq_ci_' + 'a'.repeat(58), status: 'active' },
    { name: 'Development', key: 'aq_dev_' + 'b'.repeat(57), status: 'active' },
    { name: 'Staging Hook', key: 'aq_stg_' + 'c'.repeat(57), status: 'revoked' },
  ];

  for (const k of keys) {
    await prisma.apiKey.create({
      data: { ...k, userId: user.id },
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   User: ${user.email} / password123`);
  console.log(`   Org: ${org.name} (${org.plan})`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

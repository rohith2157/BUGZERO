// AutonomousQA — Realistic Mock Data

export const kpiData = {
  totalRuns: 247,
  avgHygieneScore: 82.4,
  totalDefects: 1832,
  complianceScore: 91.2,
  runsChange: +12.3,
  hygieneChange: +3.7,
  defectsChange: -8.1,
  complianceChange: +2.4,
};

export const hygieneHistory = [
  { date: 'Jan 1', score: 71 }, { date: 'Jan 5', score: 68 },
  { date: 'Jan 10', score: 72 }, { date: 'Jan 15', score: 75 },
  { date: 'Jan 20', score: 73 }, { date: 'Jan 25', score: 78 },
  { date: 'Feb 1', score: 76 }, { date: 'Feb 5', score: 79 },
  { date: 'Feb 10', score: 82 }, { date: 'Feb 15', score: 80 },
  { date: 'Feb 20', score: 85 }, { date: 'Feb 25', score: 82 },
];

export const recentRuns = [
  { id: 1, url: 'https://app.stripe.com', status: 'completed', score: 87, defects: 12, pages: 45, duration: '18m 32s', date: '2026-02-25', pagesDiscovered: 45 },
  { id: 2, url: 'https://dashboard.vercel.app', status: 'completed', score: 92, defects: 5, pages: 32, duration: '12m 14s', date: '2026-02-24', pagesDiscovered: 32 },
  { id: 3, url: 'https://cloud.google.com', status: 'running', score: null, defects: 8, pages: 67, duration: '25m 41s', date: '2026-02-24', pagesDiscovered: 67 },
  { id: 4, url: 'https://github.com/settings', status: 'completed', score: 74, defects: 28, pages: 18, duration: '8m 55s', date: '2026-02-23', pagesDiscovered: 18 },
  { id: 5, url: 'https://notion.so/workspace', status: 'failed', score: null, defects: 0, pages: 3, duration: '2m 10s', date: '2026-02-23', pagesDiscovered: 3 },
  { id: 6, url: 'https://figma.com/files', status: 'completed', score: 89, defects: 7, pages: 24, duration: '14m 20s', date: '2026-02-22', pagesDiscovered: 24 },
  { id: 7, url: 'https://linear.app/team', status: 'completed', score: 95, defects: 2, pages: 15, duration: '7m 42s', date: '2026-02-21', pagesDiscovered: 15 },
  { id: 8, url: 'https://slack.com/admin', status: 'completed', score: 68, defects: 35, pages: 52, duration: '30m 18s', date: '2026-02-20', pagesDiscovered: 52 },
];

export const liveTestData = {
  id: 3,
  url: 'https://cloud.google.com',
  status: 'running',
  progress: 72,
  totalPages: 67,
  testedPages: 48,
  defectsFound: 8,
  startedAt: '2026-02-24T10:15:00Z',
  currentPage: 'https://cloud.google.com/compute/instances',
  pagesDiscovered: [
    { url: '/dashboard', type: 'Dashboard', status: 'tested', score: 88 },
    { url: '/compute/instances', type: 'Data Table', status: 'testing', score: null },
    { url: '/storage/buckets', type: 'Data Table', status: 'queued', score: null },
    { url: '/iam/roles', type: 'Settings', status: 'queued', score: null },
    { url: '/billing', type: 'Dashboard', status: 'tested', score: 76 },
    { url: '/networking/vpc', type: 'Form', status: 'tested', score: 91 },
    { url: '/kubernetes/clusters', type: 'Data Table', status: 'tested', score: 83 },
    { url: '/functions', type: 'Dashboard', status: 'queued', score: null },
    { url: '/monitoring', type: 'Dashboard', status: 'tested', score: 79 },
    { url: '/logging', type: 'Data Table', status: 'tested', score: 85 },
  ],
  liveDefects: [
    { id: 'd1', page: '/billing', type: 'Accessibility', severity: 'major', message: 'Missing alt text on 3 billing chart images', time: '10:22:14' },
    { id: 'd2', page: '/dashboard', type: 'Performance', severity: 'minor', message: 'LCP exceeds 2.5s threshold (3.1s)', time: '10:18:42' },
    { id: 'd3', page: '/compute/instances', type: 'Functional', severity: 'critical', message: 'Delete instance button unresponsive after 3 clicks', time: '10:25:01' },
    { id: 'd4', page: '/networking/vpc', type: 'SEO', severity: 'minor', message: 'Missing meta description tag', time: '10:20:33' },
    { id: 'd5', page: '/billing', type: 'WCAG', severity: 'major', message: 'Color contrast ratio 2.8:1 on billing summary text', time: '10:23:11' },
  ],
};

export const reportData = {
  runId: 1,
  url: 'https://app.stripe.com',
  overallScore: 87,
  totalDefects: 12,
  totalPages: 45,
  duration: '18m 32s',
  date: '2026-02-25',
  scoreBreakdown: {
    functional: 92,
    accessibility: 78,
    performance: 89,
    seo: 85,
    compliance: 91,
  },
  defects: [
    { id: 1, page: '/payments', type: 'Accessibility', severity: 'critical', message: 'Form inputs missing labels — 5 instances on payment form', screenshot: null, fix: 'Add <label> elements with for attributes to each input field' },
    { id: 2, page: '/customers', type: 'Performance', severity: 'major', message: 'Customer table loads 2000 rows without virtualization — LCP 4.2s', screenshot: null, fix: 'Implement virtual scrolling with react-window or similar' },
    { id: 3, page: '/invoices', type: 'Functional', severity: 'major', message: 'PDF export button returns 500 error for invoices > 100 items', screenshot: null, fix: 'Implement server-side pagination for PDF generation' },
    { id: 4, page: '/settings', type: 'WCAG', severity: 'minor', message: 'Color contrast 3.2:1 on disabled input placeholder text', screenshot: null, fix: 'Change placeholder color from #999 to #666 for 4.5:1 ratio' },
    { id: 5, page: '/dashboard', type: 'SEO', severity: 'minor', message: 'Duplicate H1 tags — found 3 H1 elements on dashboard', screenshot: null, fix: 'Use single H1 for page title, change others to H2' },
    { id: 6, page: '/billing', type: 'Accessibility', severity: 'major', message: 'Tab navigation skips 4 interactive elements in billing section', screenshot: null, fix: 'Add tabindex and proper focus management to interactive cards' },
    { id: 7, page: '/webhooks', type: 'Performance', severity: 'minor', message: 'Webhook logs page loads 15 JS bundles — total 2.8MB', screenshot: null, fix: 'Implement code splitting and lazy loading for webhook components' },
    { id: 8, page: '/connect', type: 'Functional', severity: 'critical', message: 'OAuth redirect loop when connecting Stripe Connect account', screenshot: null, fix: 'Fix redirect_uri mismatch in OAuth flow configuration' },
  ],
  heatmapData: [
    { page: '/dashboard', score: 92, defects: 1, risk: 'low' },
    { page: '/payments', score: 68, defects: 3, risk: 'high' },
    { page: '/customers', score: 74, defects: 2, risk: 'high' },
    { page: '/invoices', score: 81, defects: 1, risk: 'medium' },
    { page: '/billing', score: 71, defects: 2, risk: 'high' },
    { page: '/settings', score: 89, defects: 1, risk: 'low' },
    { page: '/webhooks', score: 85, defects: 1, risk: 'medium' },
    { page: '/connect', score: 62, defects: 2, risk: 'high' },
    { page: '/products', score: 94, defects: 0, risk: 'low' },
    { page: '/reports', score: 88, defects: 1, risk: 'low' },
    { page: '/disputes', score: 79, defects: 1, risk: 'medium' },
    { page: '/terminal', score: 91, defects: 0, risk: 'low' },
  ],
};

export const complianceData = {
  overallScore: 91,
  wcagScore: 88,
  gdprScore: 94,
  violations: [
    { id: 1, standard: 'WCAG', criterion: '1.1.1 Non-text Content', severity: 'critical', page: '/payments', description: '5 images missing alt text on payment form', remediation: 'Add descriptive alt attributes to all <img> elements', count: 5 },
    { id: 2, standard: 'WCAG', criterion: '1.4.3 Contrast (Minimum)', severity: 'major', page: '/settings', description: 'Placeholder text contrast ratio 3.2:1', remediation: 'Increase contrast to meet 4.5:1 minimum ratio', count: 8 },
    { id: 3, standard: 'WCAG', criterion: '2.1.1 Keyboard', severity: 'major', page: '/billing', description: '4 interactive elements not keyboard accessible', remediation: 'Add tabindex and keyboard event handlers', count: 4 },
    { id: 4, standard: 'WCAG', criterion: '2.4.7 Focus Visible', severity: 'minor', page: '/dashboard', description: 'Focus rings not visible on nav links', remediation: 'Add :focus-visible styles with visible outline', count: 12 },
    { id: 5, standard: 'GDPR', criterion: 'Cookie Consent', severity: 'major', page: '/', description: 'Analytics cookies set before user consent', remediation: 'Defer analytics tracking until consent is given', count: 1 },
    { id: 6, standard: 'GDPR', criterion: 'Data Exposure', severity: 'critical', page: '/customers', description: 'Email addresses visible in page source as plaintext', remediation: 'Mask or encrypt PII in client-side rendered content', count: 1 },
    { id: 7, standard: 'WCAG', criterion: '4.1.2 Name, Role, Value', severity: 'minor', page: '/invoices', description: 'Custom dropdown missing ARIA role', remediation: 'Add role="listbox" and aria-expanded attributes', count: 3 },
    { id: 8, standard: 'GDPR', criterion: 'Privacy Policy', severity: 'minor', page: '/', description: 'Privacy policy link not present on signup form', remediation: 'Add privacy policy link adjacent to form submit button', count: 1 },
  ],
};

export const performanceData = {
  overallScore: 89,
  webVitals: {
    lcp: { value: 1.8, unit: 's', status: 'good', threshold: 2.5 },
    fid: { value: 45, unit: 'ms', status: 'good', threshold: 100 },
    cls: { value: 0.08, unit: '', status: 'good', threshold: 0.1 },
    ttfb: { value: 320, unit: 'ms', status: 'needs-improvement', threshold: 200 },
  },
  history: [
    { date: 'Feb 1', lcp: 2.4, fid: 80, cls: 0.12, ttfb: 450 },
    { date: 'Feb 5', lcp: 2.1, fid: 65, cls: 0.10, ttfb: 400 },
    { date: 'Feb 10', lcp: 1.9, fid: 55, cls: 0.09, ttfb: 380 },
    { date: 'Feb 15', lcp: 2.0, fid: 50, cls: 0.08, ttfb: 350 },
    { date: 'Feb 20', lcp: 1.8, fid: 45, cls: 0.08, ttfb: 320 },
    { date: 'Feb 25', lcp: 1.8, fid: 45, cls: 0.08, ttfb: 320 },
  ],
  waterfall: [
    { resource: 'document', type: 'HTML', size: '14 KB', duration: 120, start: 0, color: '#D4A853' },
    { resource: 'main.css', type: 'CSS', size: '48 KB', duration: 85, start: 120, color: '#8B5CF6' },
    { resource: 'vendor.js', type: 'JS', size: '245 KB', duration: 340, start: 120, color: '#F59E0B' },
    { resource: 'app.js', type: 'JS', size: '180 KB', duration: 280, start: 120, color: '#F59E0B' },
    { resource: 'fonts.woff2', type: 'Font', size: '32 KB', duration: 95, start: 205, color: '#06B6D4' },
    { resource: 'logo.svg', type: 'Image', size: '4 KB', duration: 45, start: 205, color: '#10B981' },
    { resource: 'hero.webp', type: 'Image', size: '120 KB', duration: 200, start: 300, color: '#10B981' },
    { resource: 'analytics.js', type: 'JS', size: '28 KB', duration: 150, start: 460, color: '#F59E0B' },
  ],
  regressions: [
    { metric: 'TTFB', page: '/payments', before: 180, after: 320, change: '+77%', severity: 'warning' },
    { metric: 'Bundle Size', page: '/webhooks', before: '1.2 MB', after: '2.8 MB', change: '+133%', severity: 'critical' },
  ],
};

export const playbooks = [
  { id: 1, name: 'Google SSO Login', domain: 'app.stripe.com', type: 'Google SSO', lastUsed: '2026-02-25', status: 'active', successRate: '98%' },
  { id: 2, name: 'GitHub OAuth', domain: 'vercel.app', type: 'GitHub OAuth', lastUsed: '2026-02-24', status: 'active', successRate: '95%' },
  { id: 3, name: 'Form Login + MFA', domain: 'cloud.google.com', type: 'Form + TOTP', lastUsed: '2026-02-24', status: 'active', successRate: '92%' },
  { id: 4, name: 'Basic Form Auth', domain: 'internal-app.com', type: 'Form', lastUsed: '2026-02-20', status: 'inactive', successRate: '100%' },
  { id: 5, name: 'Microsoft SSO', domain: 'office365.com', type: 'Microsoft SSO', lastUsed: '2026-02-18', status: 'active', successRate: '88%' },
];

export const teamMembers = [
  { id: 1, name: 'Rohith Kumar', email: 'rohith@autonomousqa.io', role: 'Owner', avatar: null, lastActive: '2 min ago' },
  { id: 2, name: 'Priya Sharma', email: 'priya@autonomousqa.io', role: 'Admin', avatar: null, lastActive: '1 hour ago' },
  { id: 3, name: 'Alex Chen', email: 'alex@autonomousqa.io', role: 'Developer', avatar: null, lastActive: '3 hours ago' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@autonomousqa.io', role: 'QA Lead', avatar: null, lastActive: '1 day ago' },
];

export const apiKeys = [
  { id: 1, name: 'CI/CD Pipeline', key: 'aq_live_sk_****7f3k', created: '2026-01-15', lastUsed: '2 hours ago', status: 'active' },
  { id: 2, name: 'Development', key: 'aq_test_sk_****p2mn', created: '2026-02-01', lastUsed: '5 days ago', status: 'active' },
  { id: 3, name: 'Staging Hook', key: 'aq_live_sk_****x9bw', created: '2026-02-10', lastUsed: 'Never', status: 'revoked' },
];

export const defectTypeColors = {
  Functional: '#D4A853',
  Accessibility: '#8B5CF6',
  Performance: '#F59E0B',
  SEO: '#06B6D4',
  WCAG: '#F97316',
  GDPR: '#EF4444',
  Visual: '#10B981',
};

export const severityConfig = {
  critical: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', label: 'Critical' },
  major: { color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)', label: 'Major' },
  minor: { color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', label: 'Minor' },
  warning: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', label: 'Warning' },
};

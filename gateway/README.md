<div align="center">
  <h1>⚙️ API Gateway — Express.js Backend</h1>
  <p><strong>REST API · Prisma ORM · Socket.io · JWT Auth</strong></p>
</div>

---

## What This Does

The Gateway is the central hub — it handles authentication, stores test data in PostgreSQL, relays real-time progress via WebSocket, and serves the REST API for the React frontend and Python AI Core.

## Database Models (13 Prisma Models)

| Model | Purpose |
|:---|:---|
| `User` | Authentication & profile |
| `Organization` | Team management |
| `TestRun` | Test execution records |
| `Page` | Discovered pages with hygiene/vision scores |
| `Defect` | Detected bugs with severity + confidence |
| `ComplianceResult` | WCAG/GDPR violations |
| `PerformanceMetric` | Core Web Vitals per page |
| `HealingEvent` | Self-healing audit trail |
| `ScreenshotBaseline` | Visual regression baselines |
| `AuthPlaybook` | Saved authentication strategies |
| `ApiKey` | API key management |
| `NotificationPreference` | Notification settings |
| `UserActivity` | Activity tracking |

## Routes

| File | Mount | Description |
|:---|:---|:---|
| `routes/auth.js` | `/api/auth` | Register, login, profile, JWT refresh |
| `routes/tests.js` | `/api/tests` | Test CRUD, progress updates, healing events, defect history |
| `routes/baselines.js` | `/api/baselines` | Visual regression baseline CRUD |
| `routes/playbooks.js` | `/api/playbooks` | Test playbook CRUD |
| `routes/settings.js` | `/api/settings` | User profile, team, API keys |

## WebSocket Events

| Event | Description |
|:---|:---|
| `page:discovered` | New page found during crawl |
| `page:complete` | Page testing finished |
| `defect:found` | Bug detected in real time |
| `heal:success` | Self-healing selector repair |
| `test:complete` | Full test run finished |

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
node prisma/seed.js       # Seed demo user
npm run dev               # Starts on :3000
```

## Environment Variables

| Variable | Required | Description |
|:---|:---|:---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `FASTAPI_URL` | No | AI Core URL (default: `http://localhost:8000`) |
| `PORT` | No | Server port (default: `3000`) |

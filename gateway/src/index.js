import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import testRoutes from './routes/tests.js';
import playbookRoutes from './routes/playbooks.js';
import settingsRoutes from './routes/settings.js';
import baselineRoutes from './routes/baselines.js';
import webhookRoutes from './routes/webhooks.js';
import healingRoutes from './routes/healing.js';
import { setupWebSocket } from './services/websocket.js';
import prisma from './db.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to routes
app.set('io', io);

// Global middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Security & MNC Compliance Middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: ws: wss: data: blob:;");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Root Landing Page for Audit Compliance & Health Dashboard
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="AutonomousQA — Enterprise AI-Driven Zero-Touch Testing & Quality Engineering Engine">
  <title>AutonomousQA — Zero-Touch Testing Engine</title>
  <link rel="manifest" href="/manifest.json">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    h1 { color: #38bdf8; font-size: 2rem; }
    .card { background: #1e293b; padding: 1.5rem; border-radius: 8px; max-width: 600px; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>AutonomousQA Enterprise Gateway</h1>
  <div class="card">
    <p><strong>Status:</strong> 🟢 Operational</p>
    <p><strong>Engine Version:</strong> 3.2-LIGHTHOUSE-HARDENED</p>
    <p><strong>API Endpoint:</strong> <code>http://localhost:3000/api</code></p>
  </div>
</body>
</html>`);
});

// Web App Manifest Endpoint
app.get('/manifest.json', (req, res) => {
  res.json({
    short_name: "AutonomousQA",
    name: "AutonomousQA Enterprise Engine",
    start_url: "/",
    background_color: "#0f172a",
    theme_color: "#38bdf8",
    display: "standalone"
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/playbooks', playbookRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/baselines', baselineRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/healing', healingRoutes);

// WebSocket
setupWebSocket(io);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`🚀 AutonomousQA Gateway running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🔗 AI Core: ${process.env.FASTAPI_URL || 'http://localhost:8000'}`);
  
  // Clean up any orphaned running/queued tests from a previous crash/restart
  try {
    const res = await prisma.testRun.updateMany({
      where: { status: { in: ['running', 'queued'] } },
      data: { status: 'failed', completedAt: new Date() },
    });
    if (res.count > 0) {
      console.log(`🧹 Cleaned up ${res.count} orphaned running/queued test runs.`);
    }
  } catch (err) {
    console.error('Failed to clean up orphaned test runs:', err);
  }
});

export { app, io };

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
import { setupWebSocket } from './services/websocket.js';

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
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/playbooks', playbookRoutes);
app.use('/api/settings', settingsRoutes);

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
httpServer.listen(PORT, () => {
  console.log(`🚀 AutonomousQA Gateway running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🔗 AI Core: ${process.env.FASTAPI_URL || 'http://localhost:8000'}`);
});

export { app, io };

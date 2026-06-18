import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate, registerRules, loginRules } from '../middleware/validate.js';
import { emitActivityEvent } from '../services/websocket.js';
import { verifyFirebaseToken } from '../services/firebase.js';

const router = Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, orgId: user.orgId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', registerRules, validate, async (req, res) => {
  try {
    const { password, name, orgName } = req.body;
    const email = req.body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create org if name provided
    let orgId = null;
    if (orgName) {
      const org = await prisma.organization.create({
        data: { name: orgName, plan: 'free', apiQuota: 5 },
      });
      orgId = org.id;
    }

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, orgId, role: orgId ? 'owner' : 'developer' },
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', loginRules, validate, async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'login'
      }
    });

    if (req.app.get('io')) {
      emitActivityEvent(req.app.get('io'), 'activity:login', { userId: user.id, timestamp: new Date() });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, avatar: true, role: true, orgId: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// DELETE /api/auth/logout
router.delete('/logout', authenticate, (req, res) => {
  // Client should discard the token
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/firebase — Exchange Firebase ID token for gateway JWT
router.post('/firebase', async (req, res) => {
  try {
    const { idToken, name, photo, githubAccessToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    // Verify the Firebase ID token
    let decoded;
    try {
      decoded = await verifyFirebaseToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid Firebase token' });
    }

    const email = decoded.email;
    if (!email) {
      return res.status(400).json({ error: 'Firebase token missing email claim' });
    }

    const provider = decoded.firebase?.sign_in_provider || 'firebase';
    const displayName = name || decoded.name || email.split('@')[0];
    const avatarUrl = photo || decoded.picture || null;

    // Upsert user: find by firebaseUid or email, create if new
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: decoded.uid },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (user) {
      // Update existing user with Firebase info
      const updateData = {
        firebaseUid: decoded.uid,
        provider,
        name: displayName,
      };
      if (avatarUrl) updateData.avatar = avatarUrl;
      if (githubAccessToken) updateData.githubAccessToken = githubAccessToken;

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      // Create new user (no org for OAuth signups initially)
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: displayName,
          avatar: avatarUrl,
          firebaseUid: decoded.uid,
          provider,
          role: 'owner',
          githubAccessToken: githubAccessToken || null,
        },
      });
    }

    // Log activity
    await prisma.userActivity.create({
      data: { userId: user.id, action: 'login', metadata: { provider } },
    });

    if (req.app.get('io')) {
      emitActivityEvent(req.app.get('io'), 'activity:login', { userId: user.id, provider, timestamp: new Date() });
    }

    // Generate gateway JWT
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        orgId: user.orgId,
        provider: user.provider,
      },
      githubAccessToken: user.githubAccessToken || githubAccessToken || null,
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(500).json({ error: 'Firebase authentication failed' });
  }
});

export default router;

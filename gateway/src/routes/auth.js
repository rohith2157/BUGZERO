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
    res.status(500).json({ error: 'Failed to sync users' });
  }
});

// GET /api/auth/github
router.get('/github', async (req, res) => {
  try {
    const token = req.query.token;
    
    let statePayload = { action: 'login' };
    
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        statePayload = { action: 'link', userId: decoded.id };
      } catch (err) {}
    }
    
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=repo,user:email&state=${state}`;
    
    res.redirect(githubAuthUrl);
  } catch (err) {
    console.error('GitHub Auth Error:', err);
    res.status(500).json({ error: 'Failed to initiate GitHub auth' });
  }
});

// GET /api/auth/github/callback
router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) return res.redirect('http://localhost:5173/login?error=github_auth_failed');
    
    const statePayload = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL
      })
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) return res.redirect('http://localhost:5173/login?error=github_token_failed');
    
    if (statePayload.action === 'link') {
      await prisma.user.update({
        where: { id: statePayload.userId },
        data: { githubAccessToken: accessToken }
      });
      return res.redirect('http://localhost:5173/tests/new?github=linked');
    } else {
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${accessToken}` }
      });
      const githubUser = await userResponse.json();
      
      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
           headers: { Authorization: `token ${accessToken}` }
        });
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find(e => e.primary) || emails[0];
        if (primaryEmail) email = primaryEmail.email;
      }
      
      if (!email) return res.redirect('http://localhost:5173/login?error=no_email');
      
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: githubUser.name || githubUser.login,
            provider: 'github',
            role: 'developer',
            githubAccessToken: accessToken
          }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { githubAccessToken: accessToken }
        });
      }
      
      const jwtToken = generateToken(user);
      return res.redirect(`http://localhost:5173/login?token=${jwtToken}`);
    }
  } catch (err) {
    console.error('GitHub Callback Error:', err);
    res.redirect('http://localhost:5173/login?error=github_callback_error');
  }
});

// GET /api/auth/github/repos
router.get('/github/repos', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { githubAccessToken: true }
    });
    
    if (!user || !user.githubAccessToken) {
      return res.status(401).json({ error: 'GitHub account not linked' });
    }
    
    const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `token ${user.githubAccessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    
    if (!reposResponse.ok) {
      const errorData = await reposResponse.json();
      console.error('GitHub API error:', errorData);
      return res.status(reposResponse.status).json({ error: 'Failed to fetch repositories' });
    }
    
    const repos = await reposResponse.json();
    
    // Map to a simpler format for the frontend
    const formattedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      updatedAt: repo.updated_at
    }));
    
    res.json({ repositories: formattedRepos });
  } catch (err) {
    console.error('GitHub Fetch Repos Error:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

export default router;

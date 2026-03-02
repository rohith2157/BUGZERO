import { Router } from 'express';
import { randomBytes } from 'crypto';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

// GET /api/settings/team — Get team members
router.get('/team', authenticate, async (req, res) => {
    try {
        if (!req.user.orgId) {
            return res.json({ members: [] });
        }

        const members = await prisma.user.findMany({
            where: { orgId: req.user.orgId },
            select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'asc' },
        });

        const formatted = members.map(m => ({
            ...m,
            lastActive: m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : 'Never',
        }));

        res.json({ members: formatted });
    } catch (err) {
        console.error('Get team error:', err);
        res.status(500).json({ error: 'Failed to get team' });
    }
});

// PUT /api/settings/profile — Update profile
router.put('/profile', authenticate, [
    body('name').optional().trim().notEmpty(),
    body('avatar').optional().isURL(),
], validate, async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const data = {};
        if (name) data.name = name;
        if (avatar) data.avatar = avatar;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data,
            select: { id: true, name: true, email: true, avatar: true, role: true },
        });

        res.json({ user });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// GET /api/settings/api-keys — List API keys
router.get('/api-keys', authenticate, async (req, res) => {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Mask key values
        const masked = keys.map(k => ({
            ...k,
            key: k.key.substring(0, 8) + '••••••••' + k.key.substring(k.key.length - 4),
        }));

        res.json({ apiKeys: masked });
    } catch (err) {
        console.error('List API keys error:', err);
        res.status(500).json({ error: 'Failed to list API keys' });
    }
});

// POST /api/settings/api-keys — Generate a new API key
router.post('/api-keys', authenticate, [
    body('name').trim().notEmpty().withMessage('Key name is required'),
], validate, async (req, res) => {
    try {
        const { name } = req.body;
        const keyValue = 'aq_' + randomBytes(32).toString('hex');

        const apiKey = await prisma.apiKey.create({
            data: { name, key: keyValue, userId: req.user.id },
        });

        // Return full key only on creation
        res.status(201).json({ apiKey });
    } catch (err) {
        console.error('Create API key error:', err);
        res.status(500).json({ error: 'Failed to generate API key' });
    }
});

// DELETE /api/settings/api-keys/:id — Revoke an API key
router.delete('/api-keys/:id', authenticate, async (req, res) => {
    try {
        const keyId = req.params.id;
        if (!keyId) {
            return res.status(400).json({ error: 'API key ID required' });
        }

        const key = await prisma.apiKey.findFirst({
            where: { id: keyId, userId: req.user.id },
        });

        if (!key) {
            return res.status(404).json({ error: 'API key not found' });
        }

        await prisma.apiKey.update({
            where: { id: req.params.id },
            data: { status: 'revoked' },
        });

        res.json({ message: 'API key revoked' });
    } catch (err) {
        console.error('Revoke API key error:', err);
        res.status(500).json({ error: 'Failed to revoke API key' });
    }
});

// GET /api/settings/notifications — Get notification preferences
router.get('/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json({ notifications });
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

export default router;

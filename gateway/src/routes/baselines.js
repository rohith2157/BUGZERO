import { Router } from 'express';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/baselines — Fetch baseline screenshot for a URL
router.get('/', async (req, res) => {
    try {
        const { url, orgId } = req.query;
        if (!url) return res.status(400).json({ error: 'url parameter required' });

        // Use orgId if provided, otherwise try to find any baseline for this URL
        const where = { url };
        if (orgId) {
            where.orgId = orgId;
        }

        const baseline = await prisma.screenshotBaseline.findFirst({
            where,
            orderBy: { updatedAt: 'desc' },
        });

        if (!baseline) {
            return res.status(404).json({ error: 'No baseline found' });
        }

        res.json({ screenshotB64: baseline.screenshotB64, url: baseline.url, updatedAt: baseline.updatedAt });
    } catch (err) {
        console.error('Get baseline error:', err);
        res.status(500).json({ error: 'Failed to get baseline' });
    }
});

// POST /api/baselines — Save/update a baseline screenshot
router.post('/', async (req, res) => {
    try {
        const { url, orgId, screenshotB64 } = req.body;
        if (!url || !screenshotB64) {
            return res.status(400).json({ error: 'url and screenshotB64 required' });
        }

        const actualOrgId = orgId || 'default';

        // Upsert — update if exists for same URL+org, create otherwise
        const baseline = await prisma.screenshotBaseline.upsert({
            where: {
                url_orgId: { url, orgId: actualOrgId },
            },
            update: {
                screenshotB64,
            },
            create: {
                url,
                orgId: actualOrgId,
                screenshotB64,
            },
        });

        res.json({ ok: true, id: baseline.id, url: baseline.url });
    } catch (err) {
        console.error('Save baseline error:', err);
        res.status(500).json({ error: 'Failed to save baseline' });
    }
});

export default router;

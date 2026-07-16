import express from 'express';
import prisma from '../db.js';

const router = express.Router();

// GET /api/healing/map
// Fetch the healing map for a specific org and url
router.get('/map', async (req, res) => {
    try {
        const { orgId, url } = req.query;
        if (!orgId || !url) {
            return res.status(400).json({ error: 'orgId and url are required' });
        }

        const healingMap = await prisma.healingMap.findUnique({
            where: {
                orgId_url: {
                    orgId,
                    url
                }
            }
        });

        if (!healingMap) {
            return res.status(404).json({ error: 'Healing map not found' });
        }

        res.json(healingMap.mapData);
    } catch (error) {
        console.error('Error fetching healing map:', error);
        res.status(500).json({ error: 'Failed to fetch healing map' });
    }
});

// POST /api/healing/map
// Upsert the healing map for a specific org and url
router.post('/map', async (req, res) => {
    try {
        const { orgId, url, mapData } = req.body;
        
        if (!orgId || !url || !mapData) {
            return res.status(400).json({ error: 'orgId, url, and mapData are required' });
        }

        const healingMap = await prisma.healingMap.upsert({
            where: {
                orgId_url: {
                    orgId,
                    url
                }
            },
            update: {
                mapData
            },
            create: {
                orgId,
                url,
                mapData
            }
        });

        res.json({ success: true, message: 'Healing map saved successfully' });
    } catch (error) {
        console.error('Error saving healing map:', error);
        res.status(500).json({ error: 'Failed to save healing map' });
    }
});

export default router;

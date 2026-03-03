import { Router } from 'express';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createTestRules, uuidParam } from '../middleware/validate.js';
import { triggerAITest } from '../services/testService.js';
import { emitTestEvent } from '../services/websocket.js';

const router = Router();

// POST /api/tests/progress — internal incremental updates from AI Core (no auth)
router.post('/progress', async (req, res) => {
    try {
        const { event, run_id, ...data } = req.body;
        if (!run_id || !event) return res.status(400).json({ error: 'run_id and event required' });

        const io = req.app.get('io');

        if (event === 'crawl_complete') {
            // upsert-style: only update if still running/queued
            await prisma.testRun.updateMany({
                where: { id: run_id, status: { in: ['running', 'queued'] } },
                data: { totalPages: data.total_pages || 0 },
            });
            emitTestEvent(io, run_id, 'crawl:complete', { totalPages: data.total_pages });

        } else if (event === 'page_complete') {
            const page = data.page;
            if (!page) return res.status(400).json({ error: 'page data required' });

            // Skip if test is already failed/cancelled/completed to avoid FK violations
            const runExists = await prisma.testRun.findFirst({
                where: { id: run_id, status: { in: ['running', 'queued'] } },
                select: { id: true },
            });
            if (!runExists) {
                return res.json({ ok: true, skipped: true });
            }

            const dbPage = await prisma.page.create({
                data: {
                    url: page.url,
                    pageType: page.page_type,
                    hygieneScore: Math.min(100, Math.max(0, page.hygiene_score || 0)),
                    status: 'tested',
                    runId: run_id,
                },
            });

            for (const defect of (page.defects || [])) {
                await prisma.defect.create({
                    data: {
                        type: defect.type,
                        severity: defect.severity,
                        message: defect.message,
                        fix: defect.fix || null,
                        pageUrl: page.url,
                        pageId: dbPage.id,
                        runId: run_id,
                        confidence: defect.confidence || null,
                    },
                });
            }

            for (const v of (page.compliance || [])) {
                await prisma.complianceResult.create({
                    data: {
                        standard: v.standard,
                        criterion: v.criterion,
                        severity: v.severity,
                        description: v.description,
                        remediation: v.remediation || null,
                        pageUrl: page.url,
                        pageId: dbPage.id,
                        runId: run_id,
                    },
                });
            }

            for (const [metricName, metricData] of Object.entries(page.performance || {})) {
                await prisma.performanceMetric.create({
                    data: {
                        metricName,
                        value: metricData.value,
                        rating: metricData.rating || null,
                        pageUrl: page.url,
                        pageId: dbPage.id,
                        runId: run_id,
                    },
                });
            }

            // Update counters on the run
            await prisma.testRun.update({
                where: { id: run_id },
                data: {
                    testedPages: { increment: 1 },
                    defectCount: { increment: (page.defects || []).length },
                },
            });

            // Emit real-time WS events
            emitTestEvent(io, run_id, 'page:complete', {
                url: page.url,
                pageType: page.page_type,
                hygieneScore: page.hygiene_score,
            });
            for (const defect of (page.defects || [])) {
                emitTestEvent(io, run_id, 'defect:found', {
                    page: page.url,
                    type: defect.type,
                    severity: defect.severity,
                    message: defect.message,
                });
            }
        }

        res.json({ ok: true });
    } catch (err) {
        console.error('Progress update error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tests — Start a new test run
router.post('/', authenticate, createTestRules, validate, async (req, res) => {
    try {
        const { url, config } = req.body;

        const testRun = await prisma.testRun.create({
            data: {
                url,
                status: 'queued',
                config: config || {},
                userId: req.user.id,
                orgId: req.user.orgId,
            },
        });

        // Trigger AI Core asynchronously
        const io = req.app.get('io');
        triggerAITest(testRun, io).catch(err => {
            console.error('AI test trigger failed:', err);
        });

        res.status(201).json({ testRun });
    } catch (err) {
        console.error('Create test error:', err);
        res.status(500).json({ error: 'Failed to create test run' });
    }
});

// GET /api/tests — List all test runs for user/org
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;

        const where = { userId: req.user.id };
        if (status) where.status = status;

        const [testRuns, total] = await Promise.all([
            prisma.testRun.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
                include: { _count: { select: { defects: true, pages: true } } },
            }),
            prisma.testRun.count({ where }),
        ]);

        res.json({ testRuns, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (err) {
        console.error('List tests error:', err);
        res.status(500).json({ error: 'Failed to list test runs' });
    }
});

// GET /api/tests/:id — Full results of a specific run
router.get('/:id', authenticate, uuidParam, validate, async (req, res) => {
    try {
        const testRun = await prisma.testRun.findFirst({
            where: { id: req.params.id, userId: req.user.id },
            include: {
                pages: { orderBy: { createdAt: 'asc' } },
                defects: { orderBy: { severity: 'asc' } },
            },
        });

        if (!testRun) {
            return res.status(404).json({ error: 'Test run not found' });
        }

        res.json({ testRun });
    } catch (err) {
        console.error('Get test error:', err);
        res.status(500).json({ error: 'Failed to get test run' });
    }
});

// DELETE /api/tests/:id — Cancel an in-progress run
router.delete('/:id', authenticate, uuidParam, validate, async (req, res) => {
    try {
        const testRun = await prisma.testRun.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!testRun) {
            return res.status(404).json({ error: 'Test run not found' });
        }

        if (testRun.status === 'running' || testRun.status === 'queued') {
            await prisma.testRun.update({
                where: { id: req.params.id },
                data: { status: 'cancelled', completedAt: new Date() },
            });

            const io = req.app.get('io');
            io.to(`test:${req.params.id}`).emit('test:cancelled', { runId: req.params.id });

            // Signal the AI Core to abort (best-effort)
            const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
            fetch(`${FASTAPI_URL}/api/test/cancel/${req.params.id}`, { method: 'POST' }).catch(() => { });
        }

        res.json({ message: 'Test run cancelled' });
    } catch (err) {
        console.error('Cancel test error:', err);
        res.status(500).json({ error: 'Failed to cancel test run' });
    }
});

// GET /api/tests/:id/pages — All page results for a run
router.get('/:id/pages', authenticate, uuidParam, validate, async (req, res) => {
    try {
        const pages = await prisma.page.findMany({
            where: { runId: req.params.id, run: { userId: req.user.id } },
            include: { defects: true },
            orderBy: { createdAt: 'asc' },
        });

        res.json({ pages });
    } catch (err) {
        console.error('Get pages error:', err);
        res.status(500).json({ error: 'Failed to get pages' });
    }
});

// GET /api/tests/:id/compliance — Compliance report for a run
router.get('/:id/compliance', authenticate, uuidParam, validate, async (req, res) => {
    try {
        const results = await prisma.complianceResult.findMany({
            where: { runId: req.params.id, run: { userId: req.user.id } },
            orderBy: { severity: 'asc' },
        });

        // Compute scores
        const totalViolations = results.length;
        const wcagViolations = results.filter(r => r.standard === 'WCAG').length;
        const gdprViolations = results.filter(r => r.standard === 'GDPR').length;

        const overallScore = Math.max(0, Math.min(100, 100 - totalViolations * 3));
        const wcagScore = Math.max(0, Math.min(100, 100 - wcagViolations * 4));
        const gdprScore = Math.max(0, Math.min(100, 100 - gdprViolations * 5));

        res.json({
            scores: { overall: overallScore, wcag: wcagScore, gdpr: gdprScore },
            violations: results,
        });
    } catch (err) {
        console.error('Get compliance error:', err);
        res.status(500).json({ error: 'Failed to get compliance report' });
    }
});

// GET /api/tests/:id/performance — Performance metrics for a run
router.get('/:id/performance', authenticate, uuidParam, validate, async (req, res) => {
    try {
        const metrics = await prisma.performanceMetric.findMany({
            where: { runId: req.params.id, run: { userId: req.user.id } },
            orderBy: { createdAt: 'asc' },
        });

        // Group by page
        const byPage = {};
        for (const m of metrics) {
            if (!byPage[m.pageUrl]) byPage[m.pageUrl] = {};
            byPage[m.pageUrl][m.metricName] = { value: m.value, rating: m.rating };
        }

        // Extract web vitals (averages)
        const vitalNames = ['LCP', 'FID', 'CLS', 'TTFB'];
        const webVitals = {};
        for (const name of vitalNames) {
            const vals = metrics.filter(m => m.metricName === name);
            if (vals.length > 0) {
                webVitals[name] = {
                    value: vals.reduce((sum, v) => sum + v.value, 0) / vals.length,
                    rating: vals[0].rating,
                };
            }
        }

        res.json({ webVitals, byPage, metrics });
    } catch (err) {
        console.error('Get performance error:', err);
        res.status(500).json({ error: 'Failed to get performance report' });
    }
});

export default router;

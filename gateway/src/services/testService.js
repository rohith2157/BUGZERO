import prisma from '../db.js';
import { emitTestEvent } from './websocket.js';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * Triggers an AI test run by calling the Python FastAPI AI Core.
 * Updates the database and emits WebSocket events as the test progresses.
 */
export async function triggerAITest(testRun, io) {
    try {
        // Mark as running
        const startedAt = new Date();
        await prisma.testRun.update({
            where: { id: testRun.id },
            data: { status: 'running', startedAt },
        });

        emitTestEvent(io, testRun.id, 'test:started', {
            url: testRun.url,
            status: 'running',
        });

        // Call AI Core
        const response = await fetch(`${FASTAPI_URL}/api/test/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                run_id: testRun.id,
                url: testRun.url,
                config: testRun.config,
            }),
        });

        if (!response.ok) {
            throw new Error(`AI Core returned ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();

        // Store results in database
        if (result.pages && result.pages.length > 0) {
            for (const page of result.pages) {
                const dbPage = await prisma.page.create({
                    data: {
                        url: page.url,
                        pageType: page.page_type,
                        hygieneScore: Math.min(100, Math.max(0, page.hygiene_score || 0)),
                        status: 'tested',
                        runId: testRun.id,
                    },
                });

                emitTestEvent(io, testRun.id, 'page:complete', {
                    url: page.url,
                    pageType: page.page_type,
                    hygieneScore: page.hygiene_score,
                });

                // Store defects for this page
                if (page.defects) {
                    for (const defect of page.defects) {
                        await prisma.defect.create({
                            data: {
                                type: defect.type,
                                severity: defect.severity,
                                message: defect.message,
                                fix: defect.fix || null,
                                pageUrl: page.url,
                                pageId: dbPage.id,
                                runId: testRun.id,
                                confidence: defect.confidence || null,
                            },
                        });

                        emitTestEvent(io, testRun.id, 'defect:found', {
                            page: page.url,
                            type: defect.type,
                            severity: defect.severity,
                            message: defect.message,
                        });
                    }
                }

                // Store compliance results
                if (page.compliance) {
                    for (const violation of page.compliance) {
                        await prisma.complianceResult.create({
                            data: {
                                standard: violation.standard,
                                criterion: violation.criterion,
                                severity: violation.severity,
                                description: violation.description,
                                remediation: violation.remediation || null,
                                pageUrl: page.url,
                                pageId: dbPage.id,
                                runId: testRun.id,
                            },
                        });
                    }
                }

                // Store performance metrics
                if (page.performance) {
                    for (const [metricName, metricData] of Object.entries(page.performance)) {
                        await prisma.performanceMetric.create({
                            data: {
                                metricName,
                                value: metricData.value,
                                rating: metricData.rating || null,
                                pageUrl: page.url,
                                pageId: dbPage.id,
                                runId: testRun.id,
                            },
                        });
                    }
                }
            }
        }

        // Calculate overall score
        const pages = await prisma.page.findMany({ where: { runId: testRun.id } });
        const defectCount = await prisma.defect.count({ where: { runId: testRun.id } });
        const avgScore = pages.length > 0
            ? Math.min(100, pages.reduce((sum, p) => sum + (p.hygieneScore || 0), 0) / pages.length)
            : 0;

        const completedAt = new Date();
        const duration = Math.round((completedAt - startedAt) / 1000);
        const durationStr = `${Math.floor(duration / 60)}m ${duration % 60}s`;

        await prisma.testRun.update({
            where: { id: testRun.id },
            data: {
                status: 'completed',
                completedAt,
                duration: durationStr,
                totalPages: pages.length,
                testedPages: pages.length,
                defectCount,
                overallScore: Math.round(avgScore * 10) / 10,
            },
        });

        emitTestEvent(io, testRun.id, 'test:complete', {
            totalScore: Math.round(avgScore * 10) / 10,
            totalPages: pages.length,
            totalDefects: defectCount,
            duration: durationStr,
        });

    } catch (err) {
        console.error(`Test run ${testRun.id} failed:`, err);

        await prisma.testRun.update({
            where: { id: testRun.id },
            data: { status: 'failed', completedAt: new Date() },
        });

        emitTestEvent(io, testRun.id, 'test:failed', {
            error: err.message,
        });
    }
}

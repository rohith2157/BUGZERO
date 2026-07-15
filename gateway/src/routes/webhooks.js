import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../db.js';
import { triggerAITest } from '../services/testService.js';

const router = Router();

// POST /api/webhooks/github/:keyId
router.post('/github/:keyId', async (req, res) => {
    // 1. Respond immediately to GitHub (timeout < 10s)
    res.status(200).json({ received: true });

    // 2. Process payload asynchronously
    (async () => {
        try {
            const { keyId } = req.params;
            const signature = req.headers['x-hub-signature-256'];
            const event = req.headers['x-github-event'];

            if (!signature || !event || !req.rawBody) {
                console.log('Webhook error: Missing headers or raw body');
                return;
            }

            // Find API key and associated user
            const apiKey = await prisma.apiKey.findUnique({
                where: { id: keyId },
                include: { user: true }
            });

            if (!apiKey || apiKey.status !== 'active') {
                console.log(`Webhook error: Invalid or revoked API key (${keyId})`);
                return;
            }

            // Validate HMAC signature using the API Key as the secret
            const hmac = crypto.createHmac('sha256', apiKey.key);
            hmac.update(req.rawBody);
            const expectedSignature = `sha256=${hmac.digest('hex')}`;

            if (signature !== expectedSignature) {
                console.log('Webhook error: Invalid signature');
                return;
            }

            // Parse payload
            const payload = req.body;
            let targetUrl = '';
            let branch = '';

            if (event === 'push') {
                targetUrl = payload.repository?.html_url;
                branch = payload.ref?.replace('refs/heads/', '');
            } else if (event === 'pull_request' && ['opened', 'synchronize', 'reopened'].includes(payload.action)) {
                targetUrl = payload.pull_request?.head?.repo?.html_url;
                branch = payload.pull_request?.head?.ref;
            } else {
                console.log(`Webhook ignored: Unsupported event or action (${event})`);
                return;
            }

            if (!targetUrl) {
                console.log('Webhook error: No target URL found in payload');
                return;
            }

            // Update lastUsed timestamp on the API Key
            await prisma.apiKey.update({
                where: { id: keyId },
                data: { lastUsed: new Date() }
            });

            // Prepare AI Core test run config
            const config = {
                type: 'repo',
                max_depth: 3,
                max_pages: 10,
                branch: branch || 'main'
            };

            // Inject the user's GitHub Token so AI Core can clone the private repo
            if (apiKey.user.githubAccessToken) {
                config.github_token = apiKey.user.githubAccessToken;
            } else {
                console.log('Webhook warning: User does not have a linked GitHub account. Private repos will fail to clone.');
            }

            // Do not save the token in plain text in the DB test config
            const dbConfig = { ...config };
            delete dbConfig.github_token;

            // Create the TestRun in DB
            const testRun = await prisma.testRun.create({
                data: {
                    url: targetUrl,
                    status: 'queued',
                    config: dbConfig,
                    userId: apiKey.userId,
                    orgId: apiKey.user.orgId
                }
            });

            // Pass the in-memory config containing the token to triggerAITest
            const io = req.app.get('io');
            const aiTestRun = { ...testRun, config };
            
            triggerAITest(aiTestRun, io).catch(err => {
                console.error('AI test trigger failed from webhook:', err);
            });

            console.log(`[Webhook] ✅ Successfully triggered TestRun ${testRun.id} for ${targetUrl} (Branch: ${branch})`);

        } catch (error) {
            console.error('Webhook processing error:', error);
        }
    })();
});

export default router;

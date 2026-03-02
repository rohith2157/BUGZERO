import { Router } from 'express';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validate, playbookRules, uuidParam } from '../middleware/validate.js';

const router = Router();

// GET /api/playbooks — List all playbooks for user's org
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.user.orgId ? { orgId: req.user.orgId } : {};
    const playbooks = await prisma.authPlaybook.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ playbooks });
  } catch (err) {
    console.error('List playbooks error:', err);
    res.status(500).json({ error: 'Failed to list playbooks' });
  }
});

// POST /api/playbooks — Create a new playbook
router.post('/', authenticate, playbookRules, validate, async (req, res) => {
  try {
    const { name, domain, authType, config } = req.body;

    if (!req.user.orgId) {
      return res.status(400).json({ error: 'Organization required to create playbooks' });
    }

    const playbook = await prisma.authPlaybook.create({
      data: {
        name,
        domain,
        authType,
        config: config || {},
        orgId: req.user.orgId,
      },
    });

    res.status(201).json({ playbook });
  } catch (err) {
    console.error('Create playbook error:', err);
    res.status(500).json({ error: 'Failed to create playbook' });
  }
});

// PUT /api/playbooks/:id — Update a playbook
router.put('/:id', authenticate, uuidParam, playbookRules, validate, async (req, res) => {
  try {
    const { name, domain, authType, config } = req.body;

    const playbook = await prisma.authPlaybook.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });

    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    const updated = await prisma.authPlaybook.update({
      where: { id: req.params.id },
      data: { name, domain, authType, config: config || playbook.config },
    });

    res.json({ playbook: updated });
  } catch (err) {
    console.error('Update playbook error:', err);
    res.status(500).json({ error: 'Failed to update playbook' });
  }
});

// DELETE /api/playbooks/:id — Delete a playbook
router.delete('/:id', authenticate, uuidParam, validate, async (req, res) => {
  try {
    const playbook = await prisma.authPlaybook.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });

    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    await prisma.authPlaybook.delete({ where: { id: req.params.id } });

    res.json({ message: 'Playbook deleted' });
  } catch (err) {
    console.error('Delete playbook error:', err);
    res.status(500).json({ error: 'Failed to delete playbook' });
  }
});

export default router;

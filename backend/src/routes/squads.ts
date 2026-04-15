import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/squads — list my squads
router.get('/', async (req, res, next) => {
  try {
    const memberships = await prisma.squadMember.findMany({
      where: { userId: req.user!.id },
      include: { squad: { include: { members: { include: { user: { select: { id: true, name: true, company: true } } } } } } },
    });
    res.json({ squads: memberships.map((m) => m.squad) });
  } catch (err) { next(err); }
});

// POST /api/squads — create a squad
router.post('/', async (req, res, next) => {
  try {
    const { name, rideDays, departureTime, memberIds, role } = req.body;
    const squad = await prisma.squad.create({
      data: {
        name, rideDays, departureTime,
        createdById: req.user!.id,
        members: {
          create: [
            { userId: req.user!.id, role },
            ...(memberIds || []).map((id: string) => ({ userId: id, role: 'COMMUTER' })),
          ],
        },
      },
    });
    res.json({ squad });
  } catch (err) { next(err); }
});

export default router;

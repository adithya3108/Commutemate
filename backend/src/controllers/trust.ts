import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getUserTrustScore } from '../services/trustService';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

const VALID_TAGS = ['punctual', 'good_company', 'smooth_ride', 'safe_driver', 'comfortable'];

// POST /api/trust/:matchId
export async function submitTrust(req: Request, res: Response, next: NextFunction) {
  try {
    const fromUserId = req.user!.id;
    const { matchId } = req.params;
    const { toUserId, wouldRideAgain, tags = [] } = req.body;

    // Validate tags — only positive, known tags allowed
    const cleanTags = (tags as string[]).filter((t) => VALID_TAGS.includes(t));

    // Confirm both users were in this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true },
    });
    if (!match) throw new AppError('Match not found.', 404);

    const userIds = [match.sharerId, ...match.participants.map((p) => p.commuterID)];
    if (!userIds.includes(fromUserId)) throw new AppError('You were not part of this ride.', 403);
    if (!userIds.includes(toUserId)) throw new AppError('That person was not part of this ride.', 403);

    // Save trust signal
    await prisma.trustSignal.upsert({
      where: { fromUserId_matchId: { fromUserId, matchId } },
      update: { wouldRideAgain, tags: cleanTags },
      create: { fromUserId, toUserId, matchId, wouldRideAgain, tags: cleanTags },
    });

    // Recalculate recipient's trust score
    const newScore = await getUserTrustScore(toUserId);
    const totalRides = await prisma.trustSignal.count({ where: { toUserId } });

    await prisma.user.update({
      where: { id: toUserId },
      data: { trustScore: newScore, totalRides },
    });

    res.json({ message: 'Thanks for the note!' });
  } catch (err) {
    next(err);
  }
}

// GET /api/trust/profile/:userId
// Returns public trust info — never exposes the raw score number
export async function getUserTrustProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, company: true, itParkName: true, totalRides: true, trustScore: true },
    });
    if (!user) throw new AppError('User not found.', 404);

    // Aggregate top tags
    const signals = await prisma.trustSignal.findMany({
      where: { toUserId: userId, wouldRideAgain: true },
      select: { tags: true },
    });
    const tagCounts: Record<string, number> = {};
    signals.forEach((s) => s.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    // Convert internal score (0-100) to a 5-star display rating
    const starRating = Math.round((user.trustScore / 100) * 50) / 10; // 0-5, 1dp

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        company: user.company,
        itPark: user.itParkName,
        totalRides: user.totalRides,
        rating: starRating,   // e.g. 4.9 — shown to other users
        topTags,              // e.g. ["punctual", "smooth_ride"]
        // trustScore is NOT returned — internal only
      },
    });
  } catch (err) {
    next(err);
  }
}

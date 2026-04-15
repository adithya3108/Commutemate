import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';
import { verifyCompanyEmail, findNearestItPark } from '../services/trustService';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/users/me
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, company: true, companyTier: true,
        itParkName: true, gender: true, genderPreference: true,
        vehicleType: true, vehicleSeats: true, vehicleModel: true, vehicleNumber: true,
        homeArea: true, totalRides: true, trustScore: true,
      },
    });
    res.json({ user });
  } catch (err) { next(err); }
});

// PATCH /api/users/me — update profile
router.patch('/me', async (req, res, next) => {
  try {
    const {
      name, gender, genderPreference,
      vehicleType, vehicleSeats, vehicleModel, vehicleNumber,
      homeArea, homeLat, homeLng, workLat, workLng,
      maxDetourMinutes, preferKnownRiders, fcmToken,
    } = req.body;

    // Auto-detect IT park from work location
    let itParkId: string | undefined;
    let itParkName: string | undefined;
    if (workLat && workLng) {
      const park = findNearestItPark(workLat, workLng);
      if (park) { itParkId = park.id; itParkName = park.name; }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name, gender, genderPreference,
        vehicleType, vehicleSeats, vehicleModel, vehicleNumber,
        homeArea, homeLat, homeLng, workLat, workLng,
        itParkId, itParkName,
        maxDetourMinutes, preferKnownRiders, fcmToken,
      },
    });
    res.json({ user: { id: user.id, name: user.name } });
  } catch (err) { next(err); }
});

export default router;

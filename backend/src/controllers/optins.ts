import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRoute } from '../services/matchingService';
import { notifyCorridorCommutersOfNewSharer } from '../services/notificationService';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// POST /api/optins/today
export async function optIn(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { role, departureTime } = req.body;
    const date = todayDate();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found.', 404);

    // Sharers need a vehicle
    if (role === 'SHARER' && !user.vehicleType) {
      throw new AppError(
        'Please add your vehicle details in profile before sharing a commute.',
        400
      );
    }

    // Need home and work locations
    if (!user.homeLat || !user.workLat) {
      throw new AppError(
        'Please set your home and work locations in profile first.',
        400
      );
    }

    let routePolyline: string | undefined;

    // For sharers, fetch and store the route polyline
    if (role === 'SHARER') {
      const route = await getRoute(
        { lat: user.homeLat, lng: user.homeLng! },
        { lat: user.workLat, lng: user.workLng! }
      );
      routePolyline = route.polyline;

      // Notify commuters on this corridor that a sharer is heading out
      await notifyCorridorCommutersOfNewSharer(userId, route, date);
    }

    const optin = await prisma.dailyOptin.upsert({
      where: { userId_date: { userId, date } },
      update: {
        role,
        departureTime: departureTime || null,
        status: 'ACTIVE',
        routePolyline: routePolyline || null,
        matchId: null,
      },
      create: {
        userId,
        date,
        role,
        departureTime: departureTime || null,
        routePolyline: routePolyline || null,
      },
    });

    res.json({
      message: role === 'SHARER'
        ? 'You\'re heading out! Your corridor has been notified.'
        : 'You\'re looking for a ride! We\'ll notify you when someone\'s heading your way.',
      optin: {
        id: optin.id,
        role: optin.role,
        departureTime: optin.departureTime,
        status: optin.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/optins/today
export async function getOptin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const optin = await prisma.dailyOptin.findUnique({
      where: { userId_date: { userId, date: todayDate() } },
      include: { match: { include: { participants: true } } },
    });

    res.json({ optin: optin || null });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/optins/today
export async function cancelOptin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    await prisma.dailyOptin.updateMany({
      where: { userId, date: todayDate(), status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'No worries — see you another day!' });
  } catch (err) {
    next(err);
  }
}

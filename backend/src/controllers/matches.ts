import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as polylineLib from 'polyline';
import { findMatchesForSharer, getRoute } from '../services/matchingService';
import { sendPushNotification } from '../services/notificationService';
import { AppError } from '../utils/AppError';
import { haversineDistance } from '../utils/geo';

const prisma = new PrismaClient();

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
}

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/matches/available
// Commuter sees sharers whose route corridor they fall in
export async function getAvailableMatches(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const commuterId = req.user!.id;
    const date = todayDate();

    // Get all active sharer optins today with a route polyline
    const sharerOptins = await prisma.dailyOptin.findMany({
      where: {
        date,
        role: 'SHARER',
        status: 'ACTIVE',
        routePolyline: { not: null },
        userId: { not: commuterId },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            company: true,
            itPark: true,
            vehicleType: true,
            vehicleSeats: true,
            vehicleModel: true,
            homeLat: true,
            homeLng: true,
            workLat: true,
            workLng: true,
          },
        },
      },
    });

    const commuter = await prisma.user.findUnique({
      where: { id: commuterId },
      select: { homeLat: true, homeLng: true },
    });

    if (!commuter?.homeLat) {
      throw new AppError('Please set your home location in profile.', 400);
    }

    const results = [];
    const petrolCostPerKm = parseFloat(process.env.DEFAULT_PETROL_COST_PER_KM || '6.5');

    for (const optin of sharerOptins) {
      const sharer = optin.user;
      if (!optin.routePolyline) continue;

      // Decode polyline and find if commuter is near this route
      const rawPoints: [number, number][] = polylineLib.decode(optin.routePolyline);
      const points = rawPoints.map(([lat, lng]) => ({ lat, lng }));

      // Quick distance check using haversine on nearest polyline point
      let minDist = Infinity;
      for (const pt of points) {
        const d = haversineDistance(
          { lat: commuter.homeLat!, lng: commuter.homeLng! },
          pt
        );
        if (d < minDist) minDist = d;
      }

      const bufferMetres = 600;
      if (minDist > bufferMetres) continue;

      // Estimate seats available
      const confirmedCount = await prisma.matchParticipant.count({
        where: {
          match: { sharerId: sharer.id, date, status: { in: ['PENDING', 'CONFIRMED'] } },
          status: { in: ['PENDING', 'CONFIRMED', 'BOARDED'] },
        },
      });
      const seatsLeft = (sharer.vehicleSeats || 1) - confirmedCount;
      if (seatsLeft <= 0) continue;

      // Estimate petrol share
      const totalDistKm = sharer.workLat && commuter.homeLat
        ? haversineDistance(
            { lat: sharer.homeLat!, lng: sharer.homeLng! },
            { lat: sharer.workLat, lng: sharer.workLng! }
          ) / 1000
        : 30;
      const commuterDistKm = haversineDistance(
        { lat: commuter.homeLat!, lng: commuter.homeLng! },
        { lat: sharer.workLat!, lng: sharer.workLng! }
      ) / 1000;
      const estimatedShare = Math.round((commuterDistKm / totalDistKm) * totalDistKm * petrolCostPerKm);

      // Find or create a match for this sharer today
      let match = await prisma.match.findFirst({
        where: { sharerId: sharer.id, date, status: { in: ['PENDING', 'CONFIRMED'] } },
      });
      if (!match) {
        match = await prisma.match.create({
          data: { sharerId: sharer.id, date, routePolyline: optin.routePolyline },
        });
      }

      results.push({
        matchId: match.id,
        sharer: {
          id: sharer.id,
          name: sharer.name,
          company: sharer.company,
          itPark: sharer.itPark,
          vehicleType: sharer.vehicleType,
          vehicleModel: sharer.vehicleModel,
          seatsLeft,
        },
        distanceToRouteMetres: Math.round(minDist),
        detourMinutes: 0, // simplified for listing; calculated precisely on join
        estimatedPetrolShare: estimatedShare,
      });
    }

    res.json({ matches: results });
  } catch (err) {
    next(err);
  }
}

// POST /api/matches/:matchId/join
export async function requestToJoin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { matchId } = req.params;
    const commuterId = req.user!.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { sharer: true },
    });
    if (!match) throw new AppError('Match not found.', 404);
    if (match.status === 'COMPLETED' || match.status === 'CANCELLED') {
      throw new AppError('This commute is no longer available.', 400);
    }

    const commuter = await prisma.user.findUnique({ where: { id: commuterId } });
    if (!commuter?.homeLat || !commuter.workLat) {
      throw new AppError('Please set your home and work locations.', 400);
    }

    // Check not already in this match
    const existing = await prisma.matchParticipant.findFirst({
      where: { matchId, commuterID: commuterId },
    });
    if (existing) throw new AppError('You\'ve already requested to join this commute.', 400);

    // Generate OTP (shown at pickup)
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hr from now

    const participant = await prisma.matchParticipant.create({
      data: {
        matchId,
        commuterID: commuterId,
        dropLat: commuter.workLat,
        dropLng: commuter.workLng!,
        dropAddress: commuter.itPark || 'Your workplace',
        otp,
        otpExpiresAt,
        status: 'PENDING',
      },
    });

    // Notify sharer
    await sendPushNotification({
      userId: match.sharerId,
      title: `${commuter.name} wants to join your commute`,
      body: `They're heading to ${commuter.itPark || 'their workplace'}. Not off your route.`,
      data: { matchId, participantId: participant.id, type: 'JOIN_REQUEST' },
    });

    res.json({
      message: 'Request sent! You\'ll be notified when they confirm.',
      participantId: participant.id,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/matches/:matchId/accept/:participantId
export async function acceptParticipant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { matchId, participantId } = req.params;
    const sharerId = req.user!.id;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.sharerId !== sharerId) {
      throw new AppError('Not authorised.', 403);
    }

    const participant = await prisma.matchParticipant.update({
      where: { id: participantId },
      data: { status: 'CONFIRMED' },
      include: { commuter: true },
    });

    // Notify commuter
    await sendPushNotification({
      userId: participant.commuterID,
      title: 'You\'re all set!',
      body: `Check the app for your pickup point and OTP.`,
      data: { matchId, type: 'MATCH_CONFIRMED' },
    });

    res.json({ message: 'Confirmed! They\'ll meet you at the pickup point.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/matches/:matchId/decline/:participantId
export async function declineParticipant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { matchId, participantId } = req.params;
    const sharerId = req.user!.id;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.sharerId !== sharerId) throw new AppError('Not authorised.', 403);

    const participant = await prisma.matchParticipant.update({
      where: { id: participantId },
      data: { status: 'CANCELLED' },
    });

    await sendPushNotification({
      userId: participant.commuterID,
      title: 'They had to change plans today',
      body: 'Want to find another commuter on your corridor?',
      data: { type: 'MATCH_DECLINED' },
    });

    res.json({ message: 'No worries — they\'ve been notified.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/matches/:matchId/verify-otp
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { matchId } = req.params;
    const { participantId, otp } = req.body;

    const participant = await prisma.matchParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant || participant.matchId !== matchId) {
      throw new AppError('Participant not found.', 404);
    }
    if (participant.otp !== otp) {
      throw new AppError('That code doesn\'t match — double check and try again.', 400);
    }
    if (participant.otpExpiresAt && new Date() > participant.otpExpiresAt) {
      throw new AppError('This code has expired. Contact the commuter.', 400);
    }

    await prisma.matchParticipant.update({
      where: { id: participantId },
      data: { otpVerified: true, status: 'BOARDED' },
    });

    res.json({ message: 'Verified! Have a great commute.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/matches/:matchId/drop/:participantId
export async function confirmDrop(req: Request, res: Response, next: NextFunction) {
  try {
    const { matchId, participantId } = req.params;

    await prisma.matchParticipant.update({
      where: { id: participantId },
      data: { status: 'DROPPED' },
    });

    // Check if all participants are dropped — if so, complete the match
    const allParticipants = await prisma.matchParticipant.findMany({
      where: { matchId },
    });
    const allDone = allParticipants.every(
      (p) => p.status === 'DROPPED' || p.status === 'NO_SHOW' || p.status === 'CANCELLED'
    );

    if (allDone) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED' },
      });
    }

    res.json({ message: 'Drop confirmed.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/matches/:matchId/summary
export async function getMatchSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        sharer: { select: { id: true, name: true, vehicleModel: true } },
        participants: {
          include: { commuter: { select: { id: true, name: true } } },
          where: { status: { not: 'CANCELLED' } },
        },
      },
    });

    if (!match) throw new AppError('Match not found.', 404);

    const petrolCostPerKm = parseFloat(process.env.DEFAULT_PETROL_COST_PER_KM || '6.5');
    const totalDistKm = match.totalDistanceKm || 30;
    const totalCost = totalDistKm * petrolCostPerKm;

    // Calculate each person's share
    const splits = match.participants.map((p) => {
      const distKm = p.distanceKm || totalDistKm * 0.8;
      const share = p.petrolShare || Math.round((distKm / totalDistKm) * totalCost);
      return {
        userId: p.commuterID,
        name: p.commuter.name,
        share,
        paid: false, // payment tracking in v2
      };
    });

    const sharerShare = Math.max(
      0,
      Math.round(totalCost - splits.reduce((sum, s) => sum + s.share, 0))
    );

    res.json({
      match: {
        id: match.id,
        date: match.date,
        status: match.status,
        sharer: { ...match.sharer, share: sharerShare },
        participants: splits,
        totalDistanceKm: totalDistKm,
        totalPetrolCost: Math.round(totalCost),
      },
    });
  } catch (err) {
    next(err);
  }
}

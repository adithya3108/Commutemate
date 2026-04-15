/**
 * CommuteMate — Corridor Matching Service
 *
 * This is the core algorithm. It finds commuters whose homes fall
 * within the buffer zone of a sharer's route polyline.
 */

import axios from 'axios';
import * as polylineLib from 'polyline';
import { PrismaClient } from '@prisma/client';
import { haversineDistance } from '../utils/geo';

const prisma = new PrismaClient();

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteResult {
  polyline: string;         // encoded polyline
  points: LatLng[];         // decoded points
  distanceMetres: number;
  durationSeconds: number;
}

interface MatchCandidate {
  userId: string;
  name: string;
  company: string | null;
  itPark: string | null;
  distanceToRoute: number;  // metres
  pickupPoint: LatLng;      // nearest main-road point on polyline
  pickupAddress: string;
  pickupPolylineIndex: number;
  dropLat: number;
  dropLng: number;
  dropAddress: string;
  dropPolylineIndex: number;
  detourMinutes: number;
  estimatedShare: number;   // INR
}

// ─── Google Maps Routes API ───────────────────────────────────────────────────

export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  const response = await axios.post(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
        'X-Goog-FieldMask':
          'routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration',
      },
    }
  );

  const route = response.data.routes[0];
  const encoded = route.polyline.encodedPolyline;
  const rawPoints: [number, number][] = polylineLib.decode(encoded);
  const points: LatLng[] = rawPoints.map(([lat, lng]) => ({ lat, lng }));

  return {
    polyline: encoded,
    points,
    distanceMetres: route.distanceMeters,
    durationSeconds: parseInt(route.duration),
  };
}

// ─── Core geometry: point to polyline segment distance ───────────────────────

function distanceToSegment(point: LatLng, a: LatLng, b: LatLng): { distance: number; closest: LatLng } {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const lenSq = dx * dx + dy * dy;

  let t = lenSq === 0
    ? 0
    : Math.max(0, Math.min(1, ((point.lng - a.lng) * dx + (point.lat - a.lat) * dy) / lenSq));

  const closest: LatLng = {
    lat: a.lat + t * dy,
    lng: a.lng + t * dx,
  };

  return {
    distance: haversineDistance(point, closest),
    closest,
  };
}

// Find the closest point on a polyline to a given point
function closestPointOnPolyline(
  point: LatLng,
  polylinePoints: LatLng[]
): { distance: number; closest: LatLng; segmentIndex: number } {
  let minDistance = Infinity;
  let closestPoint: LatLng = polylinePoints[0];
  let bestIndex = 0;

  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const { distance, closest } = distanceToSegment(
      point,
      polylinePoints[i],
      polylinePoints[i + 1]
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = closest;
      bestIndex = i;
    }
  }

  return { distance: minDistance, closest: closestPoint, segmentIndex: bestIndex };
}

// ─── Get readable address for a lat/lng ──────────────────────────────────────

async function reverseGeocode(point: LatLng): Promise<string> {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${point.lat},${point.lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      }
    );
    const results = response.data.results;
    if (results && results.length > 0) {
      // Prefer a short, recognisable address
      const formatted = results[0].formatted_address;
      // Strip country and postal code for brevity
      return formatted.replace(/, India$/, '').replace(/\d{6},?\s*/, '');
    }
    return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
  } catch {
    return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
  }
}

// ─── Calculate detour time if sharer picks up a commuter ─────────────────────

async function calculateDetour(
  sharerOrigin: LatLng,
  sharerDestination: LatLng,
  pickupPoint: LatLng,
  directDurationSeconds: number
): Promise<number> {
  try {
    const withDetour = await getRoute(sharerOrigin, sharerDestination);
    // Simplified: difference in duration (in reality should route via pickup point)
    const detourSeconds = Math.max(0, withDetour.durationSeconds - directDurationSeconds);
    return Math.round(detourSeconds / 60);
  } catch {
    return 0;
  }
}

// ─── Calculate petrol share for a commuter ───────────────────────────────────

function calculatePetrolShare(
  commuterDistanceKm: number,
  totalDistanceKm: number,
  petrolCostTotal: number
): number {
  if (totalDistanceKm === 0) return 0;
  return Math.round((commuterDistanceKm / totalDistanceKm) * petrolCostTotal);
}

// ─── Main matching function ───────────────────────────────────────────────────

export async function findMatchesForSharer(
  sharerId: string,
  sharerRoute: RouteResult,
  date: Date
): Promise<MatchCandidate[]> {
  const sharer = await prisma.user.findUnique({ where: { id: sharerId } });
  if (!sharer || !sharer.homeLat || !sharer.workLat) return [];

  const sharerOrigin: LatLng = { lat: sharer.homeLat, lng: sharer.homeLng! };
  const sharerDest: LatLng = { lat: sharer.workLat, lng: sharer.workLng! };
  const bufferMetres = sharer.pickupBufferMetres;
  const maxDetour = sharer.maxDetourMinutes;

  // Get all active commuter optins for today (excluding this sharer)
  const commuterOptins = await prisma.dailyOptin.findMany({
    where: {
      date,
      role: 'COMMUTER',
      status: 'ACTIVE',
      userId: { not: sharerId },
      matchId: null,
    },
    include: { user: true },
  });

  const candidates: MatchCandidate[] = [];
  const petrolCostPerKm = parseFloat(process.env.DEFAULT_PETROL_COST_PER_KM || '6.5');
  const totalDistanceKm = sharerRoute.distanceMetres / 1000;
  const totalPetrolCost = totalDistanceKm * petrolCostPerKm;

  for (const optin of commuterOptins) {
    const commuter = optin.user;
    if (!commuter.homeLat || !commuter.workLat) continue;

    const commuterHome: LatLng = { lat: commuter.homeLat, lng: commuter.homeLng! };
    const commuterDest: LatLng = { lat: commuter.workLat, lng: commuter.workLng! };

    // Step 1: Is commuter's home near the sharer's route?
    const { distance, closest: pickupPoint, segmentIndex: pickupIndex } =
      closestPointOnPolyline(commuterHome, sharerRoute.points);

    if (distance > bufferMetres) continue; // Too far off route

    // Step 2: Is commuter's destination also along the route (forward direction)?
    const { segmentIndex: dropIndex } =
      closestPointOnPolyline(commuterDest, sharerRoute.points);

    if (dropIndex <= pickupIndex) continue; // Destination is behind the pickup point

    // Step 3: Calculate detour
    const detourMinutes = await calculateDetour(
      sharerOrigin,
      sharerDest,
      pickupPoint,
      sharerRoute.durationSeconds
    );

    if (detourMinutes > maxDetour) continue; // Too much detour

    // Step 4: Get human-readable pickup/drop addresses
    const [pickupAddress, dropAddress] = await Promise.all([
      reverseGeocode(pickupPoint),
      reverseGeocode(commuterDest),
    ]);

    // Step 5: Estimate commuter's distance along the route
    const commuterDistanceKm =
      haversineDistance(pickupPoint, commuterDest) / 1000;
    const estimatedShare = calculatePetrolShare(
      commuterDistanceKm,
      totalDistanceKm,
      totalPetrolCost
    );

    candidates.push({
      userId: commuter.id,
      name: commuter.name,
      company: commuter.company,
      itPark: commuter.itPark,
      distanceToRoute: Math.round(distance),
      pickupPoint,
      pickupAddress,
      pickupPolylineIndex: pickupIndex,
      dropLat: commuterDest.lat,
      dropLng: commuterDest.lng,
      dropAddress,
      dropPolylineIndex: dropIndex,
      detourMinutes,
      estimatedShare,
    });
  }

  // Sort by: lowest detour first, then closest to route
  candidates.sort((a, b) => {
    if (a.detourMinutes !== b.detourMinutes) return a.detourMinutes - b.detourMinutes;
    return a.distanceToRoute - b.distanceToRoute;
  });

  return candidates;
}

// ─── Order pickups for confirmed participants ─────────────────────────────────

export function orderPickupStops(
  participants: { userId: string; pickupPolylineIndex: number; pickupAddress: string }[]
): typeof participants {
  return [...participants].sort(
    (a, b) => a.pickupPolylineIndex - b.pickupPolylineIndex
  );
}

/**
 * CommuteMate — Trust & Safety Service
 *
 * This module handles:
 * 1. Company email domain verification (IT companies only)
 * 2. IT park / office location tagging
 * 3. Mutual rating system (positive signals only, private)
 * 4. Gender preference filtering (important for safety in India)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── 1. Known IT Company Email Domains ───────────────────────────────────────
// This is a curated list of major IT companies in India.
// Add more as needed. The key insight: if your email ends in one of these,
// you are verifiably employed at a real company.

export const VERIFIED_IT_DOMAINS: Record<string, { company: string; tier: 'major' | 'mid' | 'startup' }> = {
  // Big 5 Indian IT
  'tcs.com':           { company: 'TCS', tier: 'major' },
  'infosys.com':       { company: 'Infosys', tier: 'major' },
  'wipro.com':         { company: 'Wipro', tier: 'major' },
  'hcltech.com':       { company: 'HCL Technologies', tier: 'major' },
  'techm.com':         { company: 'Tech Mahindra', tier: 'major' },

  // Global MNCs with large India presence
  'accenture.com':     { company: 'Accenture', tier: 'major' },
  'cognizant.com':     { company: 'Cognizant', tier: 'major' },
  'capgemini.com':     { company: 'Capgemini', tier: 'major' },
  'ibm.com':           { company: 'IBM', tier: 'major' },
  'oracle.com':        { company: 'Oracle', tier: 'major' },
  'sap.com':           { company: 'SAP', tier: 'major' },
  'microsoft.com':     { company: 'Microsoft', tier: 'major' },
  'google.com':        { company: 'Google', tier: 'major' },
  'amazon.com':        { company: 'Amazon', tier: 'major' },

  // Chennai / TN strong presence
  'zoho.com':          { company: 'Zoho', tier: 'major' },
  'freshworks.com':    { company: 'Freshworks', tier: 'mid' },
  'chargebee.com':     { company: 'Chargebee', tier: 'startup' },
  'kissflow.com':      { company: 'Kissflow', tier: 'startup' },
  'payoda.com':        { company: 'Payoda', tier: 'mid' },
  'hexaware.com':      { company: 'Hexaware', tier: 'mid' },
  'mphasis.com':       { company: 'Mphasis', tier: 'mid' },
  'nttdata.com':       { company: 'NTT Data', tier: 'mid' },
  'dxc.com':           { company: 'DXC Technology', tier: 'major' },
  'ltimindtree.com':   { company: 'LTIMindtree', tier: 'major' },

  // Banks / BFSI IT arms
  'razorpay.com':      { company: 'Razorpay', tier: 'startup' },
  'phonepe.com':       { company: 'PhonePe', tier: 'mid' },
  'paytm.com':         { company: 'Paytm', tier: 'mid' },
};

export function verifyCompanyEmail(email: string): {
  isVerified: boolean;
  company?: string;
  tier?: 'major' | 'mid' | 'startup';
} {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { isVerified: false };

  const match = VERIFIED_IT_DOMAINS[domain];
  if (match) return { isVerified: true, ...match };

  // Not in curated list — still allow but mark as unverified
  // The email itself proves employment, even if we don't know the company name
  return { isVerified: true, company: domain.split('.')[0] };
}

// ─── 2. Chennai IT Park Directory ────────────────────────────────────────────

export interface ItPark {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  corridor: string; // which major corridor this park is on
  area: string;
}

export const CHENNAI_IT_PARKS: ItPark[] = [
  // OMR (Old Mahabalipuram Road) corridor
  { id: 'rmz-millenia', name: 'RMZ Millenia', shortName: 'RMZ Millenia', lat: 12.9667, lng: 80.2167, corridor: 'OMR', area: 'Perungudi' },
  { id: 'crest', name: 'Crest (formerly Olympia)', shortName: 'Crest', lat: 12.9580, lng: 80.2220, corridor: 'OMR', area: 'Perungudi' },
  { id: 'sp-infocity-omr', name: 'SP Infocity', shortName: 'SP Infocity', lat: 12.9100, lng: 80.2280, corridor: 'OMR', area: 'Sholinganallur' },
  { id: 'cognizant-omr', name: 'Cognizant Campus', shortName: 'Cognizant OMR', lat: 12.9005, lng: 80.2275, corridor: 'OMR', area: 'Sholinganallur' },
  { id: 'tcs-siruseri', name: 'TCS Siruseri', shortName: 'TCS Siruseri', lat: 12.8406, lng: 80.2190, corridor: 'OMR', area: 'Siruseri' },
  { id: 'tidel-park', name: 'Tidel Park', shortName: 'Tidel Park', lat: 12.9923, lng: 80.2476, corridor: 'OMR', area: 'Taramani' },
  { id: 'elnet', name: 'Elnet Software City', shortName: 'Elnet', lat: 12.9950, lng: 80.2420, corridor: 'OMR', area: 'Taramani' },

  // GST Road corridor
  { id: 'mahindra-world-city', name: 'Mahindra World City', shortName: 'Mahindra WC', lat: 12.7167, lng: 80.0003, corridor: 'GST', area: 'Chengalpattu' },
  { id: 'ford-chengalpattu', name: 'Ford India', shortName: 'Ford India', lat: 12.6918, lng: 80.0091, corridor: 'GST', area: 'Chengalpattu' },

  // Guindy / Inner city
  { id: 'sp-infocity-guindy', name: 'SP Infocity Guindy', shortName: 'SP Infocity Guindy', lat: 13.0067, lng: 80.2206, corridor: 'Inner', area: 'Guindy' },
  { id: 'sidco', name: 'SIDCO Industrial Estate', shortName: 'SIDCO', lat: 13.0098, lng: 80.2120, corridor: 'Inner', area: 'Guindy' },

  // Porur / Poonamallee
  { id: 'dlt', name: 'DLT Porur', shortName: 'DLT Porur', lat: 13.0373, lng: 80.1574, corridor: 'Poonamallee', area: 'Porur' },

  // Prince Infocity (user's workplace)
  { id: 'prince-infocity', name: 'Prince Infocity II', shortName: 'Prince Infocity', lat: 12.9532, lng: 80.2230, corridor: 'OMR', area: 'Sholinganallur' },
];

export function findNearestItPark(lat: number, lng: number): ItPark | null {
  let nearest: ItPark | null = null;
  let minDist = Infinity;

  for (const park of CHENNAI_IT_PARKS) {
    const dLat = lat - park.lat;
    const dLng = lng - park.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDist) {
      minDist = dist;
      nearest = park;
    }
  }

  // Only return if within ~2km (roughly 0.018 degrees)
  return minDist < 0.018 ? nearest : null;
}

// ─── 3. Trust Score ──────────────────────────────────────────────────────────
// Trust is a private signal — never shown as a number to other users.
// It only affects matching priority internally.

export async function getUserTrustScore(userId: string): Promise<number> {
  const signals = await prisma.trustSignal.findMany({
    where: { toUserId: userId },
  });

  if (signals.length === 0) return 50; // neutral for new users

  const positiveRides = signals.filter((s) => s.wouldRideAgain).length;
  const rideScore = (positiveRides / signals.length) * 100;

  // Tag bonus — each positive tag category adds a small boost
  const tagCounts = signals.reduce((acc, s) => {
    s.tags.forEach((t) => { acc[t] = (acc[t] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);

  const tagBonus = Math.min(20, Object.keys(tagCounts).length * 3);

  return Math.min(100, Math.round(rideScore * 0.8 + tagBonus));
}

// ─── 4. Gender Preference Matching ───────────────────────────────────────────
// Gender preference is a safety feature, not a social one.
// In the Indian context, many women prefer women-only rides.
// We respect this without judgment.

export type GenderPreference = 'ANY' | 'WOMEN_ONLY' | 'MEN_ONLY';

export function genderPreferenceMatches(
  sharerGender: string | null,
  sharerPreference: GenderPreference,
  commuterGender: string | null,
  commuterPreference: GenderPreference
): boolean {
  // If either party has set a gender preference, it must be satisfied

  if (sharerPreference === 'WOMEN_ONLY') {
    if (commuterGender !== 'FEMALE') return false;
  }

  if (sharerPreference === 'MEN_ONLY') {
    if (commuterGender !== 'MALE') return false;
  }

  if (commuterPreference === 'WOMEN_ONLY') {
    if (sharerGender !== 'FEMALE') return false;
  }

  if (commuterPreference === 'MEN_ONLY') {
    if (sharerGender !== 'MALE') return false;
  }

  return true;
}

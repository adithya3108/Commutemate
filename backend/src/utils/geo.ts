// Haversine formula — great-circle distance between two lat/lng points
// Returns distance in metres

interface LatLng { lat: number; lng: number; }

const EARTH_RADIUS_M = 6371000;

export function haversineDistance(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Check if a point is within radius metres of any point in a polyline
export function isNearPolyline(
  point: LatLng,
  polyline: LatLng[],
  radiusMetres: number
): boolean {
  return polyline.some((p) => haversineDistance(point, p) <= radiusMetres);
}

/**
 * Utility functions for geospatial operations
 */

/**
 * Parse WKB point to extract lon/lat
 */
export function parseWkbPoint(wkb: any): [number, number] | null {
  try {
    if (!wkb) return null;
    const buffer = wkb instanceof ArrayBuffer ? wkb : (wkb.buffer || wkb);
    const view = new DataView(buffer, wkb.byteOffset || 0, wkb.byteLength || buffer.byteLength);
    const isLittleEndian = view.getUint8(0) === 1;
    const lon = view.getFloat64(5, isLittleEndian);
    const lat = view.getFloat64(13, isLittleEndian);
    return [lon, lat];
  } catch {
    return null;
  }
}

/**
 * Create distance predicate for spatial brushing
 * Used for brush mode filtering
 */
export function createDistancePredicate(
  lon: number,
  lat: number,
  radius: number
): string {
  const latRad = Math.cos((Math.PI / 180) * lat);
  const radiusSq = radius * radius;
  return `(
    pow((longitude - ${lon}) * ${111320 * latRad}, 2) +
    pow((latitude - ${lat}) * ${111320}, 2)
  ) < ${radiusSq}`;
}

/**
 * Calculate distance between two points (Haversine formula)
 * Useful for brush radius calculations
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


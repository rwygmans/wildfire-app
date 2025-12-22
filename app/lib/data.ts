/**
 * Wildfire-specific data parsing and queries
 */

import { parseWkbPoint } from './utils';

/**
 * Convert string to title case (e.g., "LONE CREEK" -> "Lone Creek")
 */
function toTitleCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

// Parsed wildfire data structure for binary ScatterplotLayer
export interface WildfireData {
  length: number;
  positions: Float64Array;
  acres: Float32Array;
  times: BigInt64Array;
  causes: string[];  // Array of cause strings for color mapping
  names: string[];   // Array of fire names for tooltips
}

/**
 * Parse DuckDB Arrow result to typed arrays for wildfires
 */
export function parseQueryResult(result: any): WildfireData | null {
  const numRows = result.numRows;
  if (numRows === 0) return null;

  const positions = new Float64Array(numRows * 2);
  const acres = new Float32Array(numRows);
  const times = new BigInt64Array(numRows);
  const causes: string[] = [];
  const names: string[] = [];

  const wkbCol = result.getChild('wkb_geometry');
  const acresCol = result.getChild('Acres');
  const timeCol = result.getChild('DateTime');
  const causeCol = result.getChild('Cause');
  const nameCol = result.getChild('FireName');

  for (let i = 0; i < numRows; i++) {
    const coords = parseWkbPoint(wkbCol?.get(i));
    if (coords) {
      positions[i * 2] = coords[0];
      positions[i * 2 + 1] = coords[1];
    }
    acres[i] = acresCol?.get(i) ?? 0;
    const t = timeCol?.get(i);
    times[i] = typeof t === 'bigint' ? t : BigInt(t ?? 0);
    causes[i] = causeCol?.get(i) ?? 'Unknown';
    names[i] = toTitleCase(nameCol?.get(i) ?? '');
  }

  return { length: numRows, positions, acres, times, causes, names };
}


/**
 * Wildfire-specific color scales
 */

/**
 * Color scale for wildfire cause
 * Natural = green, Human = red, Undetermined = gray
 */
export function getCauseColor(cause: string): [number, number, number, number] {
  switch (cause) {
    case 'Natural':
      return [34, 139, 34, 140];      // Forest green - natural causes
    case 'Human':
      return [220, 20, 60, 140];      // Crimson - human causes
    case 'Undetermined':
      return [128, 128, 128, 120];    // Gray - undetermined
    default:
      return [169, 169, 169, 100];    // Dark gray - unknown
  }
}


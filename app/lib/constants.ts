/**
 * Wildfire app-specific constants
 * 
 * Uses wildfires-lite.parquet which is pre-filtered and pre-computed:
 * - Only WF incidents with Acres > 5
 * - Pre-computed: Acres, Cause, CauseID, Month, Year
 * - Only 9 columns instead of 88 (6 MB vs 145 MB)
 */

// DuckDB WASM configuration
export const DUCKDB_CONFIG = {
  workerPath: '/duckdb/duckdb-browser-eh.worker.js',
  wasmPath: '/duckdb/duckdb-eh.wasm',
};

// Initial map view state (centered on contiguous US)
export const INITIAL_VIEW_STATE_US = {
  longitude: -98.5,
  latitude: 39.8,
  zoom: 4,
  pitch: 0,
  bearing: 0,
};

// Filter settings (data is already pre-filtered in lite parquet)
export const MIN_ACRES = 5;

// Simple query - lite parquet already has pre-computed columns
export const BASE_QUERY = `
  SELECT 
    ST_AsWKB(ST_Point(longitude, latitude)) as wkb_geometry,
    "DateTime",
    "Acres",
    "FireName",
    "Cause"
  FROM wildfires
`;

export const PARQUET_URL = '/wildfires-lite.parquet';
export const TABLE_NAME = 'wildfires';

// Simple table creation - lite parquet has all columns pre-computed
export const MOSAIC_TABLE_QUERY = (parquetUrl: string, whereClause?: string) => `
  CREATE OR REPLACE TABLE ${TABLE_NAME} AS
  SELECT 
    "DateTime",
    "Month",
    "Year",
    latitude AS "Latitude",
    longitude AS "Longitude",
    "Acres",
    "FireName",
    "Cause",
    "CauseID"
  FROM read_parquet('${parquetUrl}')
  ${whereClause ? `WHERE ${whereClause}` : ''}
`;

// Size filter thresholds for SQL
export const SIZE_THRESHOLDS: Record<string, { min: number; max: number }> = {
  small: { min: 0, max: 100 },
  medium: { min: 100, max: 1000 },
  large: { min: 1000, max: 10000 },
  major: { min: 10000, max: 999999999 },
};

// Build SQL WHERE clause from filter state
export function buildFilterWhereClause(
  showNatural: boolean,
  showHuman: boolean,
  showUndetermined: boolean,
  sizeFilters: Set<string>
): string | undefined {
  const clauses: string[] = [];
  
  // Cause filter
  const causeClauses: string[] = [];
  if (showNatural) causeClauses.push(`"Cause" = 'Natural'`);
  if (showHuman) causeClauses.push(`"Cause" = 'Human'`);
  if (showUndetermined) causeClauses.push(`"Cause" = 'Undetermined'`);
  if (showUndetermined) causeClauses.push(`"Cause" = 'Unknown'`); // Group Unknown with Undetermined
  
  if (causeClauses.length > 0 && causeClauses.length < 4) {
    clauses.push(`(${causeClauses.join(' OR ')})`);
  } else if (causeClauses.length === 0) {
    return '1=0'; // No causes selected = no data
  }
  
  // Size filter
  if (sizeFilters.size > 0 && sizeFilters.size < 4) {
    const sizeClauses = [...sizeFilters].map(size => {
      const { min, max } = SIZE_THRESHOLDS[size];
      return `("Acres" >= ${min} AND "Acres" < ${max})`;
    });
    clauses.push(`(${sizeClauses.join(' OR ')})`);
  } else if (sizeFilters.size === 0) {
    return '1=0'; // No sizes selected = no data
  }
  
  return clauses.length > 0 ? clauses.join(' AND ') : undefined;
}

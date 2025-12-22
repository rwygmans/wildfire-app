/**
 * Mosaic initialization helpers
 */

import {
  coordinator,
  wasmConnector
} from '@uwdata/vgplot';

/**
 * Initialize Mosaic coordinator with DuckDB
 */
export async function initMosaic(parquetUrl: string, tableQuery: string): Promise<void> {
  const coord = coordinator();
  
  try {
    // Use wasmConnector which creates its own DuckDB instance
    coord.databaseConnector(wasmConnector());
  } catch (e) {
    console.warn('Connector already set:', e);
  }
  
  // Load spatial extension for ST_AsWKB and ST_Point functions
  try {
    await coord.exec('INSTALL spatial; LOAD spatial;');
  } catch (e) {
    console.warn('Spatial extension install failed:', e);
  }
  
  // Create table from parquet
  await coord.exec(tableQuery);
}


/**
 * DuckDB initialization helpers
 */

import * as duckdb from '@duckdb/duckdb-wasm';
import { DUCKDB_CONFIG } from '../constants';

export interface DuckDBConnection {
  db: duckdb.AsyncDuckDB;
  conn: duckdb.AsyncDuckDBConnection;
}

/**
 * Initialize DuckDB with spatial extension
 */
export async function initDuckDB(): Promise<DuckDBConnection> {
  const workerUrl = `${window.location.origin}${DUCKDB_CONFIG.workerPath}`;
  const wasmUrl = `${window.location.origin}${DUCKDB_CONFIG.wasmPath}`;
  
  const worker = new Worker(workerUrl, { type: 'module' });
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  
  await db.instantiate(wasmUrl);
  
  const conn = await db.connect();
  try {
    await conn.query('INSTALL spatial; LOAD spatial;');
  } catch (e) {
    console.warn('Spatial extension install failed:', e);
  }

  return { db, conn };
}


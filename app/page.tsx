'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/mapbox';
import { Eye, Paintbrush, Info } from 'lucide-react';
import {
  coordinator,
  Selection,
} from '@uwdata/vgplot';
import { makeClient } from '@uwdata/mosaic-core';
import { Query, sql } from '@uwdata/mosaic-sql';
import { initDuckDB } from './lib/duckdb/init';
import { initMosaic as initMosaicHelper } from './lib/mosaic/init';
import { INITIAL_VIEW_STATE_US } from './lib/constants';
import { ChartPanel } from './components/ChartPanel';
import { parseQueryResult, type WildfireData } from './lib/data';
import { getCauseColor } from './lib/colors';
import { BASE_QUERY, PARQUET_URL, TABLE_NAME, MOSAIC_TABLE_QUERY } from './lib/constants';

const INITIAL_VIEW_STATE = INITIAL_VIEW_STATE_US;

export default function WildfirePage() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [data, setData] = useState<WildfireData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [syncBrush, setSyncBrush] = useState(true);
  const [brushRadius, setBrushRadius] = useState(50000);
  const [showInfo, setShowInfo] = useState(false);
  
  // Crossfilter selection for linked views (brush interactions)
  const crossfilterRef = useRef<Selection | null>(null);
  const mosaicClientRef = useRef<any>(null);
  
  const dbRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const lastHoverTime = useRef<number>(0);
  
  // Create crossfilter on mount
  if (!crossfilterRef.current) {
    crossfilterRef.current = Selection.crossfilter();
  }

  // Load all map data
  const loadAllData = useCallback(async () => {
    if (!connRef.current) return;
    try {
      const result = await connRef.current.query(BASE_QUERY);
      const parsed = parseQueryResult(result);
      if (parsed) {
        console.log(`Loaded ${parsed.length} wildfires`);
        setData(parsed);
      }
      // Clear crossfilter
      if (crossfilterRef.current && mosaicClientRef.current) {
        crossfilterRef.current.update({
          source: mosaicClientRef.current,
          value: null,
          predicate: null
        });
      }
    } catch (error) {
      console.error('Query error:', error);
    }
  }, []);


  // Initialize DuckDB and Mosaic
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Set parquet URL before Mosaic init
        const parquetUrl = `${window.location.origin}${PARQUET_URL}`;
        
        // Initialize Mosaic coordinator
        await initMosaicHelper(parquetUrl, MOSAIC_TABLE_QUERY(parquetUrl));
        
        // Also init our own DuckDB connection for map queries
        const { db, conn } = await initDuckDB();

        if (!mounted) return;

        dbRef.current = db;
        connRef.current = conn;

        // Create table from lite parquet (already pre-filtered and pre-computed)
        try {
          await conn.query(MOSAIC_TABLE_QUERY(parquetUrl));
          
          const countResult = await conn.query(`SELECT COUNT(*) as cnt FROM ${TABLE_NAME}`);
          const count = countResult.toArray()[0]?.cnt || 0;
          console.log(`Table ${TABLE_NAME} created with ${count.toLocaleString()} records`);
        } catch (tableError: any) {
          console.error('Error creating table:', tableError);
          throw tableError;
        }

        // Load map data
        try {
          const result = await conn.query(BASE_QUERY);
          console.log(`Query returned ${result.numRows} rows`);
          
          if (result.numRows === 0) {
            console.warn('No data returned from BASE_QUERY. Check filters and Parquet file.');
          }
          
          const parsed = parseQueryResult(result);
          
          if (parsed && mounted) {
            console.log(`Loaded ${parsed.length} wildfires`);
            setData(parsed);
          } else if (mounted) {
            console.warn('parseQueryResult returned null or empty data');
          }
        } catch (queryError: any) {
          console.error('Error executing BASE_QUERY:', queryError);
          console.error('Query was:', BASE_QUERY);
          throw queryError;
        }
        
        // Create a Mosaic client for map that responds to crossfilter changes
        const coord = coordinator();
        mosaicClientRef.current = makeClient({
          coordinator: coord,
          selection: crossfilterRef.current!,
          query: (filter: any) => Query.from(TABLE_NAME)
            .select({
              wkb_geometry: sql`ST_AsWKB(ST_Point("Longitude", "Latitude"))`
            }, 'Latitude', 'Longitude', 'Acres', 'DateTime', 'Cause', 'FireName')
            .where(filter),
          queryResult: (result: any) => {
            // Update map data when crossfilter selection changes
            if (!result) return;
            const wkbCol = result.getChild('wkb_geometry');
            if (wkbCol) {
              const parsed = parseQueryResult(result);
              if (parsed) {
                console.log(`Crossfilter updated: ${parsed.length} wildfires`);
                setData(parsed);
              }
            }
          }
        });
        
        setIsReady(true);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Initialization error:', error);
        console.error('Error details:', error?.message, error?.stack);
        setIsLoading(false);
        // Set error state so user knows something went wrong
        if (mounted) {
          setData(null);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (connRef.current) {
        connRef.current.close();
      }
      if (mosaicClientRef.current) {
        coordinator().disconnect(mosaicClientRef.current);
      }
    };
  }, []);



  // Create ScatterplotLayer with binary data
  const layer = useMemo(() => {
    if (!data) return null;

    const colors = new Uint8Array(data.length * 4);
    const radii = new Float32Array(data.length);

    for (let i = 0; i < data.length; i++) {
      const cause = data.causes[i];
      const acres = data.acres[i];
      const color = getCauseColor(cause);
      
      colors[i * 4] = color[0];
      colors[i * 4 + 1] = color[1];
      colors[i * 4 + 2] = color[2];
      colors[i * 4 + 3] = color[3];
      radii[i] = Math.sqrt(Math.max(acres, 5)) * 0.1;
    }

    return new ScatterplotLayer({
      id: 'wildfires',
      data: {
        length: data.length,
        attributes: {
          getPosition: { value: data.positions, size: 2 },
          getFillColor: { value: colors, size: 4 },
          getRadius: { value: radii, size: 1 },
        },
      },
      radiusScale: Math.pow(2, Math.max(14 - viewState.zoom, 0)),
      radiusMinPixels: 1,
      radiusMaxPixels: 20,
      pickable: !isBrushMode,
      stroked: true,
      getLineColor: [140, 140, 140, 90],
      lineWidthMinPixels: 1,
    });
  }, [data, isBrushMode, viewState.zoom]);

  // Handle map hover for brushing
  const handleHover = useCallback(async (info: any) => {
    if (!info.coordinate || !isBrushMode || !crossfilterRef.current || !syncBrush || !mosaicClientRef.current) return;
    
    const now = Date.now();
    if (now - lastHoverTime.current < 50) return;
    lastHoverTime.current = now;

    const [lon, lat] = info.coordinate;
    const latRad = Math.cos((Math.PI / 180) * lat);
    const radiusSq = brushRadius * brushRadius;
    
    // Distance filter for brushing (using Mosaic SQL template)
    const predicate = sql`(
      pow(("Longitude" - ${lon}) * ${111320 * latRad}, 2) +
      pow(("Latitude" - ${lat}) * ${111320}, 2)
    ) < ${radiusSq}`;

    // Update crossfilter selection - this triggers all connected clients
    crossfilterRef.current.update({
      source: mosaicClientRef.current,
      value: [lon, lat, brushRadius],
      predicate
    });
  }, [isBrushMode, syncBrush, brushRadius]);

  const getTooltip = useCallback((info: any) => {
    // Only show tooltip in View mode, not Brush mode
    if (isBrushMode) return null;
    
    // With binary attributes, check for valid index
    const index = info.index;
    if (index === undefined || index === null || index < 0) return null;
    if (!data || index >= data.length) return null;
    
    const acres = data.acres[index];
    const time = data.times[index];
    const cause = data.causes[index];
    const name = data.names[index];
    
    const formattedAcres = Number(acres).toLocaleString('en-US', {
      maximumFractionDigits: 0
    });
    
    const formattedDate = time 
      ? new Date(Number(time)).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'Date unknown';
    
    return {
      html: `
        <div style="font-family:system-ui; font-size:12px; padding:6px; line-height:1.5;">
          ${name ? `<strong style="font-size:13px;">${name}</strong><br/>` : ''}
          <strong>${formattedAcres} acres</strong><br/>
          <span style="color:#666;">Cause: ${cause}</span><br/>
          <span style="color:#666;">${formattedDate}</span>
        </div>
      `,
    };
  }, [isBrushMode, data]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: '#1b1a18' }}>
      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            color: 'white',
            gap: 12,
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '4px solid rgba(255, 255, 255, 0.2)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span>Loading wildfires...</span>
          </div>
        )}
        
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState }: any) => setViewState(viewState)}
          controller={true}
          layers={layer ? [layer] : []}
          onHover={handleHover}
          getTooltip={getTooltip}
          style={{ width: '100%', height: '100%' }}
        >
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            projection={{ name: 'mercator' }}
            reuseMaps
          />
        </DeckGL>

        {/* Control Panel */}
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          backgroundColor: 'rgba(31, 29, 27, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: 12,
          borderRadius: 4,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          width: 220,
        }}>
          {isReady && (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setIsBrushMode(false);
                    loadAllData();
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: 8,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: !isBrushMode ? '#dc2626' : 'transparent',
                    color: !isBrushMode ? 'white' : '#cbd5e1',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (isBrushMode) {
                      e.currentTarget.style.backgroundColor = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isBrushMode) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>
                <button
                  onClick={() => setIsBrushMode(true)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: 8,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isBrushMode ? '#dc2626' : 'transparent',
                    color: isBrushMode ? 'white' : '#cbd5e1',
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isBrushMode) {
                      e.currentTarget.style.backgroundColor = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isBrushMode) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Paintbrush size={16} />
                  <span>Brush</span>
                </button>
                <button
                  onClick={() => setShowInfo(true)}
                  style={{
                    padding: 8,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: '#cbd5e1',
                    fontSize: 14,
                    transition: 'background-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  <Info size={16} />
                </button>
              </div>

              {isBrushMode && (
                <>
                  <button
                    onClick={() => {
                      const newSync = !syncBrush;
                      setSyncBrush(newSync);
                      if (!newSync) {
                        loadAllData();
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: '#cbd5e1',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                    }}
                  >
                    {syncBrush ? '✓' : '○'} Sync brush with charts
                  </button>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', marginBottom: 8 }}>
                      <span>Radius</span>
                      <span>{(brushRadius / 1000).toFixed(0)} km</span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="300000"
                      step="5000"
                      value={brushRadius}
                      onChange={(e) => setBrushRadius(Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: 4,
                        borderRadius: 2,
                        cursor: 'pointer',
                        accentColor: '#dc2626',
                      }}
                    />
                  </div>
                </>
              )}
              
            </>
          )}
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              backgroundColor: '#1f1d1b',
              color: '#e2e8f0',
              padding: 24,
              borderRadius: 6,
              width: 384,
              border: '1px solid #374151',
            }}>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                <p style={{ marginBottom: 12 }}>
                  This is an experimental interface showing linked visual exploration across maps and charts.
                  Interactions on the map and histograms update each other in real time.
                </p>
                <p style={{ marginBottom: 12 }}>
                  The app is built using DeckGL, Mosaic, DuckDB-WASM and GeoArrow for all analytical queries.
                  All filtering happens locally in the browser with no backend involved.
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>
                  {data ? `Currently showing ${data.length.toLocaleString()} wildfires (FinalAcres > 5, Type: Wildfire)` : 'Loading...'}
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  marginTop: 20,
                  width: '100%',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Charts Sidebar */}
      <div style={{
        width: 420,
        height: '100%',
        backgroundColor: '#f3efe7',
        borderLeft: '1px solid #2a2825',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {isReady && crossfilterRef.current ? (
          <ChartPanel crossfilter={crossfilterRef.current} />
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '4px solid rgba(148, 163, 184, 0.2)',
              borderTop: '4px solid #000000',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}


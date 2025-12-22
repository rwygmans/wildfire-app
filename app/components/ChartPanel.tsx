'use client';

import { useEffect, useMemo, useState, memo } from 'react';
import { Selection } from '@uwdata/vgplot';
import * as vg from '@uwdata/vgplot';
import { PlotWrapper } from '../lib/components/PlotWrapper';
import { CollapsibleSection } from '../lib/components/CollapsibleSection';
import { LoadingPlaceholder } from '../lib/components/LoadingPlaceholder';

/**
 * Chart Panel Component using Mosaic plots for wildfires
 */
export const ChartPanel = memo(function ChartPanel({ 
  crossfilter 
}: { 
  crossfilter: Selection;
}) {
  const [ready, setReady] = useState(false);
  
  // Log when component mounts
  useEffect(() => {
    console.log('ChartPanel mounted/remounted');
    return () => console.log('ChartPanel unmounting');
  }, []);
  
  // Colors matching source app exactly
  const bgColor = '#f5d9a6';  // tan background
  const fgColor = '#dc2626';  // red foreground for fires
  
  // Seasonality (Month) Histogram - Exactly 12 bars, one per month with abbreviations
  const monthPlot = useMemo(() => {
    const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return vg.plot(
      vg.rectY(vg.from('wildfires'), {
        x: vg.bin('Month', { maxbins: 12, domain: [0.5, 12.5] }),
        y: vg.count(),
        fill: bgColor,
        inset: 0,
        stroke: 'none'
      }),
      vg.rectY(vg.from('wildfires', { filterBy: crossfilter }), {
        x: vg.bin('Month', { maxbins: 12, domain: [0.5, 12.5] }),
        y: vg.count(),
        fill: fgColor,
        inset: 0,
        stroke: 'none'
      }),
      vg.intervalX({ as: crossfilter }),
      vg.xLabel('Month'),
      vg.yLabel(null),
      vg.yAxis(null),
      vg.xDomain([0.5, 12.5]),
      vg.xTicks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), // Center of each bar (bins are 0.5-1.5, 1.5-2.5, etc., centers at 1, 2, etc.)
      vg.xTickFormat((d: number) => {
        const month = Math.round(d);
        return month >= 1 && month <= 12 ? monthAbbr[month - 1] : '';
      }),
      vg.xTickRotate(-45), // Rotate labels diagonally downward
      vg.height(180),
      vg.width(380),
      vg.margins({ left: 0, right: 10, top: 10, bottom: 45 }) // Increased bottom margin for rotated labels
    );
  }, [crossfilter, bgColor, fgColor]);
  
  // Temporal Frequency (Year) Histogram - Start at 1990
  const timePlot = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 1990;
    return vg.plot(
      vg.rectY(vg.from('wildfires'), {
        x: vg.bin('Year', { maxbins: 50 }),
        y: vg.count(),
        fill: bgColor,
        inset: 0,
        stroke: 'none'
      }),
      vg.rectY(vg.from('wildfires', { filterBy: crossfilter }), {
        x: vg.bin('Year', { maxbins: 50 }),
        y: vg.count(),
        fill: fgColor,
        inset: 0,
        stroke: 'none'
      }),
      vg.intervalX({ as: crossfilter }),
      vg.xLabel('Year'),
      vg.yLabel(null),
      vg.yAxis(null),
      vg.xDomain([startYear, currentYear + 1]),
      vg.xTicks([1990, 2000, 2010, 2020]),
      vg.xTickFormat('d'),
      vg.height(180),
      vg.width(380),
      vg.margins({ left: 20, right: 10, top: 10, bottom: 30 })
    );
  }, [crossfilter, bgColor, fgColor]);
  
  // Fire Cause Distribution Bar Chart - Horizontal bars with colors matching map
  // Colors: Natural=green, Human=red, Undetermined=gray
  const causeColors: Record<string, string> = {
    'Natural': 'rgb(34, 139, 34)',      // Forest green
    'Human': 'rgb(220, 20, 60)',        // Crimson  
    'Undetermined': 'rgb(128, 128, 128)' // Gray
  };
  
  const causePlot = useMemo(() => 
    vg.plot(
      // Background: all data, muted colors (same hue, lower opacity)
      vg.barX(vg.from('wildfires'), {
        y: 'Cause',
        x: vg.count(),
        fill: 'Cause',
        fillOpacity: 0.25,
        stroke: 'none',
        inset: 0.5
      }),
      // Foreground: filtered data, full colors
      vg.barX(vg.from('wildfires', { filterBy: crossfilter }), {
        y: 'Cause',
        x: vg.count(),
        fill: 'Cause',
        stroke: 'none',
        inset: 0.5
      }),
      vg.colorDomain(['Natural', 'Undetermined', 'Human']),
      vg.colorRange([causeColors['Natural'], causeColors['Undetermined'], causeColors['Human']]),
      vg.toggleY({ as: crossfilter }),
      vg.xLabel(null),
      vg.yLabel(null),
      vg.xAxis(null),
      vg.yDomain(['Natural', 'Undetermined', 'Human']),
      vg.height(120),
      vg.width(380),
      vg.margins({ left: 90, right: 10, top: 10, bottom: 10 })
    ),
  [crossfilter]);
  
  // Delay rendering to allow coordinator to connect
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: '#f3efe7', 
      color: '#1e293b' 
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        <CollapsibleSection title="Seasonal Pattern">
          {ready ? (
            <PlotWrapper plot={monthPlot} />
          ) : (
            <LoadingPlaceholder h={180} />
          )}
        </CollapsibleSection>
        
        <CollapsibleSection title="Temporal Frequency">
          {ready ? (
            <PlotWrapper plot={timePlot} />
          ) : (
            <LoadingPlaceholder h={180} />
          )}
        </CollapsibleSection>
        
        <CollapsibleSection title="Fire Cause Distribution">
          {ready ? (
            <PlotWrapper plot={causePlot} />
          ) : (
            <LoadingPlaceholder h={180} />
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
});


'use client';

import { useEffect, useRef } from 'react';

/**
 * Plot wrapper component for Mosaic plots
 */
export function PlotWrapper({ plot, style }: { plot: any; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = ref.current;
    if (container && plot) {
      Promise.resolve(plot).then((el: HTMLElement) => {
        container.innerHTML = '';
        if (el) container.appendChild(el);
      });
      return () => {
        if (container) container.innerHTML = '';
      };
    }
  }, [plot]);
  
  return <div ref={ref} style={style} />;
}


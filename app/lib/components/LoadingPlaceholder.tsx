'use client';

/**
 * Loading placeholder component
 */
export function LoadingPlaceholder({ h }: { h: number }) {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: h, 
        borderRadius: 4, 
        backgroundColor: 'rgba(148, 163, 184, 0.3)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }} 
    />
  );
}


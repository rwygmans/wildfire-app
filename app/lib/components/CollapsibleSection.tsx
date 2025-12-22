'use client';

import { useState } from 'react';

/**
 * Collapsible section component for chart panels
 */
export function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.6)',
      border: '1px solid #d8d2c7',
      borderRadius: 2,
      marginBottom: 8,
      padding: '0 8px',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#334155',
        }}
      >
        {title}
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: 16, overflow: 'hidden', display: 'flex' }}>
          {children}
        </div>
      )}
    </div>
  );
}


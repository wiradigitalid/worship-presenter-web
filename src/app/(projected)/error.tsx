'use client';

import type { CSSProperties } from 'react';
import { useEffect } from 'react';

const surfaceStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  overflowY: 'auto',
  backgroundColor: '#000000',
  color: '#FFFFFF',
};

const contentStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100%',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4rem 3rem',
  textAlign: 'center',
};

export default function ProjectedError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error('Projected route failed:', error);
  }, [error]);

  return (
    <main style={surfaceStyle}>
      <div style={contentStyle}>
        <h1>Slides unavailable</h1>
        <p>The projected view encountered an error. Ask the operator to reload it.</p>
      </div>
    </main>
  );
}

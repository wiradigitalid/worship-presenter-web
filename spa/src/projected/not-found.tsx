import type { CSSProperties } from 'react';

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

export default function ProjectedNotFound() {
  return (
    <main style={surfaceStyle}>
      <div style={contentStyle}>
        <h1>Slides unavailable</h1>
        <p>This service could not be displayed. Ask the operator to check the run sheet.</p>
      </div>
    </main>
  );
}

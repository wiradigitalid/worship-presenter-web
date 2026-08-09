import type { CSSProperties } from 'react';
import './projected.css';

const htmlStyle: CSSProperties = {
  backgroundColor: '#000000',
  overflow: 'hidden',
  scrollbarGutter: 'auto',
};

const bodyStyle: CSSProperties = {
  backgroundColor: '#000000',
  color: '#FFFFFF',
  minHeight: '100%',
  overflow: 'hidden',
};

export default function ProjectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={htmlStyle}>
      <body style={bodyStyle}>{children}</body>
    </html>
  );
}

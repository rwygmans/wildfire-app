import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wildfire History Explorer',
  description: 'Interactive wildfire visualization with DuckDB-WASM, Mosaic, and GeoArrow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


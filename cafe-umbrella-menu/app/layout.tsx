import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/sora';
import '@fontsource-variable/manrope';
import './globals.css';

export const metadata: Metadata = {
  title: "The Umbrella Ella · Roti & Kottu Hub — Digital Menu",
  description:
    'Scan. Crave. Order. The ultra-premium digital menu of Cafe Umbrella, Ella — legendary kottu, signature roti and mountain-fresh flavours, served piping hot.',
  applicationName: 'Cafe Umbrella Ella',
  openGraph: {
    title: "The Umbrella Ella · Roti & Kottu Hub — Digital Menu",
    description: 'Legendary kottu, signature roti & mountain-fresh flavour. Scan. Crave. Order.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

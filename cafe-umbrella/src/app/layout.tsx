import type { Metadata } from 'next';
// Self-hosted fonts (no external request, works offline, best practice for a
// customer-facing site). Google Fonts is unreachable from this sandbox.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/sora/600.css';
import '@fontsource/sora/700.css';
import '@fontsource/sora/800.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cafe Umbrella Ella — Digital Menu',
  description:
    'Browse the Cafe Umbrella Ella menu: kottu, stews, roti, chopsey and highland plates, with ingredients, preparation times and prices in LKR.',
  keywords: ['Cafe Umbrella', 'Ella', 'Sri Lanka', 'restaurant menu', 'kottu', 'digital menu'],
  openGraph: {
    title: 'Cafe Umbrella Ella — Digital Menu',
    description: 'Highland plates, made to order. Tap any dish for ingredients and preparation time.',
    type: 'website',
    locale: 'en_LK',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradingJournal',
  description: 'Persoonlijk trading journal dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}

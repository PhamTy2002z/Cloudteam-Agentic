import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Toolkit Sync Platform',
  description: 'Centralized documentation management for AI-assisted development teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

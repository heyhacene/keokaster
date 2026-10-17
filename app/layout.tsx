import type { Metadata } from 'next';
import './globals.css';
import { PlayerProvider } from '@/lib/playerContext';
import Navbar from '@/components/Navbar';
import PlayerBar from '@/components/PlayerBar';
import FullPlayerModal from '@/components/FullPlayerModal';
import AdSkipBanner from '@/components/AdSkipBanner';
import AppUpdateNotifier from '@/components/AppUpdateNotifier';

export const metadata: Metadata = {
  title: 'Keo Kaster — Podcasts Libres & Anti-Pub',
  description: 'Lecteur de podcasts moderne, synchronisé et sans coupures publicitaires.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-purple-500/30">
        <PlayerProvider>
          <Navbar />
          <AdSkipBanner />
          <AppUpdateNotifier />
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-28">
            {children}
          </main>
          <PlayerBar />
          <FullPlayerModal />
        </PlayerProvider>
      </body>
    </html>
  );
}

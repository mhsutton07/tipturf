import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'TipTurf — Know Before You Go',
  description: 'Work smarter. Earn more. TipTurf shows gig drivers where the money is.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TipTurf',
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-gray-950">
      <body className="bg-gray-950 text-white min-h-screen antialiased">
        <ToastProvider>
          <main className="pb-16">{children}</main>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { OnboardingModal } from '@/components/OnboardingModal';
import { CloudAlertBanner } from '@/components/CloudAlertBanner';

export const metadata: Metadata = {
  title: 'Cisco GSC Vietnam - Kinetic Sports & Health Hub',
  description: 'Nền tảng kết nối Strava, thi đấu thể thao và xếp hạng cá nhân, đội nhóm cho Cisco GSC Vietnam.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col antialiased selection:bg-[#CCFF00] selection:text-black">
        <AppProvider>
          <Navbar />
          <CloudAlertBanner />
          <main className="flex-1 pb-16 md:pb-8">{children}</main>
          <OnboardingModal />
          <Footer />
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}

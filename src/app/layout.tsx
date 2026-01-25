import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
// import ThreeScene from '@/components/ThreeScene';
import SmoothScroll from '@/components/SmoothScroll';
// import CustomCursor from '@/components/CustomCursor';
import { Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'SparkLink',
  description: 'A unified AI-powered operating system for campus life.',
  icons: {
    icon: '/ai_campus_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased bg-gradient-to-br from-green-50/40 via-emerald-50/20 to-amber-50/30`}
        suppressHydrationWarning
        style={{
          '--color-primary': '#4CAF50',
          '--color-accent-1': '#66BB6A',
          '--color-accent-2': '#81C784',
          '--color-accent-3': '#FFB703',
        } as React.CSSProperties}
      >
        <SmoothScroll>
          {/* <CustomCursor /> */}
          <Suspense fallback={null}>
            {/* <ThreeScene /> */}
          </Suspense>
          <AuthProvider>
            <main className="relative z-10 min-h-screen bg-gradient-to-b from-emerald-50/30 via-green-50/20 to-amber-50/20">
              {children}
            </main>
          </AuthProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}

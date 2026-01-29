'use client';

import Navigation from '@/components/Platform/Navigation';
import AIBot from '@/components/Platform/AIBot';
import { NotificationProvider } from '@/context/NotificationContext';
import EscalationChecker from '@/components/EscalationChecker';
import NotificationBell from '@/components/NotificationBell';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NotificationProvider>
            <EscalationChecker />
            <div className="flex min-h-screen">
                <Navigation />
                <main className="flex-1 ml-20 transition-all duration-300 relative z-10 p-8">
                    {/* Top bar with notification bell */}
                    <div className="absolute top-4 right-8 z-20">
                        <NotificationBell />
                    </div>
                    {children}
                </main>
                <AIBot />
            </div>
        </NotificationProvider>
    );
}

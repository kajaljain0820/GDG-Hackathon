'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import studyContextService, { StudyPartnerMatch } from '@/lib/studyContextService';
import notificationService from '@/lib/notificationService';

interface NotificationContextType {
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    recommendedPartners: StudyPartnerMatch[];
}

const NotificationContext = createContext<NotificationContextType>({
    notificationsEnabled: false,
    setNotificationsEnabled: () => { },
    recommendedPartners: []
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [recommendedPartners, setRecommendedPartners] = useState<StudyPartnerMatch[]>([]);
    const previousPartnersRef = useRef<StudyPartnerMatch[]>([]);

    // Check notification permission on mount
    useEffect(() => {
        if (!notificationService.isSupported()) {
            console.log('🔔 [Background] Notifications not supported');
            return;
        }

        const permission = notificationService.getPermission();
        setNotificationsEnabled(permission.granted);
        console.log('🔔 [Background] Service initialized - Permission:', permission.granted ? 'GRANTED ✅' : 'DENIED ❌');
    }, []);

    // Note: Periodic checking DISABLED
    // Notifications now trigger when YOU ask a question and find partners
    // NOT when new users join the system
    useEffect(() => {
        console.log('🔔 [Notification] Trigger mode: On-demand (when you study)');
        console.log('🔔 [Notification] NOT checking periodically for new users');
    }, [user, notificationsEnabled]);

    return (
        <NotificationContext.Provider value={{ notificationsEnabled, setNotificationsEnabled, recommendedPartners }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}

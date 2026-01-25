'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import escalationService from '@/lib/escalationService';

/**
 * Background Escalation Checker
 * Runs escalation checks periodically for all users
 */
export default function EscalationChecker() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Run escalation check immediately on mount
        escalationService.checkAndEscalateDoubts();

        // Then run every 60 seconds
        const interval = setInterval(() => {
            escalationService.checkAndEscalateDoubts();
        }, 60 * 1000); // Every minute

        return () => clearInterval(interval);
    }, [user]);

    return null; // This component doesn't render anything
}

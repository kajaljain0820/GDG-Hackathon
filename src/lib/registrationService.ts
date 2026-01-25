// Session Registration Service
// Handles registration checks and real-time registration tracking

import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface SessionRegistration {
    registrationId?: string;
    sessionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    academicYear: string;
    registeredAt: any;
}

/**
 * Check if user is registered for a session
 */
export async function isUserRegistered(sessionId: string, userId: string): Promise<boolean> {
    try {
        const q = query(
            collection(db, 'sessionRegistrations'),
            where('sessionId', '==', sessionId),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking registration:', error);
        return false;
    }
}

/**
 * Register for a session (direct Firestore write)
 */
export async function registerForSession(
    sessionId: string,
    userId: string,
    userEmail: string,
    userName: string,
    academicYear: string = 'Not specified'
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Check if session exists and is not completed
        const sessionRef = doc(db, 'teachingSessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
            return { success: false, error: 'Session not found' };
        }

        const sessionData = sessionSnap.data();
        if (sessionData.status === 'COMPLETED') {
            return { success: false, error: 'Cannot register for completed session' };
        }

        // 2. Check if already registered
        const existingReg = await getDocs(
            query(
                collection(db, 'sessionRegistrations'),
                where('sessionId', '==', sessionId),
                where('userId', '==', userId)
            )
        );

        if (!existingReg.empty) {
            return { success: true, error: 'Already registered' };
        }

        // 3. Create registration
        const registrationData: SessionRegistration = {
            sessionId,
            userId,
            userName,
            userEmail,
            academicYear,
            registeredAt: serverTimestamp()
        };

        await addDoc(collection(db, 'sessionRegistrations'), registrationData);
        console.log('✅ Registration created in Firestore');

        return { success: true };
    } catch (error: any) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: error.message || 'Registration failed'
        };
    }
}

/**
 * Subscribe to registration status for a session/user
 */
export function subscribeToRegistrationStatus(
    sessionId: string,
    userId: string,
    callback: (isRegistered: boolean) => void
): () => void {
    try {
        const q = query(
            collection(db, 'sessionRegistrations'),
            where('sessionId', '==', sessionId),
            where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            callback(!snapshot.empty);
        }, (error) => {
            console.error('Registration listener error:', error);
            callback(false);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up registration listener:', error);
        return () => { };
    }
}

/**
 * Get all registrations for a session (host view)
 */
export async function getAllRegistrations(sessionId: string): Promise<SessionRegistration[]> {
    try {
        const q = query(
            collection(db, 'sessionRegistrations'),
            where('sessionId', '==', sessionId)
        );

        const snapshot = await getDocs(q);
        const registrations: SessionRegistration[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            registrations.push({
                registrationId: doc.id,
                sessionId: data.sessionId,
                userId: data.userId,
                userName: data.userName,
                userEmail: data.userEmail,
                academicYear: data.academicYear,
                registeredAt: data.registeredAt
            });
        });

        // Sort by registration time (newest first)
        registrations.sort((a, b) => {
            const timeA = a.registeredAt?.toDate ? a.registeredAt.toDate().getTime() : 0;
            const timeB = b.registeredAt?.toDate ? b.registeredAt.toDate().getTime() : 0;
            return timeB - timeA;
        });

        return registrations;
    } catch (error) {
        console.error('Error getting registrations:', error);
        return [];
    }
}

/**
 * Get registration count for a session (for display only)
 */
export async function getRegistrationCount(sessionId: string): Promise<number> {
    try {
        const q = query(
            collection(db, 'sessionRegistrations'),
            where('sessionId', '==', sessionId)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting registration count:', error);
        return 0;
    }
}

/**
 * Subscribe to registration count (real-time)
 */
export function subscribeToRegistrationCount(
    sessionId: string,
    callback: (count: number) => void
): () => void {
    try {
        // Skip Firestore listener for professors (they use custom auth)
        const professorSession = localStorage.getItem('professorSession');
        if (professorSession) {
            // Return a no-op for professors - they don't need registration counts displayed
            callback(0);
            return () => { };
        }

        const q = query(
            collection(db, 'sessionRegistrations'),
            where('sessionId', '==', sessionId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            callback(snapshot.size);
        }, (error) => {
            console.error('Registration count listener error:', error);
            callback(0);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up count listener:', error);
        return () => { };
    }
}

export const registrationService = {
    isUserRegistered,
    registerForSession,
    subscribeToRegistrationStatus,
    getRegistrationCount,
    subscribeToRegistrationCount,
    getAllRegistrations
};

export default registrationService;

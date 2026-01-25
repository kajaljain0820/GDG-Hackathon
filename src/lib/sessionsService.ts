// Teaching Sessions Service - Real-time session management with ownership
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface TeachingSession {
    sessionId: string;
    title: string;
    description?: string;
    courseId: string;
    scheduledStartTime: string; // ISO timestamp
    scheduledEndTime?: string; // ISO timestamp (optional)
    meetLink: string;
    createdBy: string; // uid of creator
    creatorName: string; // cached name
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    sheetId?: string; // Google Sheets ID (created on first registration)
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

export interface CreateSessionData {
    title: string;
    description?: string;
    courseId: string;
    scheduledDate: string; // YYYY-MM-DD
    scheduledTime: string; // HH:MM
    endTime?: string; // HH:MM (optional)
    meetLink: string;
    createdBy: string; // uid
    creatorName: string;
}

/**
 * Create a new teaching session
 * IMPORTANT: Uses exact user-provided date & time
 */
export async function createTeachingSession(data: CreateSessionData): Promise<string> {
    try {
        // Construct exact ISO timestamp from user input
        const startDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);

        let endDateTime: Date | undefined;
        if (data.endTime) {
            endDateTime = new Date(`${data.scheduledDate}T${data.endTime}`);
        }

        if (isNaN(startDateTime.getTime())) {
            throw new Error('Invalid date/time provided');
        }

        const session = {
            title: data.title.trim(),
            description: data.description?.trim() || '',
            courseId: data.courseId,
            scheduledStartTime: startDateTime.toISOString(),
            scheduledEndTime: endDateTime?.toISOString() || null,
            meetLink: data.meetLink.trim(),
            createdBy: data.createdBy,
            creatorName: data.creatorName,
            status: 'UPCOMING' as const,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'teachingSessions'), session);
        console.log('✅ Session created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating session:', error);
        throw error;
    }
}

/**
 * Update a teaching session (creator only)
 */
export async function updateTeachingSession(
    sessionId: string,
    currentUserId: string,
    updates: Partial<CreateSessionData>
): Promise<void> {
    try {
        const sessionRef = doc(db, 'teachingSessions', sessionId);

        const updateData: any = {
            updatedAt: serverTimestamp()
        };

        if (updates.title) updateData.title = updates.title.trim();
        if (updates.description !== undefined) updateData.description = updates.description.trim();
        if (updates.meetLink) updateData.meetLink = updates.meetLink.trim();

        if (updates.scheduledDate && updates.scheduledTime) {
            const startDateTime = new Date(`${updates.scheduledDate}T${updates.scheduledTime}`);
            if (!isNaN(startDateTime.getTime())) {
                updateData.scheduledStartTime = startDateTime.toISOString();
            }
        }

        if (updates.endTime && updates.scheduledDate) {
            const endDateTime = new Date(`${updates.scheduledDate}T${updates.endTime}`);
            if (!isNaN(endDateTime.getTime())) {
                updateData.scheduledEndTime = endDateTime.toISOString();
            }
        }

        await updateDoc(sessionRef, updateData);
        console.log('✅ Session updated:', sessionId);
    } catch (error) {
        console.error('❌ Error updating session:', error);
        throw error;
    }
}

/**
 * End a teaching session (creator only)
 */
export async function endTeachingSession(sessionId: string, currentUserId: string): Promise<void> {
    try {
        const sessionRef = doc(db, 'teachingSessions', sessionId);

        await updateDoc(sessionRef, {
            status: 'COMPLETED',
            updatedAt: serverTimestamp()
        });

        console.log('✅ Session ended:', sessionId);
    } catch (error) {
        console.error('❌ Error ending session:', error);
        throw error;
    }
}

/**
 * Subscribe to real-time session updates
 * Returns an unsubscribe function
 * Uses client-side sorting to avoid Firestore index requirement
 */
export function subscribeToSessions(
    courseId: string,
    callback: (sessions: TeachingSession[]) => void
): () => void {
    try {
        // Check if professor is logged in
        const professorSession = localStorage.getItem('professorSession');
        if (professorSession) {
            // For professors: use polling instead of real-time listeners
            let intervalId: NodeJS.Timeout;

            const fetchSessions = async () => {
                try {
                    const session = JSON.parse(professorSession);
                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';
                    const response = await fetch(`${apiBaseUrl}/professor/sessions/${courseId}`, {
                        headers: {
                            'Authorization': `Professor ${session.uid}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const sessions = (data.sessions || []).map((s: any) => ({
                            sessionId: s.sessionId,
                            title: s.title || 'Untitled Session',
                            description: s.description || '',
                            courseId: s.courseId,
                            scheduledStartTime: s.scheduledStartTime,
                            scheduledEndTime: s.scheduledEndTime || undefined,
                            meetLink: s.meetLink,
                            createdBy: s.createdBy,
                            creatorName: s.creatorName || 'Unknown',
                            status: s.status || 'UPCOMING',
                            createdAt: s.createdAt?.toDate ? s.createdAt.toDate() : new Date(),
                            updatedAt: s.updatedAt?.toDate ? s.updatedAt.toDate() : undefined
                        }));

                        // Client-side sorting
                        sessions.sort((a: any, b: any) => {
                            const timeA = new Date(a.scheduledStartTime).getTime();
                            const timeB = new Date(b.scheduledStartTime).getTime();
                            return timeA - timeB;
                        });

                        callback(sessions);
                        console.log('✅ Real-time update:', sessions.length, 'sessions for course', courseId);
                    }
                } catch (error) {
                    console.warn('Professor sessions polling failed:', error);
                    callback([]);
                }
            };

            // Initial fetch
            fetchSessions();

            // Poll every 5 seconds
            intervalId = setInterval(fetchSessions, 5000);

            // Return cleanup function
            return () => {
                if (intervalId) clearInterval(intervalId);
            };
        }

        // For students: use Firestore real-time listeners
        const q = query(
            collection(db, 'teachingSessions'),
            where('courseId', '==', courseId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions: TeachingSession[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                sessions.push({
                    sessionId: doc.id,
                    title: data.title || 'Untitled Session',
                    description: data.description || '',
                    courseId: data.courseId,
                    scheduledStartTime: data.scheduledStartTime,
                    scheduledEndTime: data.scheduledEndTime || undefined,
                    meetLink: data.meetLink,
                    createdBy: data.createdBy,
                    creatorName: data.creatorName || 'Unknown',
                    status: data.status || 'UPCOMING',
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined
                });
            });

            // Client-side sorting (no Firestore index needed)
            sessions.sort((a: TeachingSession, b: TeachingSession) => {
                const timeA = new Date(a.scheduledStartTime).getTime();
                const timeB = new Date(b.scheduledStartTime).getTime();
                return timeA - timeB;
            });

            callback(sessions);
            console.log('✅ Real-time update:', sessions.length, 'sessions for course', courseId);
        }, (error) => {
            console.error('❌ Real-time listener error:', error);
            console.error('Error details:', error.message);
            // Return empty array on error
            callback([]);
        });

        return unsubscribe;
    } catch (error) {
        console.error('❌ Error setting up listener:', error);
        return () => { };
    }
}

/**
 * Check if user is the creator of a session
 */
export function isSessionCreator(session: TeachingSession, userId: string): boolean {
    return session.createdBy === userId;
}

/**
 * Check if session can be joined (not completed)
 */
export function canJoinSession(session: TeachingSession): boolean {
    return session.status !== 'COMPLETED';
}

/**
 * Auto-update session status based on time (optional helper)
 */
export function getSessionStatus(session: TeachingSession): 'UPCOMING' | 'ONGOING' | 'COMPLETED' {
    if (session.status === 'COMPLETED') return 'COMPLETED';

    const now = new Date();
    const startTime = new Date(session.scheduledStartTime);
    const endTime = session.scheduledEndTime ? new Date(session.scheduledEndTime) : null;

    if (now < startTime) return 'UPCOMING';
    if (endTime && now > endTime) return 'COMPLETED';
    if (now >= startTime) return 'ONGOING';

    return 'UPCOMING';
}

export const sessionsService = {
    createSession: createTeachingSession,
    updateSession: updateTeachingSession,
    endSession: endTeachingSession,
    subscribe: subscribeToSessions,
    isCreator: isSessionCreator,
    canJoin: canJoinSession,
    getStatus: getSessionStatus
};

export default sessionsService;

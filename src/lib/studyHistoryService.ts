// Study Session History Service
// Passive intelligence layer for tracking learning activity

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Event Types
export type EventType = 'TOPIC_STUDIED' | 'SESSION_ATTENDED' | 'DOUBT_SOLVED';

// Base Study History Event
export interface StudyHistoryEvent {
    eventId?: string;
    userId: string;
    courseId: string;
    eventType: EventType;
    title: string;
    metadata: TopicMetadata | SessionMetadata | DoubtMetadata;
    createdAt?: any;
}

// Metadata Types
export interface TopicMetadata {
    topics: string[];
    source?: 'question' | 'summary' | 'ppt';
}

export interface SessionMetadata {
    sessionId: string;
    sessionTitle: string;
    hostedBy: string;
}

export interface DoubtMetadata {
    doubtId: string;
    doubtTitle: string;
    resolvedBy: string;
}

// Collection reference
const COLLECTION_NAME = 'studyHistory';

/**
 * Record a topic studied event
 * Called after topic extraction in AI Notebook
 */
export async function recordTopicStudied(
    userId: string,
    courseId: string,
    topics: string[],
    source: 'question' | 'summary' | 'ppt' = 'question'
): Promise<void> {
    if (!userId || !courseId || !topics || topics.length === 0) {
        console.warn('⚠️ Invalid parameters for recordTopicStudied');
        return;
    }

    try {
        // Check for recent duplicate (within 5 minutes)
        const isDuplicate = await checkRecentDuplicate(userId, courseId, topics);
        if (isDuplicate) {
            console.log('ℹ️ Skipping duplicate topic entry (recent similar entry exists)');
            return;
        }

        const event: StudyHistoryEvent = {
            userId,
            courseId,
            eventType: 'TOPIC_STUDIED',
            title: `Studied ${topics[0]}${topics.length > 1 ? ` and ${topics.length - 1} more topic(s)` : ''}`,
            metadata: {
                topics,
                source
            },
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, COLLECTION_NAME), event);
        console.log('✅ Recorded topic studied:', topics);
    } catch (error) {
        console.error('❌ Error recording topic studied:', error);
        // Non-blocking error - don't throw
    }
}

/**
 * Record a session attended event
 * Called when student joins a teaching session
 */
export async function recordSessionAttended(
    userId: string,
    courseId: string,
    sessionId: string,
    sessionTitle: string,
    hostedBy: string
): Promise<void> {
    if (!userId || !courseId || !sessionId) {
        console.warn('⚠️ Invalid parameters for recordSessionAttended');
        return;
    }

    try {
        // Check if already recorded
        const alreadyRecorded = await checkSessionAlreadyRecorded(userId, sessionId);
        if (alreadyRecorded) {
            console.log('ℹ️ Session attendance already recorded');
            return;
        }

        const event: StudyHistoryEvent = {
            userId,
            courseId,
            eventType: 'SESSION_ATTENDED',
            title: `Attended ${sessionTitle}`,
            metadata: {
                sessionId,
                sessionTitle,
                hostedBy
            },
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, COLLECTION_NAME), event);
        console.log('✅ Recorded session attended:', sessionTitle);
    } catch (error) {
        console.error('❌ Error recording session attended:', error);
        // Non-blocking error
    }
}

/**
 * Record a doubt solved event
 * Called when a doubt is marked as resolved
 */
export async function recordDoubtSolved(
    userId: string,
    courseId: string,
    doubtId: string,
    doubtTitle: string,
    resolvedBy: string
): Promise<void> {
    if (!userId || !courseId || !doubtId) {
        console.warn('⚠️ Invalid parameters for recordDoubtSolved');
        return;
    }

    try {
        // Check if already recorded
        const alreadyRecorded = await checkDoubtAlreadyRecorded(userId, doubtId);
        if (alreadyRecorded) {
            console.log('ℹ️ Doubt resolution already recorded');
            return;
        }

        const event: StudyHistoryEvent = {
            userId,
            courseId,
            eventType: 'DOUBT_SOLVED',
            title: `Solved doubt: ${doubtTitle}`,
            metadata: {
                doubtId,
                doubtTitle,
                resolvedBy
            },
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, COLLECTION_NAME), event);
        console.log('✅ Recorded doubt solved:', doubtTitle);
    } catch (error) {
        console.error('❌ Error recording doubt solved:', error);
        // Non-blocking error
    }
}

/**
 * Get study history for a user
 * Supports filtering by course and event type
 */
export async function getStudyHistory(
    userId: string,
    courseId?: string,
    eventType?: EventType
): Promise<StudyHistoryEvent[]> {
    try {
        // Build query without orderBy (to avoid index requirement)
        const conditions = [where('userId', '==', userId)];

        if (courseId) {
            conditions.push(where('courseId', '==', courseId));
        }
        if (eventType) {
            conditions.push(where('eventType', '==', eventType));
        }

        const q = query(collection(db, COLLECTION_NAME), ...conditions);
        const snapshot = await getDocs(q);
        const events: StudyHistoryEvent[] = [];

        snapshot.forEach((doc) => {
            events.push({
                eventId: doc.id,
                ...doc.data()
            } as StudyHistoryEvent);
        });

        // Client-side sorting (newest first)
        events.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });

        console.log(`✅ Fetched ${events.length} history events for user ${userId}`);
        return events;
    } catch (error) {
        console.error('❌ Error fetching study history:', error);
        return [];
    }
}

/**
 * Get aggregated history for course (professor view)
 * Returns all events for a specific course
 */
export async function getCourseHistory(courseId: string): Promise<StudyHistoryEvent[]> {
    try {
        // Simple query without orderBy (no index needed)
        const q = query(
            collection(db, COLLECTION_NAME),
            where('courseId', '==', courseId)
        );

        const snapshot = await getDocs(q);
        const events: StudyHistoryEvent[] = [];

        snapshot.forEach((doc) => {
            events.push({
                eventId: doc.id,
                ...doc.data()
            } as StudyHistoryEvent);
        });

        // Client-side sorting (newest first)
        events.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });

        console.log(`✅ Fetched ${events.length} course history events`);
        return events;
    } catch (error) {
        console.error('❌ Error fetching course history:', error);
        return [];
    }
}

// Helper Functions

/**
 * Check if similar topics were studied recently (within 5 minutes)
 * Prevents duplicate entries for rapid interactions
 */
async function checkRecentDuplicate(
    userId: string,
    courseId: string,
    topics: string[]
): Promise<boolean> {
    try {
        const fiveMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));

        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('courseId', '==', courseId),
            where('eventType', '==', 'TOPIC_STUDIED'),
            where('createdAt', '>=', fiveMinutesAgo)
        );

        const snapshot = await getDocs(q);

        // Check if any recent entry has overlapping topics
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const existingTopics = (data.metadata as TopicMetadata).topics || [];
            const hasOverlap = topics.some(t =>
                existingTopics.some(et =>
                    et.toLowerCase().includes(t.toLowerCase()) ||
                    t.toLowerCase().includes(et.toLowerCase())
                )
            );
            if (hasOverlap) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking duplicate:', error);
        return false; // On error, allow the entry
    }
}

/**
 * Check if session attendance already recorded
 */
async function checkSessionAlreadyRecorded(
    userId: string,
    sessionId: string
): Promise<boolean> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('eventType', '==', 'SESSION_ATTENDED')
        );

        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            if ((data.metadata as SessionMetadata).sessionId === sessionId) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking session record:', error);
        return false;
    }
}

/**
 * Check if doubt resolution already recorded
 */
async function checkDoubtAlreadyRecorded(
    userId: string,
    doubtId: string
): Promise<boolean> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('eventType', '==', 'DOUBT_SOLVED')
        );

        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            if ((data.metadata as DoubtMetadata).doubtId === doubtId) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking doubt record:', error);
        return false;
    }
}

export default {
    recordTopicStudied,
    recordSessionAttended,
    recordDoubtSolved,
    getStudyHistory,
    getCourseHistory
};

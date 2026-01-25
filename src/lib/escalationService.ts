import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Escalation Timings
const TIME_TO_SENIOR = 30 * 60 * 1000; // 30 minutes
const TIME_TO_PROFESSOR = 2 * 60 * 60 * 1000; // 2 hours

export async function checkAndEscalateDoubts(): Promise<number> {
    try {
        const now = new Date();
        let escalationCount = 0;

        // Get all unresolved doubts
        const q = query(
            collection(db, 'doubts'),
            where('resolved', '==', false)
        );

        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            const doubt = docSnap.data();
            const doubtId = docSnap.id;

            // Skip if no lastEscalatedAt (shouldn't happen but safety check)
            if (!doubt.lastEscalatedAt) continue;

            const escalatedTime = doubt.lastEscalatedAt.toDate
                ? doubt.lastEscalatedAt.toDate()
                : new Date(doubt.lastEscalatedAt);

            const diffMs = now.getTime() - escalatedTime.getTime();

            // Rule 1: OPEN → SENIOR_VISIBLE (after 30 minutes)
            if (doubt.status === 'OPEN' && diffMs >= TIME_TO_SENIOR) {
                await updateDoc(doc(db, 'doubts', doubtId), {
                    status: 'SENIOR_VISIBLE',
                    lastEscalatedAt: serverTimestamp()
                });
                console.log(`✅ Escalated doubt ${doubtId} to SENIOR_VISIBLE`);
                escalationCount++;
            }
            // Rule 2: SENIOR_VISIBLE → PROFESSOR (after 2 hours from OPEN)
            else if (doubt.status === 'SENIOR_VISIBLE' && diffMs >= TIME_TO_PROFESSOR) {
                await updateDoc(doc(db, 'doubts', doubtId), {
                    status: 'PROFESSOR',
                    lastEscalatedAt: serverTimestamp()
                });
                console.log(`✅ Escalated doubt ${doubtId} to PROFESSOR`);
                escalationCount++;
            }
        }

        if (escalationCount > 0) {
            console.log(`📊 Escalation check complete: ${escalationCount} doubts escalated`);
        }

        return escalationCount;
    } catch (error) {
        console.error('❌ Error in escalation check:', error);
        return 0;
    }
}


export async function getProfessorDoubts(courseId?: string): Promise<any[]> {
    try {
        // Check if professor is logged in
        const professorSession = localStorage.getItem('professorSession');
        if (professorSession && courseId) {
            try {
                const session = JSON.parse(professorSession);
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';
                const response = await fetch(`${apiBaseUrl}/professor/doubts/${courseId}`, {
                    headers: {
                        'Authorization': `Professor ${session.uid}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.doubts || [];
                }
                console.warn('API endpoint failed, falling back to empty array');
                return [];
            } catch (apiError) {
                console.warn('Professor API call failed:', apiError);
                return [];
            }
        }

        let q;

        if (courseId) {
            q = query(
                collection(db, 'doubts'),
                where('escalationLevel', '==', 'PROFESSOR'),
                where('courseId', '==', courseId)
            );
        } else {
            q = query(
                collection(db, 'doubts'),
                where('escalationLevel', '==', 'PROFESSOR')
            );
        }

        const snapshot = await getDocs(q);
        const doubts: any[] = [];

        snapshot.forEach((doc) => {
            doubts.push({
                doubtId: doc.id,
                ...doc.data()
            });
        });

        doubts.sort((a, b) => {
            const timeA = a.escalatedAt?.toDate ? a.escalatedAt.toDate().getTime() : (a.escalatedAt?._seconds * 1000 || 0);
            const timeB = b.escalatedAt?.toDate ? b.escalatedAt.toDate().getTime() : (b.escalatedAt?._seconds * 1000 || 0);
            return timeA - timeB;
        });

        return doubts;
    } catch (error) {
        console.error('Error fetching professor doubts:', error);
        return [];
    }
}


export async function getConfusionInsights(courseId: string): Promise<any[]> {
    try {
        // Check if professor is logged in
        const professorSession = localStorage.getItem('professorSession');
        if (professorSession) {
            try {
                const session = JSON.parse(professorSession);
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';
                const response = await fetch(`${apiBaseUrl}/professor/insights/${courseId}`, {
                    headers: {
                        'Authorization': `Professor ${session.uid}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.insights || [];
                }
                console.warn('API endpoint failed, falling back to empty array');
                return [];
            } catch (apiError) {
                console.warn('Professor API call failed:', apiError);
                return [];
            }
        }

        // Fallback to direct Firestore
        const q = query(
            collection(db, 'doubts'),
            where('courseId', '==', courseId)
        );

        const snapshot = await getDocs(q);
        const topicCounts: { [topic: string]: number } = {};

        snapshot.forEach((doc) => {
            const doubt = doc.data();
            const topic = doubt.topic || doubt.content?.substring(0, 50) || 'General';
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });

        const insights = Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count);

        return insights;
    } catch (error) {
        console.error('Error getting insights:', error);
        return [];
    }
}

export const escalationService = {
    checkAndEscalateDoubts,
    getProfessorDoubts,
    getConfusionInsights
};

export default escalationService;

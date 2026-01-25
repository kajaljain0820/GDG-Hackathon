// Active Study Context Service - Track what students are studying in real-time
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface ActiveStudyContext {
    uid: string;
    courseId: string;
    topics: string[]; // AI-extracted topic keywords
    lastActiveAt: Timestamp | Date;
    activityType?: 'question' | 'summary' | 'ppt_navigation' | 'file_upload';
    questionSnippet?: string; // Preview of what they're asking about
}

export interface StudyPartnerMatch {
    uid: string;
    displayName: string;
    academicYear: number;
    department: string;
    matchedTopics: string[];
    lastActiveAt: Date;
    courseId: string;
    activityType?: string;
    photoURL?: string | null;
}

/**
 * Update user's active study context
 * Called whenever a student interacts with AI Notebook
 */
export async function updateStudyContext(
    uid: string,
    courseId: string,
    topics: string[],
    activityType: 'question' | 'summary' | 'ppt_navigation' | 'file_upload',
    questionSnippet?: string
): Promise<void> {
    try {
        if (!topics || topics.length === 0) {
            console.warn('No topics provided for study context update');
            return;
        }

        const contextRef = doc(db, 'activeStudyContext', uid);

        const contextData: ActiveStudyContext = {
            uid,
            courseId,
            topics: topics.slice(0, 5), // Keep top 5 topics
            lastActiveAt: serverTimestamp() as Timestamp,
            activityType,
            questionSnippet: questionSnippet?.substring(0, 150) // First 150 chars
        };

        await setDoc(contextRef, contextData, { merge: true });
        console.log('✅ Updated study context for user:', uid, 'Topics:', topics);
    } catch (error) {
        console.error('❌ Error updating study context:', error);
        throw error;
    }
}

/**
 * Get recommended study partners based on current study context
 * Returns users studying similar topics in the same course within recent time window
 */
export async function getRecommendedStudyPartners(
    currentUserId: string,
    courseId: string,
    timeWindowMinutes: number = 60
): Promise<StudyPartnerMatch[]> {
    try {
        // Get current user's study context
        const currentUserContextRef = doc(db, 'activeStudyContext', currentUserId);
        const currentUserContextSnap = await getDoc(currentUserContextRef);

        if (!currentUserContextSnap.exists()) {
            console.log('No active study context for current user');
            return [];
        }

        const currentUserContext = currentUserContextSnap.data() as ActiveStudyContext;
        const currentUserTopics = currentUserContext.topics || [];

        if (currentUserTopics.length === 0) {
            console.log('Current user has no topics');
            return [];
        }

        // Calculate time threshold
        const now = new Date();
        const timeThreshold = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

        // Get all active study contexts for the same course
        const contextsQuery = query(
            collection(db, 'activeStudyContext'),
            where('courseId', '==', courseId)
        );

        const contextsSnap = await getDocs(contextsQuery);
        const matches: StudyPartnerMatch[] = [];

        for (const contextDoc of contextsSnap.docs) {
            const context = contextDoc.data() as ActiveStudyContext;

            // Skip current user
            if (context.uid === currentUserId) continue;

            // Check if activity is recent
            const lastActive = context.lastActiveAt instanceof Timestamp
                ? context.lastActiveAt.toDate()
                : new Date(context.lastActiveAt);

            if (lastActive < timeThreshold) continue;

            // Calculate topic overlap
            const matchedTopics = findMatchingTopics(currentUserTopics, context.topics || []);

            if (matchedTopics.length === 0) continue;

            // Get user profile for additional info
            const userProfileRef = doc(db, 'users', context.uid);
            const userProfileSnap = await getDoc(userProfileRef);

            if (!userProfileSnap.exists()) continue;

            const userProfile = userProfileSnap.data();

            matches.push({
                uid: context.uid,
                displayName: userProfile.displayName || 'Anonymous',
                academicYear: userProfile.year || 1,
                department: userProfile.department || 'Unknown',
                matchedTopics,
                lastActiveAt: lastActive,
                courseId: context.courseId,
                activityType: context.activityType,
                photoURL: userProfile.photoURL
            });
        }

        // Sort by number of matched topics (descending) and recency
        matches.sort((a, b) => {
            const topicDiff = b.matchedTopics.length - a.matchedTopics.length;
            if (topicDiff !== 0) return topicDiff;
            return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
        });

        console.log(`✅ Found ${matches.length} study partner matches`);
        return matches;
    } catch (error) {
        console.error('❌ Error getting recommended study partners:', error);
        return [];
    }
}

/**
 * Find matching topics between two arrays
 * Uses fuzzy matching (case-insensitive substring matching)
 */
function findMatchingTopics(topics1: string[], topics2: string[]): string[] {
    const matches: string[] = [];
    const normalizedTopics1 = topics1.map(t => t.toLowerCase());

    for (const topic2 of topics2) {
        const normalizedTopic2 = topic2.toLowerCase();

        // Check for exact match or substring match
        for (let i = 0; i < topics1.length; i++) {
            const topic1Lower = normalizedTopics1[i];

            if (topic1Lower === normalizedTopic2 ||
                topic1Lower.includes(normalizedTopic2) ||
                normalizedTopic2.includes(topic1Lower)) {

                // Use the original case from topics1
                if (!matches.includes(topics1[i])) {
                    matches.push(topics1[i]);
                }
            }
        }
    }

    return matches;
}

/**
 * Clear study context (when user logs out or becomes inactive)
 */
export async function clearStudyContext(uid: string): Promise<void> {
    try {
        const contextRef = doc(db, 'activeStudyContext', uid);
        await setDoc(contextRef, {
            topics: [],
            lastActiveAt: serverTimestamp()
        }, { merge: true });

        console.log('✅ Cleared study context for user:', uid);
    } catch (error) {
        console.error('❌ Error clearing study context:', error);
    }
}

export const studyContextService = {
    updateStudyContext,
    getRecommendedStudyPartners,
    clearStudyContext
};

export default studyContextService;

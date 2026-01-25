// Firebase Firestore Service - Persistent Knowledge Base
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// DOUBTS COLLECTION - Permanent Storage
// ============================================

export interface Doubt {
    doubtId?: string;
    content: string;
    courseId: string;
    askedBy: {
        name: string;
        uid: string;
        email?: string;
        department?: string;
        year?: number;
    };
    createdAt: any;
    lastEscalatedAt?: any;
    status: 'AI' | 'OPEN' | 'SENIOR_VISIBLE' | 'PROFESSOR' | 'RESOLVED';
    resolved: boolean;
    aiAnswer?: string;
    replies: Reply[];
    votes: number;
    views: number;
    tags: string[];
    history: StatusHistory[];
}

export interface Reply {
    replyId: string;
    content: string;
    repliedBy: {
        name: string;
        uid: string;
        role: 'STUDENT' | 'PROFESSOR';
    };
    createdAt: any;
    isAi: boolean;
    isAccepted: boolean;
}

export interface StatusHistory {
    status: string;
    timestamp: any;
    note: string;
}

// Create a new doubt (saves to Firestore)
export async function createDoubt(doubtData: Partial<Doubt>): Promise<string> {
    try {
        const doubt: Doubt = {
            content: doubtData.content || '',
            courseId: doubtData.courseId || 'general',
            askedBy: doubtData.askedBy!,
            createdAt: serverTimestamp(),
            status: 'AI',
            resolved: false,
            aiAnswer: doubtData.aiAnswer || '',
            replies: [],
            votes: 0,
            views: 0,
            tags: doubtData.tags || [],
            history: [{
                status: 'AI',
                timestamp: new Date(), // Use regular Date in arrays
                note: 'AI Generated Answer'
            }]
        };

        const docRef = await addDoc(collection(db, 'doubts'), doubt);
        console.log('✅ Doubt saved to Firestore:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving doubt:', error);
        throw error;
    }
}

// Get all doubts (from Firestore)
export async function getDoubts(filters?: {
    courseId?: string;
    status?: string;
    limit?: number;
}): Promise<Doubt[]> {
    try {
        // Start with basic collection query (no orderBy to avoid index requirement)
        let q = query(collection(db, 'doubts'));

        if (filters?.courseId) {
            q = query(q, where('courseId', '==', filters.courseId));
        }

        if (filters?.status) {
            q = query(q, where('status', '==', filters.status));
        }

        if (filters?.limit) {
            q = query(q, limit(filters.limit));
        }

        const snapshot = await getDocs(q);
        const doubts = snapshot.docs.map(doc => {
            const data = doc.data();

            // Convert Firestore Timestamp to string for frontend compatibility
            return {
                doubtId: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                lastEscalatedAt: data.lastEscalatedAt?.toDate ? data.lastEscalatedAt.toDate().toISOString() : null,
                replies: (data.replies || []).map((r: any) => ({
                    ...r,
                    createdAt: r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : new Date().toISOString()
                })),
                history: (data.history || []).map((h: any) => ({
                    ...h,
                    timestamp: h.timestamp?.toDate ? h.timestamp.toDate().toISOString() : new Date().toISOString()
                }))
            };
        }) as Doubt[];

        // Sort by createdAt in JavaScript (newest first)
        doubts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log('✅ Fetched', doubts.length, 'doubts from Firestore');
        return doubts;
    } catch (error) {
        console.error('❌ Error fetching doubts:', error);
        return [];
    }
}

// Get a single doubt by ID
export async function getDoubtById(doubtId: string): Promise<Doubt | null> {
    try {
        const docSnap = await getDoc(doc(db, 'doubts', doubtId));

        if (docSnap.exists()) {
            return {
                doubtId: docSnap.id,
                ...docSnap.data()
            } as Doubt;
        }
        return null;
    } catch (error) {
        console.error('❌ Error fetching doubt:', error);
        return null;
    }
}

// Update doubt status (for escalation)
export async function updateDoubtStatus(
    doubtId: string,
    status: Doubt['status'],
    note?: string
): Promise<void> {
    try {
        const doubtRef = doc(db, 'doubts', doubtId);
        const doubtSnap = await getDoc(doubtRef);

        if (!doubtSnap.exists()) {
            throw new Error('Doubt not found');
        }

        const currentHistory = doubtSnap.data().history || [];

        await updateDoc(doubtRef, {
            status,
            lastEscalatedAt: serverTimestamp(),
            history: [
                ...currentHistory,
                {
                    status,
                    timestamp: new Date(), // Use Date instead of serverTimestamp in arrays
                    note: note || `Escalated to ${status}`
                }
            ]
        });

        console.log('✅ Doubt status updated:', doubtId, '->', status);
    } catch (error) {
        console.error('❌ Error updating doubt status:', error);
        throw error;
    }
}

// Add a reply to a doubt
export async function addReplyToDoubt(
    doubtId: string,
    reply: Omit<Reply, 'replyId' | 'createdAt'>
): Promise<void> {
    try {
        const doubtRef = doc(db, 'doubts', doubtId);
        const doubtSnap = await getDoc(doubtRef);

        if (!doubtSnap.exists()) {
            throw new Error('Doubt not found');
        }

        const currentReplies = doubtSnap.data().replies || [];
        const newReply: Reply = {
            ...reply,
            replyId: `reply_${Date.now()}`,
            createdAt: new Date() // Use Date instead of serverTimestamp in arrays
        };

        await updateDoc(doubtRef, {
            replies: [...currentReplies, newReply]
        });

        console.log('✅ Reply added to doubt:', doubtId);
    } catch (error) {
        console.error('❌ Error adding reply:', error);
        throw error;
    }
}

// Mark doubt as resolved
export async function resolveDoubt(doubtId: string): Promise<void> {
    try {
        await updateDoc(doc(db, 'doubts', doubtId), {
            status: 'RESOLVED',
            resolved: true
        });

        console.log('✅ Doubt marked as resolved:', doubtId);
    } catch (error) {
        console.error('❌ Error resolving doubt:', error);
        throw error;
    }
}

// ============================================
// DOCUMENTS COLLECTION - Permanent Storage
// ============================================

export interface DocumentData {
    documentId?: string;
    chatId: string;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedBy: {
        name: string;
        uid: string;
    };
    uploadedAt: any;
    extractedText: string;
    chatHistory: ChatMessage[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    timestamp: any;
}

// Save uploaded document
export async function saveDocument(docData: Partial<DocumentData>): Promise<string> {
    try {
        const document: DocumentData = {
            chatId: docData.chatId || `chat_${Date.now()}`,
            filename: docData.filename!,
            fileType: docData.fileType || 'unknown',
            fileSize: docData.fileSize || 0,
            uploadedBy: docData.uploadedBy!,
            uploadedAt: serverTimestamp(),
            extractedText: docData.extractedText || '',
            chatHistory: []
        };

        const docRef = await addDoc(collection(db, 'documents'), document);
        console.log('✅ Document saved to Firestore:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving document:', error);
        throw error;
    }
}

// Get user's documents
export async function getUserDocuments(userId: string): Promise<DocumentData[]> {
    try {
        const q = query(
            collection(db, 'documents'),
            where('uploadedBy.uid', '==', userId)
        );

        const snapshot = await getDocs(q);
        const documents = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                documentId: doc.id,
                ...data,
                uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(),
                chatHistory: (data.chatHistory || []).map((msg: any) => ({
                    ...msg,
                    timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate().toISOString() : new Date().toISOString()
                }))
            };
        }) as DocumentData[];

        // Sort by uploadedAt in JavaScript (newest first)
        documents.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

        console.log('✅ Fetched', documents.length, 'documents from Firestore');
        return documents;
    } catch (error) {
        console.error('❌ Error fetching documents:', error);
        return [];
    }
}

// Update document chat history
export async function updateDocumentChat(
    documentId: string,
    message: Omit<ChatMessage, 'timestamp'>
): Promise<void> {
    try {
        const docRef = doc(db, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Document not found');
        }

        const currentHistory = docSnap.data().chatHistory || [];

        await updateDoc(docRef, {
            chatHistory: [
                ...currentHistory,
                {
                    ...message,
                    timestamp: new Date() // Use Date instead of serverTimestamp in arrays
                }
            ]
        });

        console.log('✅ Document chat updated:', documentId);
    } catch (error) {
        console.error('❌ Error updating document chat:', error);
        throw error;
    }
}

// ============================================
// SESSIONS COLLECTION - Permanent Storage
// ============================================

export interface Session {
    sessionId?: string;
    title: string;
    description?: string;
    tutorName: string;
    tutorUid: string;
    scheduledAt: any;
    duration: number;
    meetLink: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    courseId: string;
    participants: string[];
    createdAt: any;
    tags: string[];
}

// Create a session
export async function createSession(sessionData: Partial<Session>): Promise<string> {
    try {
        const session: Session = {
            title: sessionData.title!,
            description: sessionData.description || '',
            tutorName: sessionData.tutorName || 'Instructor',
            tutorUid: sessionData.tutorUid || 'anonymous',
            scheduledAt: sessionData.scheduledAt || serverTimestamp(),
            duration: sessionData.duration || 60,
            meetLink: sessionData.meetLink!,
            status: 'scheduled',
            courseId: sessionData.courseId || 'general',
            participants: [],
            createdAt: serverTimestamp(),
            tags: sessionData.tags || []
        };

        const docRef = await addDoc(collection(db, 'sessions'), session);
        console.log('✅ Session saved to Firestore:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving session:', error);
        throw error;
    }
}

// Get all sessions
export async function getSessions(filters?: {
    status?: string;
    limit?: number;
}): Promise<Session[]> {
    try {
        let q = query(collection(db, 'sessions'));

        if (filters?.status) {
            q = query(q, where('status', '==', filters.status));
        }

        if (filters?.limit) {
            q = query(q, limit(filters.limit));
        }

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                sessionId: doc.id,
                title: data.title || 'Untitled Session',
                description: data.description || '',
                tutorName: data.tutorName || 'Instructor',
                tutorUid: data.tutorUid || 'anonymous',
                scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate().toISOString() : new Date().toISOString(),
                duration: data.duration || 60,
                meetLink: data.meetLink || '',
                courseId: data.courseId || 'general',
                participants: data.participants || [],
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                status: data.status || 'scheduled',
                tags: data.tags || []
            };
        }) as Session[];

        // Sort by scheduledAt in JavaScript (newest/future first)
        sessions.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

        console.log('✅ Fetched', sessions.length, 'sessions from Firestore');
        return sessions;
    } catch (error) {
        console.error('❌ Error fetching sessions:', error);
        return [];
    }
}

// Export all services
export const firestoreService = {
    // Doubts
    createDoubt,
    getDoubts,
    getDoubtById,
    updateDoubtStatus,
    addReplyToDoubt,
    resolveDoubt,

    // Documents
    saveDocument,
    getUserDocuments,
    updateDocumentChat,

    // Sessions
    createSession,
    getSessions
};

export default firestoreService;

// Peers & Connections Service - Real Peer-to-Peer Networking
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
    userId: string;
    displayName: string;
    email: string;
    department: string;
    year: number;
    bio?: string | null;
    interests: string[];
    studyTopics?: string[];
    photoURL?: string | null;
    isOnline: boolean;
    lastSeen: any;
    createdAt: any;
    role?: 'student' | 'professor'; // Role identifier
}

export interface Connection {
    connectionId?: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: any;
    updatedAt?: any;
}

// Create or update user profile
export async function createUserProfile(profileData: Partial<UserProfile>): Promise<void> {
    try {
        const userProfile: UserProfile = {
            userId: profileData.userId!,
            displayName: profileData.displayName || '',
            email: profileData.email || '',
            department: profileData.department || 'Computer Science',
            year: profileData.year || 1,
            bio: profileData.bio || '',
            interests: profileData.interests || [],
            photoURL: profileData.photoURL || null,
            isOnline: true,
            lastSeen: serverTimestamp(),
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', profileData.userId!), userProfile, { merge: true });
        console.log('✅ User profile saved to Firestore');
    } catch (error) {
        console.error('❌ Error saving user profile:', error);
        throw error;
    }
}

// Get all users for discovery
export async function getAllUsers(): Promise<UserProfile[]> {
    try {
        // Check if professor is logged in
        const professorSession = localStorage.getItem('professorSession');
        if (professorSession) {
            try {
                const session = JSON.parse(professorSession);
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';
                const response = await fetch(`${apiBaseUrl}/professor/peers`, {
                    headers: {
                        'Authorization': `Professor ${session.uid}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Fetched', data.users.length, 'users from Professor API');
                    return data.users || [];
                }
            } catch (error) {
                console.warn('Professor peers API failed, checking local fallback', error);
            }
        }

        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);

        const users: UserProfile[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                ...data,
                lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate().toISOString() : new Date().toISOString(),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            } as UserProfile);
        });

        console.log('✅ Fetched', users.length, 'users from Firestore');
        return users;
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        return [];
    }
}

// Get single user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                ...data,
                lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate().toISOString() : new Date().toISOString(),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
    }
}



// Send connection request
export async function sendConnectionRequest(fromUserId: string, toUserId: string): Promise<string> {
    try {
        const connection: Connection = {
            fromUserId,
            toUserId,
            status: 'pending',
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'connections'), connection);
        console.log('✅ Connection request sent:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error sending connection request:', error);
        throw error;
    }
}

// Get user's connections
export async function getUserConnections(userId: string): Promise<Connection[]> {
    try {
        // Check if professor is logged in
        const professorSession = localStorage.getItem('professorSession');
        if (professorSession) {
            try {
                const session = JSON.parse(professorSession);
                // Only use API if the requested userId matches the professor's ID (or we want all connections)
                if (session.uid === userId) {
                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';
                    const response = await fetch(`${apiBaseUrl}/professor/connections`, {
                        headers: {
                            'Authorization': `Professor ${session.uid}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Filter for this user in memory since API returns all (simplified for prototype)
                        const allConnections = data.connections || [];
                        return allConnections.filter((c: any) => c.fromUserId === userId || c.toUserId === userId);
                    }
                }
            } catch (error) {
                console.warn('Professor connections API failed, checking local fallback', error);
            }
        }

        const sentQuery = query(
            collection(db, 'connections'),
            where('fromUserId', '==', userId)
        );
        const receivedQuery = query(
            collection(db, 'connections'),
            where('toUserId', '==', userId)
        );

        const [sentSnapshot, receivedSnapshot] = await Promise.all([
            getDocs(sentQuery),
            getDocs(receivedQuery)
        ]);

        const connections = [
            ...sentSnapshot.docs.map(doc => ({
                connectionId: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
            })),
            ...receivedSnapshot.docs.map(doc => ({
                connectionId: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
            }))
        ] as Connection[];

        console.log('✅ Fetched', connections.length, 'connections for user');
        return connections;
    } catch (error) {
        console.error('❌ Error fetching connections:', error);
        return [];
    }
}

// Update connection status (accept/reject)
export async function updateConnectionStatus(
    connectionId: string,
    status: 'accepted' | 'rejected'
): Promise<void> {
    try {
        await updateDoc(doc(db, 'connections', connectionId), {
            status,
            updatedAt: serverTimestamp()
        });

        console.log('✅ Connection status updated:', status);
    } catch (error) {
        console.error('❌ Error updating connection:', error);
        throw error;
    }
}

// Update user study topics from AI analysis
export async function updateUserTopics(userId: string, newTopics: string[]): Promise<void> {
    try {
        if (!newTopics || newTopics.length === 0) return;

        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        let currentTopics: string[] = [];
        if (docSnap.exists()) {
            currentTopics = docSnap.data().studyTopics || [];
        }

        // Merge unique topics, keep top 10 (newest first logic can be adjusted, here we prepend new)
        const merged = Array.from(new Set([...newTopics, ...currentTopics])).slice(0, 10);

        await updateDoc(docRef, {
            studyTopics: merged,
            lastSeen: serverTimestamp()
        });
        console.log('✅ Updated user study topics:', merged);
    } catch (error) {
        console.error('❌ Error updating topics:', error);
    }
}

export const peersService = {
    createUserProfile,
    getAllUsers,
    getUserProfile,
    sendConnectionRequest,
    getUserConnections,
    updateConnectionStatus,
    updateUserTopics
};

export default peersService;

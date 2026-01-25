'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { peersService } from '@/lib/peersService';
import api from '@/lib/api';

interface ProfessorSession {
    role: 'professor';
    email: string;
    name: string;
    uid: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    token: string | null;
    isProfessor: boolean;
    professorSession: ProfessorSession | null;
    professorLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    token: null,
    isProfessor: false,
    professorSession: null,
    professorLogin: async () => ({ success: false })
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [isProfessor, setIsProfessor] = useState(false);
    const [professorSession, setProfessorSession] = useState<ProfessorSession | null>(null);

    // Check for existing professor session on mount
    useEffect(() => {
        const storedSession = localStorage.getItem('professorSession');
        if (storedSession) {
            try {
                const session = JSON.parse(storedSession);
                setProfessorSession(session);
                setIsProfessor(true);
                setToken(`Professor ${session.uid}`);
                setLoading(false);

                // Sync professor profile to Firestore (ensure they appear in peer lists)
                peersService.createUserProfile({
                    userId: session.uid,
                    displayName: session.name,
                    email: session.email,
                    photoURL: null,
                    role: 'professor',
                    department: 'Computer Science', // Default for now
                    year: 0 // Indicates faculty
                }).catch(e => console.error("Error syncing professor profile on restore:", e));

            } catch (e) {
                console.error('Invalid professor session');
                localStorage.removeItem('professorSession');
            }
        }
    }, []);

    // Student authentication (Firebase)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Student logged in - clear any professor session
                if (isProfessor) {
                    console.log('🔄 Clearing professor session for student login');
                    setProfessorSession(null);
                    setIsProfessor(false);
                    localStorage.removeItem('professorSession');
                }

                const idToken = await currentUser.getIdToken();
                setToken(idToken);
                setUser(currentUser);

                // Sync user profile to Firestore (Offline-first approach)
                try {
                    await peersService.createUserProfile({
                        userId: currentUser.uid,
                        displayName: currentUser.displayName || 'Student',
                        email: currentUser.email || '',
                        photoURL: currentUser.photoURL || null
                    });
                } catch (e) {
                    console.error("Error syncing user profile:", e);
                }

            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isProfessor]);

    // Professor login
    const professorLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await api.post('/auth/professor-login', {
                email,
                password
            });

            if (response.data.success) {
                const session = response.data.session;
                setProfessorSession(session);
                setIsProfessor(true);
                setToken(`Professor ${session.uid}`);

                // Store session in localStorage
                localStorage.setItem('professorSession', JSON.stringify(session));

                // WARNING: Professors cannot write to Firestore from client-side due to rules
                // Syncing is handled by server-side logic if needed, or skipped
                /*
                try {
                    await peersService.createUserProfile({
                        userId: session.uid,
                        displayName: session.name,
                        email: session.email,
                        photoURL: null,
                        role: 'professor'
                    });
                } catch (e) {
                    console.error("Error syncing professor profile:", e);
                }
                */

                console.log('✅ Professor login successful');
                return { success: true };
            }

            return { success: false, error: 'Login failed' };
        } catch (error: any) {
            console.error('Professor login error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Invalid credentials'
            };
        }
    };

    const logout = async () => {
        if (isProfessor) {
            // Professor logout
            setProfessorSession(null);
            setIsProfessor(false);
            setToken(null);
            localStorage.removeItem('professorSession');
        } else {
            // Student logout
            await firebaseSignOut(auth);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            logout,
            token,
            isProfessor,
            professorSession,
            professorLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

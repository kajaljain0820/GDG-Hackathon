'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { peersService } from '@/lib/peersService';
import api from '@/lib/api';

interface ProfessorSession {
    role: 'professor';
    email: string;
    name: string;
    uid: string;
}

interface AdminSession {
    role: 'admin';
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
    isAdmin: boolean;
    professorSession: ProfessorSession | null;
    adminSession: AdminSession | null;
    professorLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    token: null,
    isProfessor: false,
    isAdmin: false,
    professorSession: null,
    adminSession: null,
    professorLogin: async () => ({ success: false })
});

export const useAuth = () => useContext(AuthContext);

// Admin credentials (hardcoded as per requirement)
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin@123';

// Fallback professor credentials (when backend is not available)
const PROFESSOR_EMAIL = 'professor@gmail.com';
const PROFESSOR_PASSWORD = 'professor@123';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [isProfessor, setIsProfessor] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [professorSession, setProfessorSession] = useState<ProfessorSession | null>(null);
    const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

    // Check for existing admin session on mount
    useEffect(() => {
        const storedAdminSession = localStorage.getItem('adminSession');
        if (storedAdminSession) {
            try {
                const session = JSON.parse(storedAdminSession);
                setAdminSession(session);
                setIsAdmin(true);
                setToken(`Admin ${session.uid}`);
                setLoading(false);
                return; // Don't check professor session if admin is logged in
            } catch (e) {
                console.error('Invalid admin session');
                localStorage.removeItem('adminSession');
            }
        }
    }, []);

    // Check for existing professor session on mount
    useEffect(() => {
        if (isAdmin) return; // Skip if admin is logged in

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

                return;
            } catch (e) {
                console.error('Invalid professor session');
                localStorage.removeItem('professorSession');
            }
        }

        // Check for existing student session (Firestore-based login)
        const storedStudentSession = localStorage.getItem('studentSession');
        if (storedStudentSession) {
            try {
                const session = JSON.parse(storedStudentSession);
                setToken(`Student ${session.uid}`);
                setUser({
                    uid: session.uid,
                    email: session.email,
                    displayName: session.displayName,
                    emailVerified: true,
                    isAnonymous: false,
                    metadata: {},
                    providerData: [],
                    refreshToken: '',
                    tenantId: null,
                    delete: async () => { },
                    getIdToken: async () => `Student ${session.uid}`,
                    getIdTokenResult: async () => ({ claims: { role: 'student' }, token: '', authTime: '', issuedAtTime: '', expirationTime: '', signInProvider: null, signInSecondFactor: null }),
                    reload: async () => { },
                    toJSON: () => session,
                    phoneNumber: null,
                    photoURL: null,
                    providerId: 'firestore'
                } as any);
                setLoading(false);
                console.log('✅ Student session restored from localStorage');
            } catch (e) {
                console.error('Invalid student session');
                localStorage.removeItem('studentSession');
            }
        }
    }, [isAdmin]);

    // Student authentication (Firebase)
    // Unified authentication (Firebase)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Check if this user is a professor
                const tokenResult = await currentUser.getIdTokenResult();
                const isDescriminatedProfessor = tokenResult.claims.role === 'professor';

                if (isDescriminatedProfessor) {
                    console.log('✅ Professor logged in via Firebase Auth');

                    const sessionData: ProfessorSession = {
                        role: 'professor',
                        email: currentUser.email || '',
                        name: currentUser.displayName || 'Professor',
                        uid: currentUser.uid
                    };

                    setProfessorSession(sessionData);
                    setIsProfessor(true);
                    setToken(tokenResult.token);
                    localStorage.setItem('professorSession', JSON.stringify(sessionData));

                    // Don't set 'user' for professors to keep concerns separated
                    setUser(null);
                } else {
                    // It's a student
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
                }

            } else {
                // Only clear if not manually logged in as admin/professor (legacy)
                if (!localStorage.getItem('adminSession') && !localStorage.getItem('professorSession')) {
                    setUser(null);
                    setToken(null);
                    setProfessorSession(null);
                    setIsProfessor(false);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isProfessor]);

    // Internal professor login handler (called by professorLogin after admin check)
    const handleProfessorLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
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

    // Combined login function that checks for admin first, then professor, then Firestore users
    const professorLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string; isAdmin?: boolean }> => {
        // Check for admin credentials first
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const adminSessionData: AdminSession = {
                role: 'admin',
                email: ADMIN_EMAIL,
                name: 'System Administrator',
                uid: 'admin-001'
            };

            setAdminSession(adminSessionData);
            setIsAdmin(true);
            setToken(`Admin ${adminSessionData.uid}`);
            localStorage.setItem('adminSession', JSON.stringify(adminSessionData));

            console.log('✅ Admin login successful');
            return { success: true, isAdmin: true };
        }

        // Check for hardcoded professor credentials (fallback when backend is not available)
        if (email === PROFESSOR_EMAIL && password === PROFESSOR_PASSWORD) {
            const professorSessionData: ProfessorSession = {
                role: 'professor',
                email: PROFESSOR_EMAIL,
                name: 'Dr. Professor',
                uid: 'professor-001'
            };

            setProfessorSession(professorSessionData);
            setIsProfessor(true);
            setToken(`Professor ${professorSessionData.uid}`);
            localStorage.setItem('professorSession', JSON.stringify(professorSessionData));

            console.log('✅ Professor login successful (fallback credentials)');
            return { success: true };
        }

        // Try standard Firebase Auth login first
        try {
            console.log('🔐 Attempting Firebase Auth login...');
            await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Firebase Auth login successful');
            return { success: true };
        } catch (firebaseError: any) {
            console.log('⚠️ Firebase Auth failed, checking Firestore...');

            // Firebase Auth failed - try Firestore-based login
            try {
                // Check professors collection
                const { getDocs, collection, query, where } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                // Check professors first
                const professorQuery = query(
                    collection(db, 'professors'),
                    where('email', '==', email)
                );
                const professorSnapshot = await getDocs(professorQuery);

                if (!professorSnapshot.empty) {
                    const professorDoc = professorSnapshot.docs[0];
                    const professorData = professorDoc.data();

                    if (professorData.password === password) {
                        const professorSessionData: ProfessorSession = {
                            role: 'professor',
                            email: professorData.email,
                            name: professorData.name,
                            uid: professorDoc.id
                        };

                        setProfessorSession(professorSessionData);
                        setIsProfessor(true);
                        setToken(`Professor ${professorDoc.id}`);
                        localStorage.setItem('professorSession', JSON.stringify(professorSessionData));

                        console.log('✅ Professor login successful (Firestore)');
                        return { success: true };
                    }
                }

                // Check students collection
                const studentQuery = query(
                    collection(db, 'students'),
                    where('email', '==', email)
                );
                const studentSnapshot = await getDocs(studentQuery);

                if (!studentSnapshot.empty) {
                    const studentDoc = studentSnapshot.docs[0];
                    const studentData = studentDoc.data();

                    if (studentData.password === password) {
                        // Create a mock user object for students from Firestore
                        const studentSession = {
                            uid: studentDoc.id,
                            email: studentData.email,
                            displayName: studentData.name,
                            role: 'student',
                            department: studentData.department,
                            year: studentData.year,
                            classId: studentData.classId,
                            className: studentData.className
                        };

                        // Store student session
                        localStorage.setItem('studentSession', JSON.stringify(studentSession));
                        setToken(`Student ${studentDoc.id}`);

                        // Set a pseudo-user for the context
                        setUser({
                            uid: studentDoc.id,
                            email: studentData.email,
                            displayName: studentData.name,
                            emailVerified: true,
                            isAnonymous: false,
                            metadata: {},
                            providerData: [],
                            refreshToken: '',
                            tenantId: null,
                            delete: async () => { },
                            getIdToken: async () => `Student ${studentDoc.id}`,
                            getIdTokenResult: async () => ({ claims: { role: 'student' }, token: '', authTime: '', issuedAtTime: '', expirationTime: '', signInProvider: null, signInSecondFactor: null }),
                            reload: async () => { },
                            toJSON: () => studentSession,
                            phoneNumber: null,
                            photoURL: null,
                            providerId: 'firestore'
                        } as any);

                        console.log('✅ Student login successful (Firestore)');
                        return { success: true };
                    }
                }

                // No matching user found
                return {
                    success: false,
                    error: 'Invalid email or password'
                };

            } catch (firestoreError: any) {
                console.error('Firestore login check error:', firestoreError);
                return {
                    success: false,
                    error: 'Login failed. Please try again.'
                };
            }
        }
    };

    const logout = async () => {
        if (isAdmin) {
            // Admin logout
            setAdminSession(null);
            setIsAdmin(false);
            setToken(null);
            localStorage.removeItem('adminSession');
        } else if (isProfessor) {
            // Professor logout
            setProfessorSession(null);
            setIsProfessor(false);
            setToken(null);
            localStorage.removeItem('professorSession');
        } else {
            // Student logout
            setUser(null);
            setToken(null);
            localStorage.removeItem('studentSession');
            try {
                await firebaseSignOut(auth);
            } catch (e) {
                // Ignore if not signed in via Firebase
            }
        }

        // Clear Google OAuth access token for all users
        localStorage.removeItem('googleAccessToken');
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            logout,
            token,
            isProfessor,
            isAdmin,
            professorSession,
            adminSession,
            professorLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

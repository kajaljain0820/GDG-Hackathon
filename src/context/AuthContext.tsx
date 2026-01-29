'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface StudentSession {
    role: 'student';
    uid: string;
    email: string;
    name: string;
    department: string;
    year: string;
    classId?: string;
    className?: string;
}

interface ProfessorSession {
    role: 'professor';
    email: string;
    name: string;
    uid: string;
    department?: string;
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
    isStudent: boolean;
    professorSession: ProfessorSession | null;
    adminSession: AdminSession | null;
    studentSession: StudentSession | null;
    studentLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    professorLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; isAdmin?: boolean }>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    token: null,
    isProfessor: false,
    isAdmin: false,
    isStudent: false,
    professorSession: null,
    adminSession: null,
    studentSession: null,
    studentLogin: async () => ({ success: false }),
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
    const [isStudent, setIsStudent] = useState(false);
    const [professorSession, setProfessorSession] = useState<ProfessorSession | null>(null);
    const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
    const [studentSession, setStudentSession] = useState<StudentSession | null>(null);

    // Check for existing sessions on mount
    useEffect(() => {
        // Check admin session
        const storedAdminSession = localStorage.getItem('adminSession');
        if (storedAdminSession) {
            try {
                const session = JSON.parse(storedAdminSession);
                setAdminSession(session);
                setIsAdmin(true);
                setToken(`Admin ${session.uid}`);
                setLoading(false);
                return;
            } catch (e) {
                console.error('Invalid admin session');
                localStorage.removeItem('adminSession');
            }
        }

        // Check professor session
        const storedProfessorSession = localStorage.getItem('professorSession');
        if (storedProfessorSession) {
            try {
                const session = JSON.parse(storedProfessorSession);
                setProfessorSession(session);
                setIsProfessor(true);
                setToken(`Professor ${session.uid}`);
                setLoading(false);
                return;
            } catch (e) {
                console.error('Invalid professor session');
                localStorage.removeItem('professorSession');
            }
        }

        // Check student session
        const storedStudentSession = localStorage.getItem('studentSession');
        if (storedStudentSession) {
            try {
                const session = JSON.parse(storedStudentSession);
                setStudentSession(session);
                setIsStudent(true);
                setToken(`Student ${session.uid}`);
                // Create pseudo-user for compatibility
                setUser({
                    uid: session.uid,
                    email: session.email,
                    displayName: session.name,
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
                console.log('✅ Student session restored');
                return;
            } catch (e) {
                console.error('Invalid student session');
                localStorage.removeItem('studentSession');
            }
        }

        // No stored session found
        setLoading(false);
    }, []);

    // Student Login - ONLY checks Firestore students collection
    const studentLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            console.log('🎓 Attempting student login via Firestore...');

            // Query students collection
            const studentQuery = query(
                collection(db, 'students'),
                where('email', '==', email)
            );
            const studentSnapshot = await getDocs(studentQuery);

            if (studentSnapshot.empty) {
                console.log('❌ No student found with this email');
                return { success: false, error: 'Invalid email or password' };
            }

            const studentDoc = studentSnapshot.docs[0];
            const studentData = studentDoc.data();

            // Check password
            if (studentData.password !== password) {
                console.log('❌ Password mismatch');
                return { success: false, error: 'Invalid email or password' };
            }

            // Create student session
            const session: StudentSession = {
                role: 'student',
                uid: studentDoc.id,
                email: studentData.email,
                name: studentData.name,
                department: studentData.department,
                year: studentData.year,
                classId: studentData.classId,
                className: studentData.className
            };

            setStudentSession(session);
            setIsStudent(true);
            setToken(`Student ${studentDoc.id}`);
            localStorage.setItem('studentSession', JSON.stringify(session));

            // Create pseudo-user for compatibility
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
                toJSON: () => session,
                phoneNumber: null,
                photoURL: null,
                providerId: 'firestore'
            } as any);

            console.log('✅ Student login successful');
            return { success: true };

        } catch (error: any) {
            console.error('Student login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    // Professor Login - Checks admin credentials, hardcoded prof, then Firestore professors collection
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

        // Check for hardcoded professor credentials (fallback)
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

        // Check Firestore professors collection
        try {
            console.log('👨‍🏫 Attempting professor login via Firestore...');

            const professorQuery = query(
                collection(db, 'professors'),
                where('email', '==', email)
            );
            const professorSnapshot = await getDocs(professorQuery);

            if (professorSnapshot.empty) {
                console.log('❌ No professor found with this email');
                return { success: false, error: 'Invalid email or password' };
            }

            const professorDoc = professorSnapshot.docs[0];
            const professorData = professorDoc.data();

            // Check password
            if (professorData.password !== password) {
                console.log('❌ Password mismatch');
                return { success: false, error: 'Invalid email or password' };
            }

            // Create professor session
            const session: ProfessorSession = {
                role: 'professor',
                uid: professorDoc.id,
                email: professorData.email,
                name: professorData.name,
                department: professorData.department
            };

            setProfessorSession(session);
            setIsProfessor(true);
            setToken(`Professor ${professorDoc.id}`);
            localStorage.setItem('professorSession', JSON.stringify(session));

            console.log('✅ Professor login successful (Firestore)');
            return { success: true };

        } catch (error: any) {
            console.error('Professor login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const logout = async () => {
        if (isAdmin) {
            setAdminSession(null);
            setIsAdmin(false);
            setToken(null);
            localStorage.removeItem('adminSession');
        } else if (isProfessor) {
            setProfessorSession(null);
            setIsProfessor(false);
            setToken(null);
            localStorage.removeItem('professorSession');
        } else if (isStudent) {
            setStudentSession(null);
            setIsStudent(false);
            setUser(null);
            setToken(null);
            localStorage.removeItem('studentSession');
        } else {
            // Legacy Firebase Auth logout
            setUser(null);
            setToken(null);
            try {
                await firebaseSignOut(auth);
            } catch (e) {
                // Ignore
            }
        }

        // Clear Google OAuth access token
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
            isStudent,
            professorSession,
            adminSession,
            studentSession,
            studentLogin,
            professorLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface BaseUser {
    uid: string;
    email: string;
    displayName: string;
    role: 'student' | 'professor' | 'admin';
}

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
    user: BaseUser | null;
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
    refreshUser: () => Promise<void>;
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
    professorLogin: async () => ({ success: false }),
    refreshUser: async () => { }
});

export const useAuth = () => useContext(AuthContext);

// Admin credentials (hardcoded as per requirement)
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin@123';

// Fallback professor credentials
const PROFESSOR_EMAIL = 'professor@gmail.com';
const PROFESSOR_PASSWORD = 'professor@123';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<BaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [isProfessor, setIsProfessor] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isStudent, setIsStudent] = useState(false);
    const [professorSession, setProfessorSession] = useState<ProfessorSession | null>(null);
    const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
    const [studentSession, setStudentSession] = useState<StudentSession | null>(null);

    const refreshUser = async () => {
        // Check admin session
        const storedAdminSession = localStorage.getItem('adminSession');
        if (storedAdminSession) {
            try {
                const session = JSON.parse(storedAdminSession);
                setAdminSession(session);
                setIsAdmin(true);
                setToken(`Admin ${session.uid}`);
                setUser({
                    uid: session.uid,
                    email: session.email,
                    displayName: session.name,
                    role: 'admin'
                });
                setLoading(false);
                return;
            } catch (e) {
                localStorage.removeItem('adminSession');
            }
        }

        // Check professor session
        const storedProfessorSession = localStorage.getItem('professorSession');
        if (storedProfessorSession) {
            try {
                const session = JSON.parse(storedProfessorSession);

                // Refresh from Firestore to get latest details
                const docSnap = await getDoc(doc(db, 'professors', session.uid));
                if (docSnap.exists()) {
                    const professorData = docSnap.data();
                    const refreshedSession: ProfessorSession = {
                        role: 'professor',
                        uid: docSnap.id,
                        email: professorData.email,
                        name: professorData.name,
                        department: professorData.department
                    };
                    setProfessorSession(refreshedSession);
                    setIsProfessor(true);
                    setToken(`Professor ${refreshedSession.uid}`);
                    setUser({
                        uid: refreshedSession.uid,
                        email: refreshedSession.email,
                        displayName: refreshedSession.name,
                        role: 'professor'
                    });
                    localStorage.setItem('professorSession', JSON.stringify(refreshedSession));
                } else {
                    // Fallback to stored session
                    setProfessorSession(session);
                    setIsProfessor(true);
                    setToken(`Professor ${session.uid}`);
                    setUser({
                        uid: session.uid,
                        email: session.email,
                        displayName: session.name,
                        role: 'professor'
                    });
                }
                setLoading(false);
                return;
            } catch (e) {
                console.error("Error refreshing professor session:", e);
                localStorage.removeItem('professorSession');
            }
        }

        // Check student session
        const storedStudentSession = localStorage.getItem('studentSession');
        if (storedStudentSession) {
            try {
                const session = JSON.parse(storedStudentSession);

                // Refresh from Firestore to get latest details
                const docSnap = await getDoc(doc(db, 'students', session.uid));
                if (docSnap.exists()) {
                    const studentData = docSnap.data();
                    const refreshedSession: StudentSession = {
                        role: 'student',
                        uid: docSnap.id,
                        email: studentData.email,
                        name: studentData.name,
                        department: studentData.department,
                        year: studentData.year,
                        classId: studentData.classId,
                        className: studentData.className
                    };
                    setStudentSession(refreshedSession);
                    setIsStudent(true);
                    setToken(`Student ${refreshedSession.uid}`);
                    setUser({
                        uid: refreshedSession.uid,
                        email: refreshedSession.email,
                        displayName: refreshedSession.name,
                        role: 'student'
                    });
                    localStorage.setItem('studentSession', JSON.stringify(refreshedSession));
                } else {
                    // Fallback to stored session
                    setStudentSession(session);
                    setIsStudent(true);
                    setToken(`Student ${session.uid}`);
                    setUser({
                        uid: session.uid,
                        email: session.email,
                        displayName: session.name,
                        role: 'student'
                    });
                }
                setLoading(false);
                return;
            } catch (e) {
                console.error("Error refreshing student session:", e);
                localStorage.removeItem('studentSession');
            }
        }

        setLoading(false);
    };

    // Check for existing sessions on mount and refresh from Firestore
    useEffect(() => {
        refreshUser();
    }, []);

    const studentLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const studentQuery = query(collection(db, 'students'), where('email', '==', email));
            const studentSnapshot = await getDocs(studentQuery);

            if (studentSnapshot.empty) return { success: false, error: 'Invalid email or password' };

            const studentDoc = studentSnapshot.docs[0];
            const studentData = studentDoc.data();

            if (studentData.password !== password) return { success: false, error: 'Invalid email or password' };

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
            setUser({
                uid: studentDoc.id,
                email: session.email,
                displayName: session.name,
                role: 'student'
            });
            localStorage.setItem('studentSession', JSON.stringify(session));

            return { success: true };
        } catch (error: any) {
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const professorLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string; isAdmin?: boolean }> => {
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
            setUser({
                uid: adminSessionData.uid,
                email: adminSessionData.email,
                displayName: adminSessionData.name,
                role: 'admin'
            });
            localStorage.setItem('adminSession', JSON.stringify(adminSessionData));
            return { success: true, isAdmin: true };
        }

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
            setUser({
                uid: professorSessionData.uid,
                email: professorSessionData.email,
                displayName: professorSessionData.name,
                role: 'professor'
            });
            localStorage.setItem('professorSession', JSON.stringify(professorSessionData));
            return { success: true };
        }

        try {
            const professorQuery = query(collection(db, 'professors'), where('email', '==', email));
            const professorSnapshot = await getDocs(professorQuery);

            if (professorSnapshot.empty) return { success: false, error: 'Invalid email or password' };

            const professorDoc = professorSnapshot.docs[0];
            const professorData = professorDoc.data();

            if (professorData.password !== password) return { success: false, error: 'Invalid email or password' };

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
            setUser({
                uid: professorDoc.id,
                email: session.email,
                displayName: session.name,
                role: 'professor'
            });
            localStorage.setItem('professorSession', JSON.stringify(session));
            return { success: true };
        } catch (error: any) {
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const logout = async () => {
        setAdminSession(null);
        setProfessorSession(null);
        setStudentSession(null);
        setIsAdmin(false);
        setIsProfessor(false);
        setIsStudent(false);
        setUser(null);
        setToken(null);
        localStorage.removeItem('adminSession');
        localStorage.removeItem('professorSession');
        localStorage.removeItem('studentSession');
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
            professorLogin,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

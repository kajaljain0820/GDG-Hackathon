// Firebase Admin Service - Manage Students, Professors, Classes, Branches
import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// INTERFACES
// ============================================

export interface Student {
    id?: string;
    uid?: string;
    name: string;
    email: string;
    department: string;
    year: string;
    classId?: string;
    className?: string;
    status: 'active' | 'inactive';
    createdAt?: any;
    updatedAt?: any;
}

export interface Professor {
    id?: string;
    name: string;
    email: string;
    department: string;
    courses: string[];
    status: 'active' | 'inactive';
    createdAt?: any;
    updatedAt?: any;
}

export interface Class {
    id?: string;
    name: string;
    title: string;
    department: string;
    professorId?: string;
    professorName?: string;
    studentCount: number;
    status: 'active' | 'inactive';
    createdAt?: any;
    updatedAt?: any;
}

export interface Branch {
    id?: string;
    name: string;
    code: string;
    studentCount: number;
    professorCount: number;
    createdAt?: any;
    updatedAt?: any;
}

// ============================================
// STUDENTS COLLECTION
// ============================================

export async function createStudent(studentData: any): Promise<string> {
    try {
        // Create student document directly in Firestore
        // Note: For full Firebase Auth integration, you would need Firebase Functions (Blaze plan)
        // This creates the Firestore document. Users can login via Firebase Auth separately.

        const student = {
            name: studentData.name,
            email: studentData.email,
            password: studentData.password, // Store temporarily for reference (in production, use proper auth)
            department: studentData.department,
            year: studentData.year,
            classId: studentData.classId || '',
            className: studentData.className || '',
            role: 'student',
            status: studentData.status || 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'students'), student);
        console.log('✅ Student created:', docRef.id);

        // Update branch student count
        await updateBranchCounts();
        await updateClassStudentCount();

        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating student:', error);
        throw error;
    }
}

export async function getStudents(): Promise<Student[]> {
    try {
        const snapshot = await getDocs(collection(db, 'students'));
        const students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Student[];

        console.log('✅ Fetched', students.length, 'students');
        return students;
    } catch (error) {
        console.error('❌ Error fetching students:', error);
        return [];
    }
}

export async function updateStudent(studentId: string, data: Partial<Student>): Promise<void> {
    try {
        await updateDoc(doc(db, 'students', studentId), {
            ...data,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Student updated:', studentId);
    } catch (error) {
        console.error('❌ Error updating student:', error);
        throw error;
    }
}

export async function deleteStudent(studentId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'students', studentId));
        console.log('✅ Student deleted:', studentId);
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        throw error;
    }
}

// ============================================
// PROFESSORS COLLECTION
// ============================================

export async function createProfessor(professorData: any): Promise<string> {
    try {
        // Create professor document directly in Firestore
        // Note: For full Firebase Auth integration, you would need Firebase Functions (Blaze plan)
        // This creates the Firestore document. Users can login via Firebase Auth separately.

        const professor = {
            name: professorData.name,
            email: professorData.email,
            password: professorData.password, // Store temporarily for reference (in production, use proper auth)
            department: professorData.department,
            courses: professorData.courses || [],
            role: 'professor',
            status: professorData.status || 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'professors'), professor);
        console.log('✅ Professor created:', docRef.id);

        // Update branch professor count
        await updateBranchCounts();

        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating professor:', error);
        throw error;
    }
}

export async function getProfessors(): Promise<Professor[]> {
    try {
        const snapshot = await getDocs(collection(db, 'professors'));
        const professors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            courses: doc.data().courses || [],
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Professor[];

        console.log('✅ Fetched', professors.length, 'professors');
        return professors;
    } catch (error) {
        console.error('❌ Error fetching professors:', error);
        return [];
    }
}

export async function updateProfessor(professorId: string, data: Partial<Professor>): Promise<void> {
    try {
        await updateDoc(doc(db, 'professors', professorId), {
            ...data,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Professor updated:', professorId);
    } catch (error) {
        console.error('❌ Error updating professor:', error);
        throw error;
    }
}

export async function deleteProfessor(professorId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'professors', professorId));
        console.log('✅ Professor deleted:', professorId);

        // Update branch professor count
        await updateBranchCounts();
    } catch (error) {
        console.error('❌ Error deleting professor:', error);
        throw error;
    }
}

// ============================================
// CLASSES COLLECTION
// ============================================

export async function createClass(classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const classDoc = {
            ...classData,
            studentCount: classData.studentCount || 0,
            status: classData.status || 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'classes'), classDoc);
        console.log('✅ Class created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating class:', error);
        throw error;
    }
}

export async function getClasses(): Promise<Class[]> {
    try {
        const snapshot = await getDocs(collection(db, 'classes'));
        const classes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Class[];

        console.log('✅ Fetched', classes.length, 'classes');
        return classes;
    } catch (error) {
        console.error('❌ Error fetching classes:', error);
        return [];
    }
}

export async function updateClass(classId: string, data: Partial<Class>): Promise<void> {
    try {
        await updateDoc(doc(db, 'classes', classId), {
            ...data,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Class updated:', classId);
    } catch (error) {
        console.error('❌ Error updating class:', error);
        throw error;
    }
}

export async function deleteClass(classId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'classes', classId));
        console.log('✅ Class deleted:', classId);
    } catch (error) {
        console.error('❌ Error deleting class:', error);
        throw error;
    }
}

// ============================================
// BRANCHES COLLECTION
// ============================================

export async function createBranch(branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const branch = {
            ...branchData,
            studentCount: branchData.studentCount || 0,
            professorCount: branchData.professorCount || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'branches'), branch);
        console.log('✅ Branch created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating branch:', error);
        throw error;
    }
}

export async function getBranches(): Promise<Branch[]> {
    try {
        const snapshot = await getDocs(collection(db, 'branches'));
        const branches = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Branch[];

        console.log('✅ Fetched', branches.length, 'branches');
        return branches;
    } catch (error) {
        console.error('❌ Error fetching branches:', error);
        return [];
    }
}

export async function updateBranch(branchId: string, data: Partial<Branch>): Promise<void> {
    try {
        await updateDoc(doc(db, 'branches', branchId), {
            ...data,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Branch updated:', branchId);
    } catch (error) {
        console.error('❌ Error updating branch:', error);
        throw error;
    }
}

export async function deleteBranch(branchId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'branches', branchId));
        console.log('✅ Branch deleted:', branchId);
    } catch (error) {
        console.error('❌ Error deleting branch:', error);
        throw error;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Update branch counts based on students and professors
async function updateBranchCounts(): Promise<void> {
    try {
        const [students, professors, branches] = await Promise.all([
            getStudents(),
            getProfessors(),
            getBranches()
        ]);

        for (const branch of branches) {
            const studentCount = students.filter(s => s.department === branch.name).length;
            const professorCount = professors.filter(p => p.department === branch.name).length;

            if (branch.id && (branch.studentCount !== studentCount || branch.professorCount !== professorCount)) {
                await updateDoc(doc(db, 'branches', branch.id), {
                    studentCount,
                    professorCount,
                    updatedAt: serverTimestamp()
                });
            }
        }

        console.log('✅ Branch counts updated');
    } catch (error) {
        console.error('❌ Error updating branch counts:', error);
    }
}

// Update class student counts
async function updateClassStudentCount(): Promise<void> {
    try {
        const [students, classes] = await Promise.all([
            getStudents(),
            getClasses()
        ]);

        for (const cls of classes) {
            const studentCount = students.filter(s => s.classId === cls.id || s.className === cls.name).length;

            if (cls.id && cls.studentCount !== studentCount) {
                await updateDoc(doc(db, 'classes', cls.id), {
                    studentCount,
                    updatedAt: serverTimestamp()
                });
            }
        }

        console.log('✅ Class student counts updated');
    } catch (error) {
        console.error('❌ Error updating class student counts:', error);
    }
}

// Get dashboard statistics
export async function getAdminStats(): Promise<{
    totalStudents: number;
    totalProfessors: number;
    totalClasses: number;
    totalBranches: number;
}> {
    try {
        const [students, professors, classes, branches] = await Promise.all([
            getStudents(),
            getProfessors(),
            getClasses(),
            getBranches()
        ]);

        return {
            totalStudents: students.length,
            totalProfessors: professors.length,
            totalClasses: classes.length,
            totalBranches: branches.length
        };
    } catch (error) {
        console.error('❌ Error getting admin stats:', error);
        return {
            totalStudents: 0,
            totalProfessors: 0,
            totalClasses: 0,
            totalBranches: 0
        };
    }
}

// Export all services
export const adminService = {
    // Students
    createStudent,
    getStudents,
    updateStudent,
    deleteStudent,

    // Professors
    createProfessor,
    getProfessors,
    updateProfessor,
    deleteProfessor,

    // Classes
    createClass,
    getClasses,
    updateClass,
    deleteClass,

    // Branches
    createBranch,
    getBranches,
    updateBranch,
    deleteBranch,

    // Stats
    getAdminStats
};

export default adminService;

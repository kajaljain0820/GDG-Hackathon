// Firebase Task/Assignment Service
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// INTERFACES
// ============================================

export interface Assignment {
    id?: string;
    title: string;
    description: string;
    dueDate: string;
    assignedClass: string;
    professorId: string;
    professorName: string;
    status: 'active' | 'completed' | 'overdue';
    createdAt?: any;
    updatedAt?: any;
}

export interface StudentSubmission {
    id?: string;
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    status: 'pending' | 'completed';
    completedAt?: any;
    createdAt?: any;
}

export interface Notification {
    id?: string;
    userId: string;
    type: 'assignment' | 'reminder' | 'update';
    title: string;
    message: string;
    assignmentId?: string;
    read: boolean;
    createdAt?: any;
}

// ============================================
// ASSIGNMENTS COLLECTION
// ============================================

export async function createAssignment(assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const assignment = {
            ...assignmentData,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'assignments'), assignment);
        console.log('✅ Assignment created:', docRef.id);

        // Create notifications for all students in the class
        await createAssignmentNotifications(docRef.id, assignmentData);

        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating assignment:', error);
        throw error;
    }
}

export async function getAssignments(professorId?: string): Promise<Assignment[]> {
    try {
        let q = query(collection(db, 'assignments'));

        if (professorId) {
            q = query(collection(db, 'assignments'), where('professorId', '==', professorId));
        }

        const snapshot = await getDocs(q);
        const assignments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as Assignment[];

        // Sort by due date
        assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        console.log('✅ Fetched', assignments.length, 'assignments');
        return assignments;
    } catch (error) {
        console.error('❌ Error fetching assignments:', error);
        return [];
    }
}

export async function getAssignmentsByClass(className: string): Promise<Assignment[]> {
    try {
        const q = query(
            collection(db, 'assignments'),
            where('assignedClass', '==', className)
        );

        const snapshot = await getDocs(q);
        const assignments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as Assignment[];

        assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        return assignments;
    } catch (error) {
        console.error('❌ Error fetching class assignments:', error);
        return [];
    }
}

export async function updateAssignment(assignmentId: string, data: Partial<Assignment>): Promise<void> {
    try {
        await updateDoc(doc(db, 'assignments', assignmentId), {
            ...data,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Assignment updated:', assignmentId);
    } catch (error) {
        console.error('❌ Error updating assignment:', error);
        throw error;
    }
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'assignments', assignmentId));
        console.log('✅ Assignment deleted:', assignmentId);
    } catch (error) {
        console.error('❌ Error deleting assignment:', error);
        throw error;
    }
}

// ============================================
// STUDENT SUBMISSIONS
// ============================================

export async function getStudentSubmission(assignmentId: string, studentId: string): Promise<StudentSubmission | null> {
    try {
        const q = query(
            collection(db, 'submissions'),
            where('assignmentId', '==', assignmentId),
            where('studentId', '==', studentId)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as StudentSubmission;
    } catch (error) {
        console.error('❌ Error getting submission:', error);
        return null;
    }
}

export async function getSubmissionsForAssignment(assignmentId: string): Promise<StudentSubmission[]> {
    try {
        const q = query(
            collection(db, 'submissions'),
            where('assignmentId', '==', assignmentId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as StudentSubmission[];
    } catch (error) {
        console.error('❌ Error getting submissions:', error);
        return [];
    }
}

export async function getStudentSubmissions(studentId: string): Promise<StudentSubmission[]> {
    try {
        const q = query(
            collection(db, 'submissions'),
            where('studentId', '==', studentId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as StudentSubmission[];
    } catch (error) {
        console.error('❌ Error getting student submissions:', error);
        return [];
    }
}

export async function markTaskComplete(
    assignmentId: string,
    studentId: string,
    studentName: string,
    studentEmail: string
): Promise<void> {
    try {
        // Check if submission already exists
        const existing = await getStudentSubmission(assignmentId, studentId);

        if (existing) {
            // Update existing submission
            await updateDoc(doc(db, 'submissions', existing.id!), {
                status: 'completed',
                completedAt: serverTimestamp()
            });
        } else {
            // Create new submission
            await addDoc(collection(db, 'submissions'), {
                assignmentId,
                studentId,
                studentName,
                studentEmail,
                status: 'completed',
                completedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });
        }

        console.log('✅ Task marked as complete');
    } catch (error) {
        console.error('❌ Error marking task complete:', error);
        throw error;
    }
}

export async function markTaskPending(assignmentId: string, studentId: string): Promise<void> {
    try {
        const existing = await getStudentSubmission(assignmentId, studentId);

        if (existing) {
            await updateDoc(doc(db, 'submissions', existing.id!), {
                status: 'pending',
                completedAt: null
            });
        }

        console.log('✅ Task marked as pending');
    } catch (error) {
        console.error('❌ Error marking task pending:', error);
        throw error;
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

async function createAssignmentNotifications(assignmentId: string, assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
        // Get all students (for now, create a general notification)
        // In production, you'd fetch students from the specific class
        const notification = {
            userId: 'all', // Broadcast to all students
            type: 'assignment',
            title: 'New Assignment',
            message: `${assignment.title} - Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
            assignmentId,
            assignedClass: assignment.assignedClass,
            read: false,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'notifications'), notification);
        console.log('✅ Notification created for assignment');
    } catch (error) {
        console.error('❌ Error creating notifications:', error);
    }
}

export async function getNotifications(userId: string, className?: string): Promise<Notification[]> {
    try {
        // Get notifications for this user OR broadcast notifications
        const q = query(collection(db, 'notifications'));

        const snapshot = await getDocs(q);
        const notifications = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            }))
            .filter((n: any) => {
                // Check if notification is for user or all
                const isForUser = n.userId === userId || n.userId === 'all';

                // If className is provided, filter by assigned class
                if (className && n.assignedClass) {
                    return isForUser && n.assignedClass === className;
                }

                return isForUser;
            }) as Notification[];

        // Sort by newest first
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return notifications;
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        return [];
    }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true
        });
    } catch (error) {
        console.error('❌ Error marking notification read:', error);
    }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    try {
        const notifications = await getNotifications(userId);
        const unread = notifications.filter(n => !n.read);

        for (const n of unread) {
            if (n.id) {
                await markNotificationRead(n.id);
            }
        }
    } catch (error) {
        console.error('❌ Error marking all notifications read:', error);
    }
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

export function subscribeToAssignments(
    callback: (assignments: Assignment[]) => void,
    professorId?: string
): () => void {
    let q = query(collection(db, 'assignments'));

    if (professorId) {
        q = query(collection(db, 'assignments'), where('professorId', '==', professorId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const assignments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as Assignment[];

        assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        callback(assignments);
    });

    return unsubscribe;
}

export function subscribeToSubmissions(
    assignmentId: string,
    callback: (submissions: StudentSubmission[]) => void
): () => void {
    const q = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const submissions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as StudentSubmission[];

        callback(submissions);
    });

    return unsubscribe;
}

export function subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    className?: string
): () => void {
    const q = query(collection(db, 'notifications'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            }))
            .filter((n: any) => {
                const isForUser = n.userId === userId || n.userId === 'all';

                // Filter by class if provided
                if (className && n.assignedClass) {
                    return isForUser && n.assignedClass === className;
                }

                return isForUser;
            }) as Notification[];

        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(notifications);
    });

    return unsubscribe;
}

// Export service
export const taskService = {
    // Assignments
    createAssignment,
    getAssignments,
    getAssignmentsByClass,
    updateAssignment,
    deleteAssignment,

    // Submissions
    getStudentSubmission,
    getSubmissionsForAssignment,
    getStudentSubmissions,
    markTaskComplete,
    markTaskPending,

    // Notifications
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Real-time
    subscribeToAssignments,
    subscribeToSubmissions,
    subscribeToNotifications
};

export default taskService;

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import {
    ClipboardList,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    User,
    RefreshCw,
    Check,
    Circle,
    Loader2,
    GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import taskService, { Assignment, StudentSubmission } from '@/lib/taskService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function StudentTasksPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<{ [key: string]: StudentSubmission }>({});
    const [updating, setUpdating] = useState<string | null>(null);
    const [studentClass, setStudentClass] = useState<{ classId: string; className: string } | null>(null);

    useEffect(() => {
        if (!user) {
            // Allow loading anyway for demo
        }

        loadData();

        // Subscribe to real-time assignment updates
        const unsubscribe = taskService.subscribeToAssignments((updatedAssignments) => {
            // Filter by student's class
            if (studentClass?.className) {
                const classAssignments = updatedAssignments.filter(
                    a => a.assignedClass === studentClass.className
                );
                setAssignments(classAssignments);
            } else {
                setAssignments(updatedAssignments);
            }
        });

        return () => unsubscribe();
    }, [user, router, studentClass?.className]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Get student's class info from Firestore
            let userClassInfo = null;
            if (user?.uid) {
                const studentDoc = await getDoc(doc(db, 'students', user.uid));
                if (studentDoc.exists()) {
                    const data = studentDoc.data();
                    userClassInfo = {
                        classId: data.classId || '',
                        className: data.className || ''
                    };
                    setStudentClass(userClassInfo);
                }

                // Also check users collection as fallback
                if (!userClassInfo?.classId) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (data.classId) {
                            userClassInfo = {
                                classId: data.classId,
                                className: data.className || ''
                            };
                            setStudentClass(userClassInfo);
                        }
                    }
                }
            }

            // Get assignments filtered by class
            let assignmentsData: Assignment[] = [];
            if (userClassInfo?.className) {
                assignmentsData = await taskService.getAssignmentsByClass(userClassInfo.className);
            } else {
                // Fallback: get all assignments
                assignmentsData = await taskService.getAssignments();
            }
            setAssignments(assignmentsData);

            // Get student's submissions
            if (user?.uid) {
                const studentSubs = await taskService.getStudentSubmissions(user.uid);
                const subsMap: { [key: string]: StudentSubmission } = {};
                studentSubs.forEach(sub => {
                    subsMap[sub.assignmentId] = sub;
                });
                setSubmissions(subsMap);
            }

            console.log('✅ Student tasks loaded, class:', userClassInfo?.className || 'all');
        } catch (error) {
            console.error('❌ Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleToggleComplete = async (assignment: Assignment) => {
        if (!user || !assignment.id) return;

        setUpdating(assignment.id);

        try {
            const currentSubmission = submissions[assignment.id];
            const isCompleted = currentSubmission?.status === 'completed';

            if (isCompleted) {
                // Mark as pending
                await taskService.markTaskPending(assignment.id, user.uid);
                setSubmissions(prev => ({
                    ...prev,
                    [assignment.id!]: { ...prev[assignment.id!], status: 'pending' }
                }));
            } else {
                // Mark as complete
                await taskService.markTaskComplete(
                    assignment.id,
                    user.uid,
                    user.displayName || user.email?.split('@')[0] || 'Student',
                    user.email || ''
                );
                setSubmissions(prev => ({
                    ...prev,
                    [assignment.id!]: {
                        ...prev[assignment.id!],
                        assignmentId: assignment.id!,
                        studentId: user.uid,
                        studentName: user.displayName || user.email?.split('@')[0] || 'Student',
                        studentEmail: user.email || '',
                        status: 'completed'
                    }
                }));
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task status');
        } finally {
            setUpdating(null);
        }
    };

    const getTaskStatus = (assignment: Assignment) => {
        const submission = submissions[assignment.id!];
        const isCompleted = submission?.status === 'completed';
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        const isOverdue = dueDate < now;

        if (isCompleted) {
            return { color: 'bg-green-100 text-green-700 border-green-200', text: 'Completed', icon: CheckCircle };
        }
        if (isOverdue) {
            return { color: 'bg-red-100 text-red-700 border-red-200', text: 'Overdue', icon: AlertCircle };
        }
        return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: 'Pending', icon: Clock };
    };

    const getDaysRemaining = (dueDate: string) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return 'Due today!';
        if (diffDays === 1) return 'Due tomorrow';
        return `${diffDays} days left`;
    };

    // Count stats
    const completedCount = assignments.filter(a => submissions[a.id!]?.status === 'completed').length;
    const pendingCount = assignments.filter(a => submissions[a.id!]?.status !== 'completed').length;
    const overdueCount = assignments.filter(a =>
        submissions[a.id!]?.status !== 'completed' && new Date(a.dueDate) < new Date()
    ).length;

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading Your Tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-500">Track and complete your assignments</p>
                        {studentClass?.className && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                <GraduationCap className="w-4 h-4" />
                                {studentClass.className}
                            </span>
                        )}
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-600 font-medium">Pending</p>
                            <p className="text-3xl font-bold text-yellow-900 mt-1">{pendingCount}</p>
                        </div>
                        <Clock className="w-12 h-12 text-yellow-500" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Completed</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">{completedCount}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Overdue</p>
                            <p className="text-3xl font-bold text-red-900 mt-1">{overdueCount}</p>
                        </div>
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                </GlassCard>
            </div>

            {/* Tasks List */}
            {assignments.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Tasks Yet</h3>
                    <p className="text-slate-500">Your professor hasn't assigned any tasks yet.</p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {assignments.map(assignment => {
                        const status = getTaskStatus(assignment);
                        const StatusIcon = status.icon;
                        const isCompleted = submissions[assignment.id!]?.status === 'completed';
                        const isUpdating = updating === assignment.id;

                        return (
                            <motion.div
                                key={assignment.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <GlassCard
                                    className={`p-6 transition-all ${isCompleted
                                        ? 'bg-green-50/50 border-green-200'
                                        : 'hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => handleToggleComplete(assignment)}
                                            disabled={isUpdating || !user}
                                            className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-slate-300 hover:border-green-500'
                                                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isCompleted ? (
                                                <Check className="w-4 h-4" />
                                            ) : null}
                                        </button>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className={`text-lg font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                                                        }`}>
                                                        {assignment.title}
                                                    </h3>
                                                    <p className={`text-sm mt-1 ${isCompleted ? 'text-slate-400' : 'text-slate-600'
                                                        }`}>
                                                        {assignment.description}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.text}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span className={
                                                        getDaysRemaining(assignment.dueDate).includes('overdue')
                                                            ? 'text-red-600 font-medium'
                                                            : getDaysRemaining(assignment.dueDate).includes('today')
                                                                ? 'text-orange-600 font-medium'
                                                                : ''
                                                    }>
                                                        {getDaysRemaining(assignment.dueDate)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span>{assignment.professorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Progress Bar */}
            {assignments.length > 0 && (
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Your Progress</h3>
                        <span className="text-sm text-slate-500">
                            {completedCount} of {assignments.length} completed
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${assignments.length > 0 ? (completedCount / assignments.length) * 100 : 0}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                        />
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-2">
                        {assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0}% complete
                    </p>
                </GlassCard>
            )}

            {/* Login reminder for guests */}
            {!user && (
                <GlassCard className="p-6 bg-blue-50 border-blue-200">
                    <p className="text-center text-blue-700">
                        <strong>Note:</strong> Login to mark tasks as complete and sync your progress.
                    </p>
                </GlassCard>
            )}
        </div>
    );
}

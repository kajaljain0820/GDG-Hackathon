'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import {
    ClipboardList,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    Users,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
    Loader2,
    RefreshCw,
    Eye,
    GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import taskService, { Assignment, StudentSubmission } from '@/lib/taskService';
import adminService from '@/lib/adminService';

export default function ProfessorAssignmentsPage() {
    const { isProfessor, professorSession, isAdmin } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [classes, setClasses] = useState<{ id: string; name: string; title: string }[]>([]);
    const [submissions, setSubmissions] = useState<{ [key: string]: StudentSubmission[] }>({});

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        assignedClass: ''
    });

    useEffect(() => {
        // Block admin from accessing professor pages
        if (isAdmin) {
            router.push('/dashboard/admin');
            return;
        }

        if (!isProfessor && !professorSession) {
            router.push('/');
            return;
        }

        loadData();

        // Subscribe to real-time updates
        const unsubscribe = taskService.subscribeToAssignments((updatedAssignments) => {
            setAssignments(updatedAssignments);
        }, professorSession?.uid);

        return () => unsubscribe();
    }, [isProfessor, professorSession, isAdmin, router]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load assignments and classes in parallel
            const [assignmentsData, classesData] = await Promise.all([
                taskService.getAssignments(professorSession?.uid),
                adminService.getClasses()
            ]);

            setAssignments(assignmentsData);
            setClasses(classesData.map(c => ({ id: c.id!, name: c.name, title: c.title })));

            // Load submissions for each assignment
            const submissionsMap: { [key: string]: StudentSubmission[] } = {};
            for (const assignment of assignmentsData) {
                if (assignment.id) {
                    const subs = await taskService.getSubmissionsForAssignment(assignment.id);
                    submissionsMap[assignment.id] = subs;
                }
            }
            setSubmissions(submissionsMap);

            console.log('✅ Professor assignments loaded');
        } catch (error) {
            console.error('❌ Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const openCreateModal = () => {
        setFormData({
            title: '',
            description: '',
            dueDate: '',
            assignedClass: ''
        });
        setFormError('');
        setShowModal(true);
    };

    const handleCreateAssignment = async () => {
        if (!formData.title || !formData.description || !formData.dueDate || !formData.assignedClass) {
            setFormError('Please fill in all required fields');
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            await taskService.createAssignment({
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate,
                assignedClass: formData.assignedClass,
                professorId: professorSession?.uid || 'unknown',
                professorName: professorSession?.name || 'Professor',
                status: 'active'
            });

            setShowModal(false);
            await loadData();
        } catch (error: any) {
            console.error('Error creating assignment:', error);
            setFormError(error.message || 'Failed to create assignment');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;

        try {
            await taskService.deleteAssignment(assignmentId);
            setAssignments(assignments.filter(a => a.id !== assignmentId));
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('Failed to delete assignment');
        }
    };

    const openSubmissionsModal = async (assignment: Assignment) => {
        setSelectedAssignment(assignment);

        // Refresh submissions for this assignment
        if (assignment.id) {
            const subs = await taskService.getSubmissionsForAssignment(assignment.id);
            setSubmissions(prev => ({ ...prev, [assignment.id!]: subs }));
        }

        setShowSubmissionsModal(true);
    };

    const getStatusBadge = (assignment: Assignment) => {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        const isOverdue = dueDate < now;

        if (assignment.status === 'completed') {
            return { color: 'bg-green-100 text-green-700', text: 'Completed', icon: CheckCircle };
        }
        if (isOverdue) {
            return { color: 'bg-red-100 text-red-700', text: 'Overdue', icon: AlertCircle };
        }
        return { color: 'bg-blue-100 text-blue-700', text: 'Active', icon: Clock };
    };

    const getCompletionStats = (assignmentId: string) => {
        const subs = submissions[assignmentId] || [];
        const completed = subs.filter(s => s.status === 'completed').length;
        return { completed, total: subs.length };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading Assignments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Task Assignments</h1>
                    <p className="text-slate-500 mt-1">Create and manage assignments for your classes</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={openCreateModal}
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Assignment
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Total Assignments</p>
                            <p className="text-3xl font-bold text-purple-900 mt-1">{assignments.length}</p>
                        </div>
                        <ClipboardList className="w-12 h-12 text-purple-500" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Active</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">
                                {assignments.filter(a => a.status === 'active' && new Date(a.dueDate) >= new Date()).length}
                            </p>
                        </div>
                        <Clock className="w-12 h-12 text-blue-500" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Overdue</p>
                            <p className="text-3xl font-bold text-red-900 mt-1">
                                {assignments.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'completed').length}
                            </p>
                        </div>
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Classes</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">{classes.length}</p>
                        </div>
                        <Users className="w-12 h-12 text-green-500" />
                    </div>
                </GlassCard>
            </div>

            {/* Assignments Table */}
            <GlassCard className="overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">All Assignments</h2>
                </div>

                {assignments.length === 0 ? (
                    <div className="text-center py-12">
                        <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 mb-4">No assignments yet</p>
                        <Button
                            onClick={openCreateModal}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Create First Assignment
                        </Button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Title</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Description</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Due Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Class</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Submissions</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map(assignment => {
                                const status = getStatusBadge(assignment);
                                const StatusIcon = status.icon;
                                const stats = getCompletionStats(assignment.id!);

                                return (
                                    <tr key={assignment.id} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800">{assignment.title}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 text-sm line-clamp-2">
                                                {assignment.description.length > 60
                                                    ? assignment.description.substring(0, 60) + '...'
                                                    : assignment.description}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(assignment.dueDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                {assignment.assignedClass}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => openSubmissionsModal(assignment)}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    {stats.completed} completed
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openSubmissionsModal(assignment)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                    title="View Submissions"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAssignment(assignment.id!)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </GlassCard>

            {/* Create Assignment Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => !saving && setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">New Assignment</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Assignment Title *
                                    </label>
                                    <Input
                                        placeholder="e.g., Week 3 Programming Exercise"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        disabled={saving}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        placeholder="Describe the assignment requirements..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        disabled={saving}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        disabled={saving}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Assigned Class *
                                    </label>
                                    <select
                                        value={formData.assignedClass}
                                        onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                                        disabled={saving}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="">Select a class</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.name}>
                                                {cls.name} - {cls.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1"
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateAssignment}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Posting...
                                        </>
                                    ) : (
                                        'Post Assignment'
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Submissions Modal */}
            <AnimatePresence>
                {showSubmissionsModal && selectedAssignment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowSubmissionsModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Student Submissions</h2>
                                    <p className="text-sm text-slate-500">{selectedAssignment.title}</p>
                                </div>
                                <button
                                    onClick={() => setShowSubmissionsModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {(submissions[selectedAssignment.id!] || []).length === 0 ? (
                                <div className="text-center py-8">
                                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No submissions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(submissions[selectedAssignment.id!] || []).map(sub => (
                                        <div
                                            key={sub.id}
                                            className={`p-4 rounded-xl flex items-center justify-between ${sub.status === 'completed'
                                                ? 'bg-green-50 border border-green-200'
                                                : 'bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sub.status === 'completed' ? 'bg-green-100' : 'bg-slate-100'
                                                    }`}>
                                                    <GraduationCap className={`w-5 h-5 ${sub.status === 'completed' ? 'text-green-600' : 'text-slate-400'
                                                        }`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{sub.studentName}</p>
                                                    <p className="text-xs text-slate-500">{sub.studentEmail}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${sub.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {sub.status === 'completed' ? 'Completed' : 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

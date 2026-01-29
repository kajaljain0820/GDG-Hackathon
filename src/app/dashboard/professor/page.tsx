'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import {
    AlertCircle,
    MessageSquare,
    TrendingUp,
    Video,
    CheckCircle,
    Clock,
    Users,
    BookOpen,
    BarChart3,
    AlertTriangle,
    LogOut
} from 'lucide-react';
import escalationService from '@/lib/escalationService';
import firestoreService from '@/lib/firestoreService';
import sessionsService from '@/lib/sessionsService';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfessorDashboard() {
    const { user, isProfessor, professorSession, isAdmin } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [escalatedDoubts, setEscalatedDoubts] = useState<any[]>([]);
    const [confusionInsights, setConfusionInsights] = useState<any[]>([]);
    const [studentSessions, setStudentSessions] = useState<any[]>([]);
    const [selectedDoubt, setSelectedDoubt] = useState<any | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replying, setReplying] = useState(false);

    // STRICT ACCESS CONTROL - Professor Only (no admin, no students)
    useEffect(() => {
        // Block admin from accessing professor dashboard
        if (isAdmin) {
            console.log('❌ Access denied: Admin attempting to access professor dashboard');
            router.push('/dashboard/admin');
            return;
        }

        // Block students from accessing professor dashboard
        if (!isProfessor && !professorSession) {
            console.log('❌ Access denied: Student attempting to access professor dashboard');
            router.push('/');
            return;
        }

        if (isProfessor && professorSession) {
            console.log('✅ Professor access granted:', professorSession.email);
        }
    }, [isProfessor, professorSession, isAdmin, router]);

    // Load dashboard data
    useEffect(() => {
        // Only load data if professor is authenticated
        if (!isProfessor || !professorSession) return;

        loadDashboardData();

        // Refresh every 30 seconds
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, [isProfessor, professorSession]);

    const loadDashboardData = async () => {
        try {
            const courseId = 'CS101'; // TODO: Get from professor's assigned courses

            // Load escalated doubts
            const doubts = await escalationService.getProfessorDoubts(courseId);
            setEscalatedDoubts(doubts);

            // Load confusion insights
            const insights = await escalationService.getConfusionInsights(courseId);
            setConfusionInsights(insights.slice(0, 5)); // Top 5

            // Load student teaching sessions
            const sessions = await loadStudentSessions(courseId);
            setStudentSessions(sessions);

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    const loadStudentSessions = async (courseId: string) => {
        try {
            // Check if professor is logged in
            const professorSession = localStorage.getItem('professorSession');
            if (professorSession) {
                try {
                    const session = JSON.parse(professorSession);
                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/sparklink-d72d1/us-central1/api';
                    const response = await fetch(`${apiBaseUrl}/professor/sessions/${courseId}`, {
                        headers: {
                            'Authorization': `Professor ${session.uid}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        return (data.sessions || []).filter((s: any) =>
                            s.status === 'UPCOMING' || s.status === 'ONGOING'
                        );
                    }
                    console.warn('Sessions API failed, returning empty array');
                    return [];
                } catch (apiError) {
                    console.warn('Professor sessions API call failed:', apiError);
                    return [];
                }
            }

            // Fallback to direct Firestore for students
            const allSessions = await firestoreService.getSessions();
            return allSessions.filter((s: any) =>
                s.courseId === courseId &&
                (s.status === 'UPCOMING' || s.status === 'ONGOING')
            );
        } catch (error) {
            console.error('❌ Error fetching sessions:', error);
            return [];
        }
    };

    const handleReplyToDoubt = async (doubt: any) => {
        if (!replyContent.trim()) {
            alert('Please enter a reply');
            return;
        }

        setReplying(true);

        try {
            // Call professor API to reply (avoids Firestore permission issues)
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/sparklink-d72d1/us-central1/api';
            const response = await fetch(`${apiBaseUrl}/professor/doubts/${doubt.doubtId}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Professor ${professorSession?.uid}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: replyContent,
                    professorName: professorSession?.name || 'Professor',
                    professorUid: professorSession?.uid || 'professor_001'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send reply');
            }

            // Reload data
            await loadDashboardData();

            // Close modal
            setSelectedDoubt(null);
            setReplyContent('');

            console.log('✅ Professor reply sent and doubt resolved');
        } catch (error) {
            console.error('Error replying to doubt:', error);
            alert('Failed to send reply. Please try again.');
        } finally {
            setReplying(false);
        }
    };

    const getTimeSinceEscalation = (escalatedAt: any) => {
        if (!escalatedAt) return 'Just now';

        const escalatedTime = escalatedAt.toDate ? escalatedAt.toDate() : new Date(escalatedAt);
        const diffMs = Date.now() - escalatedTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading Professor Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Professor Dashboard</h1>
                    <p className="text-slate-500 mt-2">
                        Manage escalated doubts and gain insights into student learning
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold gap-2 transition-all shadow-sm"
                    onClick={() => {
                        localStorage.removeItem('professorSession');
                        router.push('/');
                    }}
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Escalated Doubts</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {escalatedDoubts.length}
                            </p>
                        </div>
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Top Confusion Topics</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {confusionInsights.length}
                            </p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-yellow-500" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Student Sessions</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {studentSessions.length}
                            </p>
                        </div>
                        <Video className="w-12 h-12 text-blue-500" />
                    </div>
                </GlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Escalated Doubts */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            Escalated Doubts
                        </h2>

                        {escalatedDoubts.length === 0 ? (
                            <GlassCard className="p-8 text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900">All Clear!</h3>
                                <p className="text-slate-500 mt-2">
                                    No doubts need your attention right now
                                </p>
                            </GlassCard>
                        ) : (
                            <div className="space-y-4">
                                {escalatedDoubts.map((doubt, index) => (
                                    <motion.div
                                        key={doubt.doubtId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <GlassCard className="p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                            ESCALATED
                                                        </span>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {getTimeSinceEscalation(doubt.lastEscalatedAt)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900">
                                                        {doubt.content}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="w-4 h-4" />
                                                            {doubt.courseId}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="w-4 h-4" />
                                                            {doubt.replies?.length || 0} replies
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {doubt.askedBy?.name || 'Student'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => setSelectedDoubt(doubt)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    Reply
                                                </Button>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Insights & Sessions */}
                <div className="space-y-6">
                    {/* Confusion Insights */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-yellow-500" />
                            Common Confusion
                        </h2>
                        <GlassCard className="p-6">
                            {confusionInsights.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">
                                    No data yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {confusionInsights.map((insight, index) => (
                                        <div key={index} className="pb-3 border-b border-slate-200 last:border-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-semibold text-slate-900 text-sm flex-1">
                                                    {insight.topic.substring(0, 40)}...
                                                </p>
                                                <span className="text-sm font-bold text-blue-600">
                                                    {insight.count}
                                                </span>
                                            </div>
                                            {insight.count >= 5 && (
                                                <div className="flex items-center gap-1 text-xs text-yellow-700 mt-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>High confusion - consider reteaching</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    {/* Student Sessions */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Video className="w-5 h-5 text-blue-500" />
                            Student Sessions
                        </h2>
                        <GlassCard className="p-6">
                            {studentSessions.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">
                                    No upcoming sessions
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {studentSessions.slice(0, 5).map((session) => (
                                        <div key={session.sessionId} className="pb-3 border-b border-slate-200 last:border-0">
                                            <p className="font-semibold text-slate-900 text-sm">
                                                {session.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                By {session.creatorName}
                                            </p>
                                            {session.status === 'ONGOING' && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-1 inline-block">
                                                    Live Now
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {selectedDoubt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setSelectedDoubt(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-xl font-bold text-slate-900">Reply to Doubt</h2>
                                <p className="text-sm text-slate-500 mt-1">{selectedDoubt.content}</p>
                            </div>

                            <div className="p-6">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Provide your expert answer..."
                                    className="w-full h-40 p-4 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                                <Button
                                    onClick={() => setSelectedDoubt(null)}
                                    variant="outline"
                                    disabled={replying}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleReplyToDoubt(selectedDoubt)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={replying || !replyContent.trim()}
                                >
                                    {replying ? 'Sending...' : 'Send Reply & Resolve'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


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
    FileSpreadsheet,
    ExternalLink
} from 'lucide-react';
import escalationService from '@/lib/escalationService';
import firestoreService from '@/lib/firestoreService';
import sessionsService from '@/lib/sessionsService';
import sheetsService from '@/lib/sheetsService';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfessorDashboard() {
    const { user, isProfessor, professorSession } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [escalatedDoubts, setEscalatedDoubts] = useState<any[]>([]);
    const [confusionInsights, setConfusionInsights] = useState<any[]>([]);
    const [studentSessions, setStudentSessions] = useState<any[]>([]);
    const [selectedDoubt, setSelectedDoubt] = useState<any | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replying, setReplying] = useState(false);

    // Google Sheets state
    const [sheetUrls, setSheetUrls] = useState<any>({});
    const [initializingSheets, setInitializingSheets] = useState(false);
    const [syncingData, setSyncingData] = useState(false);
    const [csvData, setCsvData] = useState<any>(null); // Store synced data for CSV download

    const downloadRawCSV = (filename: string, rows: any[][]) => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAllCSVs = () => {
        if (!csvData) return;
        downloadRawCSV('escalated_doubts.csv', csvData.doubts);
        setTimeout(() => downloadRawCSV('topic_analytics.csv', csvData.topics), 500);
        setTimeout(() => downloadRawCSV('engagement_metrics.csv', csvData.engagement), 1000);
    };

    // STRICT ACCESS CONTROL - Professor Only
    useEffect(() => {
        // Block students from accessing professor dashboard
        if (!isProfessor && !professorSession) {
            console.log('❌ Access denied: Student attempting to access professor dashboard');
            router.push('/');
            return;
        }

        if (isProfessor && professorSession) {
            console.log('✅ Professor access granted:', professorSession.email);
        }
    }, [isProfessor, professorSession, router]);

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

            // Initialize Google Sheets if not already done
            await initializeSheets(courseId);

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    const initializeSheets = async (courseId: string) => {
        try {
            setInitializingSheets(true);

            // Try to get existing sheet URLs
            const urls = await sheetsService.getCourseSheetUrls(courseId);
            console.log('📊 Sheet URLs received:', urls);

            // Check if we have valid URLs (not just IDs from old data)
            const hasValidUrls = urls.escalatedDoubtsUrl && urls.topicAnalyticsUrl && urls.engagementSummaryUrl;
            console.log('✅ Has valid URLs:', hasValidUrls);

            // If no sheets exist OR old data without URLs, force re-initialization
            if (!hasValidUrls && professorSession?.email) {
                console.log('🔄 Re-initializing sheets with URL support...');

                // Clear old data first
                await sheetsService.refreshCourseSheets(courseId);

                // Create new sheets with URLs
                await sheetsService.initializeCourseSheets(courseId, professorSession.email);
                const newUrls = await sheetsService.getCourseSheetUrls(courseId);
                console.log('📊 New URLs after initialization:', newUrls);
                setSheetUrls(newUrls);
            } else {
                console.log('📊 Using existing URLs');
                setSheetUrls(urls);
            }

            console.log('📊 Final sheetUrls state:', urls);
        } catch (error) {
            console.error('Sheet initialization error (non-blocking):', error);
            // Sheets are optional - don't block dashboard
        } finally {
            setInitializingSheets(false);
        }
    };

    const handleSyncData = async () => {
        try {
            setSyncingData(true);
            const courseId = 'CS101';

            const data = await sheetsService.syncDataToSheets(courseId);
            console.log("✅ Sync Response Data:", data);

            if (data.exportData) {
                setCsvData(data.exportData);
                alert('✅ Data synced successfully!');
            } else {
                alert('✅ Data updated in Sheets!');
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('Failed to sync data. Check console.');
        } finally {
            setSyncingData(false);
        }
    };

    const loadStudentSessions = async (courseId: string) => {
        try {
            // Check if professor is logged in
            const professorSession = localStorage.getItem('professorSession');
            if (professorSession) {
                try {
                    const session = JSON.parse(professorSession);
                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';
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
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';
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
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Professor Dashboard</h1>
                <p className="text-slate-500 mt-2">
                    Manage escalated doubts and gain insights into student learning
                </p>
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

            {/* View Reports Section - Google Sheets Integration */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    Live Reports
                    {sheetUrls.isDemoMode && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEMO MODE</span>
                    )}
                </h2>
                <GlassCard className="p-6">
                    {initializingSheets ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-slate-500 mt-4">Initializing academic intelligence sheets...</p>
                        </div>
                    ) : (
                        <>
                            {sheetUrls.isDemoMode && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-yellow-800">
                                            <strong>📊 Demo Mode Active!</strong> Showing template sheets to demonstrate the integration.
                                            Click "Try Real Sheets" if you've enabled Google Cloud permissions.
                                        </p>
                                        <Button
                                            onClick={async () => {
                                                if (confirm('This will clear demo data and try to create real sheets. Continue?')) {
                                                    setInitializingSheets(true);
                                                    try {
                                                        await sheetsService.refreshCourseSheets('CS101');
                                                        window.location.reload();
                                                    } catch (e) {
                                                        alert('Failed to refresh. Check console.');
                                                    }
                                                }
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 ml-4 whitespace-nowrap"
                                        >
                                            🔄 Try Real Sheets
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div className="text-sm text-slate-600">
                                    Access real-time live sheets or download reports.
                                </div>
                                <div className="flex gap-3">
                                    {sheetUrls.escalatedDoubtsUrl && (
                                        <Button
                                            onClick={handleSyncData}
                                            disabled={syncingData}
                                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 h-9 flex items-center gap-2"
                                        >
                                            {syncingData ? (
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <div className="w-3 h-3">🔄</div>
                                            )}
                                            Sync Data
                                        </Button>
                                    )}

                                    <Button
                                        onClick={handleDownloadAllCSVs}
                                        disabled={!csvData}
                                        className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-4 h-9 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FileSpreadsheet className="w-3 h-3" />
                                        Download CSV
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Button
                                    onClick={() => sheetUrls.escalatedDoubtsUrl && window.open(sheetUrls.escalatedDoubtsUrl, '_blank')}
                                    disabled={!sheetUrls.escalatedDoubtsUrl}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-auto py-4 flex flex-col items-center gap-2 disabled:opacity-50"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    <div>
                                        <div className="font-bold">Escalated Doubts</div>
                                        <div className="text-xs opacity-90">Live tracking sheet</div>
                                    </div>
                                </Button>

                                <Button
                                    onClick={() => sheetUrls.topicAnalyticsUrl && window.open(sheetUrls.topicAnalyticsUrl, '_blank')}
                                    disabled={!sheetUrls.topicAnalyticsUrl}
                                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white h-auto py-4 flex flex-col items-center gap-2 disabled:opacity-50"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    <div>
                                        <div className="font-bold">Topic Confusion</div>
                                        <div className="text-xs opacity-90">Analytics dashboard</div>
                                    </div>
                                </Button>

                                <Button
                                    onClick={() => sheetUrls.engagementSummaryUrl && window.open(sheetUrls.engagementSummaryUrl, '_blank')}
                                    disabled={!sheetUrls.engagementSummaryUrl}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-auto py-4 flex flex-col items-center gap-2 disabled:opacity-50"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    <div>
                                        <div className="font-bold">Engagement Summary</div>
                                        <div className="text-xs opacity-90">Course metrics</div>
                                    </div>
                                </Button>
                            </div>

                            {/* Sync Data Button */}

                        </>
                    )}
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

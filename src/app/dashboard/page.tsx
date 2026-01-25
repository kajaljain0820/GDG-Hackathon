'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, X, Send, FileText, MoreVertical, ThumbsUp, MessageSquare, Video, Calendar, TrendingUp, Command, Bell, User, BookOpen, Zap, Activity, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { firestoreService } from '@/lib/firestoreService';
import { peersService } from '@/lib/peersService';
import sessionsService from '@/lib/sessionsService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Dashboard() {
    const { token, user, isProfessor } = useAuth();
    const router = useRouter();
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [recentDoubts, setRecentDoubts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        documentsProcessed: 0,
        doubtsAnswered: 0,
        studyHours: 0,
        activePeers: 0
    });

    // Redirect professors to their dashboard
    useEffect(() => {
        if (isProfessor) {
            router.push('/dashboard/professor');
        }
    }, [isProfessor, router]);

    // Real-time sessions listener (synced with Sessions page)
    useEffect(() => {
        if (!user?.uid) return;

        const courseId = 'CS101'; // TODO: Get from user context

        const unsubscribe = sessionsService.subscribe(courseId, (allSessions) => {
            // Filter to show only UPCOMING and ONGOING sessions (not COMPLETED)
            const activeSessions = allSessions.filter(session =>
                session.status === 'UPCOMING' || session.status === 'ONGOING'
            );

            // Take only first 3 for dashboard
            setRecentSessions(activeSessions.slice(0, 3));
            console.log('✅ Dashboard: Loaded', activeSessions.length, 'active sessions');
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch other dashboard data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [doubts, peers] = await Promise.all([
                    firestoreService.getDoubts(),
                    peersService.getAllUsers()
                ]);

                // Filter docs uploaded by user
                const userDocs = await firestoreService.getUserDocuments(user.uid);

                setRecentDoubts(doubts.slice(0, 4));

                // Calculate real stats
                setStats({
                    documentsProcessed: userDocs.length,
                    doubtsAnswered: doubts.filter((d: any) => d.status === 'RESOLVED').length,
                    studyHours: Math.floor(doubts.length * 0.5) + (recentSessions.length * 1), // Estimate
                    activePeers: peers.length
                });
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Refresh doubts/peers every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user, recentSessions.length]);

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const notifications = [
        { id: 1, type: 'doubt', text: 'New answer to your doubt', time: '5m ago' },
        { id: 2, type: 'session', text: 'Session starting in 1 hour', time: '1h ago' }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 relative">
            {/* Header */}
            <header className="flex items-center justify-between mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Command Center</h1>
                    <p className="text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Search Button */}
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="hidden md:flex items-center bg-white/60 border border-slate-200/50 rounded-full px-4 py-2 text-slate-500 text-sm gap-2 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
                    >
                        <Command className="w-4 h-4" />
                        <span>Search modules...</span>
                        <span className="bg-slate-100 px-1.5 rounded text-xs ml-4 border border-slate-200">⌘K</span>
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-3 bg-white/60 rounded-full border border-slate-200/50 text-slate-500 hover:bg-white hover:text-blue-600 transition-colors relative shadow-sm hover:shadow-md"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        </button>
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-slate-800">Notifications</h3>
                                        <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="space-y-2">
                                        {notifications.map(notif => (
                                            <div key={notif.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                                                <p className="text-sm text-slate-700">{notif.text}</p>
                                                <span className="text-xs text-slate-400">{notif.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform flex items-center justify-center text-white font-bold"
                        >
                            {user?.displayName?.charAt(0) || 'U'}
                        </button>
                        <AnimatePresence>
                            {showProfile && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                                                {user?.displayName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{user?.displayName || 'User'}</p>
                                                <p className="text-xs text-slate-400">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowProfile(false)}><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => router.push('/dashboard/settings')}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm"
                                        >
                                            Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-3 py-2 hover:bg-red-50 rounded-lg text-sm text-red-600 flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Documents</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.documentsProcessed}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                </GlassCard>
                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Doubts Solved</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.doubtsAnswered}</p>
                    </div>
                    <Zap className="w-8 h-8 text-yellow-500" />
                </GlassCard>
                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Study Hours</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.studyHours}h</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-500" />
                </GlassCard>
                <GlassCard className="p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Active Peers</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.activePeers}</p>
                    </div>
                    <User className="w-8 h-8 text-purple-500" />
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Quick Actions Dashboard Card - REPLACED AI Chat */}
                    <GlassCard className="p-6 border-white/60 bg-white/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-slate-800">Quick Actions</h2>
                                <p className="text-xs text-slate-500">Jump to your most used features</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => router.push('/dashboard/notebook')}
                                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group"
                            >
                                <BookOpen className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="font-semibold text-slate-800">Neural Notebook</p>
                                <p className="text-xs text-slate-500">Upload & analyze documents</p>
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/forum')}
                                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-green-500 hover:shadow-lg transition-all group"
                            >
                                <MessageSquare className="w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="font-semibold text-slate-800">Doubt Forum</p>
                                <p className="text-xs text-slate-500">Ask & answer questions</p>
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/sessions')}
                                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all group"
                            >
                                <Video className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="font-semibold text-slate-800">Live Sessions</p>
                                <p className="text-xs text-slate-500">Join teaching sessions</p>
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/connect')}
                                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition-all group"
                            >
                                <User className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="font-semibold text-slate-800">Peer Connect</p>
                                <p className="text-xs text-slate-500">Find study partners</p>
                            </button>
                        </div>
                    </GlassCard>

                    {/* Upcoming Sessions */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Upcoming Sessions
                            </h3>
                            <Button variant="ghost" className="text-sm text-slate-500 hover:text-blue-600" onClick={() => router.push('/dashboard/sessions')}>View All</Button>
                        </div>
                        <div className="space-y-3">
                            {recentSessions.length === 0 && !loading && (
                                <GlassCard className="p-6 text-center">
                                    <p className="text-slate-400">No upcoming sessions</p>
                                    <Button onClick={() => router.push('/dashboard/sessions')} className="mt-3">Create Session</Button>
                                </GlassCard>
                            )}
                            {recentSessions.map((session, i) => (
                                <GlassCard key={session.sessionId} className="p-4 flex items-center justify-between hover:bg-white/80 cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <Video className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">{session.title}</h4>
                                            <p className="text-sm text-slate-500">
                                                {session.creatorName} • {formatTime(session.scheduledStartTime)}
                                                {session.status === 'ONGOING' && (
                                                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        Live Now
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {session.status !== 'COMPLETED' && (
                                        <Button
                                            className="text-xs px-3 py-1"
                                            onClick={() => window.open(session.meetLink, '_blank')}
                                        >
                                            Join
                                        </Button>
                                    )}
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    {/* Community Doubts */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Community Doubts
                            </h3>
                            <Button variant="ghost" className="text-sm text-slate-500 hover:text-blue-600" onClick={() => router.push('/dashboard/forum')}>View All</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recentDoubts.length === 0 && !loading && (
                                <div className="col-span-2 text-center py-8 text-slate-400">No recent doubts found.</div>
                            )}
                            {recentDoubts.map((doubt, i) => (
                                <motion.div
                                    key={doubt.doubtId || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="cursor-pointer"
                                    onClick={() => router.push('/dashboard/forum')}
                                >
                                    <GlassCard className="p-5 flex flex-col gap-4 group hover:bg-white/80">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold px-2 py-1 rounded border bg-blue-50 border-blue-100 text-blue-600">
                                                {doubt.courseId || 'General'}
                                            </span>
                                            <span className={`text-[10px] px-2 py-1 rounded ${doubt.resolved ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {doubt.status === 'PROFESSOR_VISIBLE' || doubt.status === 'PROFESSOR' ? 'Professor Attention' : doubt.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h4 className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors line-clamp-2 h-10">
                                            {doubt.content}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-slate-200/50">
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                    {(doubt.askedBy?.name || 'U').charAt(0)}
                                                </div>
                                                {doubt.askedBy?.name || 'Student'}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {doubt.votes || 0}</span>
                                                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {(doubt.replies || []).length}</span>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Live Activity Radar */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-white/50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live Radar
                            </h2>
                            <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-1 rounded border border-green-200 shadow-sm">LIVE</span>
                        </div>
                        <div className="aspect-square relative bg-slate-950 overflow-hidden">
                            {/* Crosshair */}
                            <div className="absolute inset-0">
                                <div className="absolute w-full h-px bg-green-500/10 top-1/2" />
                                <div className="absolute h-full w-px bg-green-500/10 left-1/2" />
                            </div>
                            {/* Radial Grid */}
                            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, transparent 24.5%, rgba(34,197,94,0.05) 25%, transparent 25.5%, transparent 49.5%, rgba(34,197,94,0.05) 50%, transparent 50.5%, transparent 74.5%, rgba(34,197,94,0.05) 75%, transparent 75.5%, transparent 99.5%, rgba(34,197,94,0.1) 100%)' }} />

                            {/* Concentric Circles */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {[25, 50, 75, 100].map((size, i) => (
                                    <div key={i} className="absolute border rounded-full" style={{ width: `${size}%`, height: `${size}%`, borderColor: i === 3 ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.15)', borderWidth: i === 3 ? '2px' : '1px' }} />
                                ))}
                            </div>


                            {/* Center Dot */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-pulse" />
                            </div>

                            {/* Radar Sweep - Conic Gradient */}
                            <div className="absolute inset-0">
                                <div className="absolute w-full h-full" style={{ background: 'conic-gradient(from 0deg, rgba(34,197,94,0) 0deg, rgba(34,197,94,0.3) 60deg, rgba(34,197,94,0) 90deg)', animation: 'spin 4s linear infinite' }} />
                            </div>

                            {/* Scan Line */}
                            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'spin 4s linear infinite' }}>
                                <div className="absolute h-1/2 w-0.5 bg-gradient-to-t from-green-400 via-green-300 to-transparent origin-bottom" style={{ boxShadow: '0 0 10px rgba(34,197,94,0.8)' }} />
                            </div>

                            {/* Radar Scanning Line - Fixed to originate from center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                    className="absolute origin-center"
                                    style={{
                                        width: '50%',
                                        height: '2px',
                                        background: 'linear-gradient(90deg, rgba(34,197,94,0.8) 0%, transparent 100%)',
                                        animation: 'spin 3s linear infinite',
                                    }}
                                />
                            </div>

                            {/* Active Peer Dots */}
                            {[...Array(Math.min(stats.activePeers, 12))].map((_, i) => {
                                const angle = (Math.PI * 2 / Math.min(stats.activePeers, 12)) * i;
                                const radius = 30 + Math.random() * 35; // 30-65% from center
                                const x = 50 + radius * Math.cos(angle);
                                const y = 50 + radius * Math.sin(angle);

                                return (
                                    <div
                                        key={i}
                                        className="absolute w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"
                                        style={{
                                            left: `${x}%`,
                                            top: `${y}%`,
                                            animationDelay: `${i * 0.2}s`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                );
                            })}

                            {/* Range Markers */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-green-400/60">0°</div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-green-400/60">180°</div>
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-green-400/60">270°</div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-green-400/60">90°</div>
                            {/* Info Panel */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4">
                                <div className="flex justify-between items-end">
                                    <div className="text-green-400">
                                        <p className="text-[10px] font-mono text-green-400/60 mb-1">ACTIVE CONNECTIONS</p>
                                        <p className="text-3xl font-bold font-mono tracking-wider" style={{ textShadow: '0 0 20px rgba(34,197,94,0.5)' }}>{String(stats.activePeers).padStart(2, '0')}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-[10px] font-mono text-green-400/60">RANGE</span>
                                            <span className="text-xs font-mono text-green-400">100%</span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-[10px] font-mono text-green-400/60">STATUS</span>
                                            <span className="text-xs font-mono text-green-400">SCANNING</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

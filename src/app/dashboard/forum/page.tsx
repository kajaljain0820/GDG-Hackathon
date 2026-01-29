'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    MessageSquare,
    ThumbsUp,
    Eye,
    Search,
    PlusCircle,
    CheckCircle,
    HelpCircle,
    User,
    Shield,
    GraduationCap,
    X,
    Database,
    Send,
    Clock,
    Loader2,
    Filter,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import firestoreService, { Doubt, Reply } from '@/lib/firestoreService';

export default function ForumPage() {
    const { token, user } = useAuth();
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newDoubtContent, setNewDoubtContent] = useState('');
    const [creating, setCreating] = useState(false);
    const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
    const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [submittingReply, setSubmittingReply] = useState<string | null>(null);

    // Load doubts on mount
    useEffect(() => {
        fetchDoubts();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDoubts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDoubts = async () => {
        try {
            const firestoreDoubts = await firestoreService.getDoubts({ limit: 100 });
            setDoubts(firestoreDoubts);
            console.log('✅ Loaded', firestoreDoubts.length, 'doubts from Firestore');
        } catch (error) {
            console.error('❌ Failed to fetch doubts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDoubts();
        setRefreshing(false);
    };

    const handleCreateDoubt = async () => {
        if (!newDoubtContent.trim()) return;

        setCreating(true);
        try {
            const doubtData = {
                courseId: 'CS101',
                content: newDoubtContent.trim(),
                askedBy: {
                    name: user?.displayName || user?.email?.split('@')[0] || 'Student',
                    uid: user?.uid || `guest_${Date.now()}`,
                    email: user?.email || undefined
                },
                tags: [],
                status: 'OPEN' as const,  // Start as OPEN so everyone can see and answer
                resolved: false,
                votes: 0,
                views: 0,
                replies: [],
                history: [{
                    status: 'OPEN',
                    timestamp: new Date(),
                    note: 'Question posted to forum'
                }]
            };

            // Save directly to Firestore
            await firestoreService.createDoubt(doubtData);

            setNewDoubtContent('');
            setShowCreate(false);

            // Refresh to show new doubt
            await fetchDoubts();

            console.log('✅ Doubt saved to Firestore!');
        } catch (error) {
            console.error('❌ Failed to post doubt:', error);
            alert('Failed to post doubt. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleMarkResolved = async (doubtId: string) => {
        try {
            await firestoreService.resolveDoubt(doubtId);
            await fetchDoubts();
            console.log('✅ Doubt marked as RESOLVED');
        } catch (error) {
            console.error('❌ Failed to resolve doubt:', error);
        }
    };

    const handleSubmitReply = async (doubtId: string) => {
        const content = replyContent[doubtId];
        if (!content?.trim()) return;

        setSubmittingReply(doubtId);
        try {
            await firestoreService.addReplyToDoubt(doubtId, {
                content: content.trim(),
                repliedBy: {
                    name: user?.displayName || user?.email?.split('@')[0] || 'Anonymous Student',
                    uid: user?.uid || `guest_${Date.now()}`,
                    role: 'STUDENT'
                },
                isAi: false,
                isAccepted: false
            });

            setReplyContent(prev => ({ ...prev, [doubtId]: '' }));
            await fetchDoubts();

            console.log('✅ Reply saved to Firestore!');
        } catch (error) {
            console.error('❌ Failed to submit reply:', error);
            alert('Reply failed - please try again');
        } finally {
            setSubmittingReply(null);
        }
    };

    const handleAcceptAnswer = async (doubtId: string, replyId: string) => {
        // Find the doubt and update the reply's isAccepted status
        const doubt = doubts.find(d => d.doubtId === doubtId);
        if (!doubt) return;

        try {
            const updatedReplies = doubt.replies.map(r => ({
                ...r,
                isAccepted: r.replyId === replyId
            }));

            // Update in Firestore (we'd need to add this function, but for now mark as resolved)
            await firestoreService.resolveDoubt(doubtId);
            await fetchDoubts();
        } catch (error) {
            console.error('❌ Failed to accept answer:', error);
        }
    };

    const getStatusParams = (status: string) => {
        switch (status) {
            case 'AI': return { color: 'bg-purple-100 text-purple-700 border-purple-200', text: 'AI Analyzing', icon: HelpCircle };
            case 'OPEN': return { color: 'bg-green-100 text-green-700 border-green-200', text: 'Open', icon: MessageSquare };
            case 'SENIOR_VISIBLE': return { color: 'bg-orange-100 text-orange-700 border-orange-200', text: 'Seniors Only', icon: Shield };
            case 'PROFESSOR':
            case 'PROFESSOR_VISIBLE': return { color: 'bg-red-100 text-red-700 border-red-200', text: 'Professor', icon: GraduationCap };
            case 'RESOLVED': return { color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Resolved', icon: CheckCircle };
            default: return { color: 'bg-slate-100 text-slate-700', text: status, icon: HelpCircle };
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    // Filter doubts based on search and status filter
    const filteredDoubts = doubts.filter(doubt => {
        const matchesSearch = doubt.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || doubt.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading Doubt Forum...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doubt Forum</h1>
                    <p className="text-slate-500 text-sm mt-1">Ask questions, help classmates, learn together</p>
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
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        onClick={() => setShowCreate(!showCreate)}
                    >
                        <PlusCircle className="w-4 h-4" />
                        Ask Question
                    </Button>
                </div>
            </header>

            {/* Info Banner */}
            <GlassCard className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-blue-900">Community Learning Forum</h3>
                            <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                <CheckCircle className="w-3 h-3" />
                                {doubts.length} Questions
                            </span>
                        </div>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Ask your doubts and let fellow students help! All discussions are <span className="font-semibold">permanently stored</span> to build a knowledge base.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-xl bg-white"
                >
                    <option value="all">All Questions</option>
                    <option value="OPEN">Open</option>
                    <option value="RESOLVED">Resolved</option>
                </select>
            </div>

            {/* Create Question Area */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <GlassCard className="p-6 bg-white border-2 border-blue-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-blue-600" />
                                Ask a New Question
                            </h3>
                            <textarea
                                className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-800"
                                rows={4}
                                placeholder="Describe your doubt in detail... Be specific so others can help you better!"
                                value={newDoubtContent}
                                onChange={(e) => setNewDoubtContent(e.target.value)}
                            />
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-xs text-slate-500">
                                    💡 Tip: Include context about what you've already tried
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setShowCreate(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateDoubt}
                                        disabled={creating || !newDoubtContent.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Posting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Post Question
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Questions List */}
            {filteredDoubts.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No questions yet</h3>
                    <p className="text-slate-500 mb-4">Be the first to ask a question!</p>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Ask First Question
                    </Button>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {filteredDoubts.map((doubt) => {
                        const status = getStatusParams(doubt.status);
                        const StatusIcon = status.icon;
                        const isExpanded = expandedDoubtId === doubt.doubtId;
                        const isOwner = doubt.askedBy.uid === user?.uid;

                        return (
                            <GlassCard
                                key={doubt.doubtId}
                                className={`p-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-500/30 shadow-lg' : 'hover:shadow-md'
                                    }`}
                            >
                                {/* Question Header */}
                                <div
                                    className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    onClick={() => setExpandedDoubtId(isExpanded ? null : doubt.doubtId!)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" /> {status.text}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {getTimeAgo(doubt.createdAt)}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    by <span className="font-medium text-slate-600">{doubt.askedBy.name}</span>
                                                </span>
                                            </div>
                                            <h3 className="text-slate-900 font-medium text-lg leading-relaxed">
                                                {doubt.content}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="text-xs font-bold">{doubt.replies?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden bg-slate-50/50 border-t border-slate-200"
                                        >
                                            <div className="p-5 space-y-6">
                                                {/* Replies Section */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                            Answers ({doubt.replies?.length || 0})
                                                        </h4>
                                                        {isOwner && doubt.status !== 'RESOLVED' && (
                                                            <Button
                                                                onClick={() => handleMarkResolved(doubt.doubtId!)}
                                                                variant="outline"
                                                                className="text-xs py-1 px-3 text-green-600 border-green-200 hover:bg-green-50"
                                                            >
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Mark as Resolved
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {(!doubt.replies || doubt.replies.length === 0) ? (
                                                        <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
                                                            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                            <p className="text-sm text-slate-500">No answers yet. Be the first to help!</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {doubt.replies.map(reply => (
                                                                <div
                                                                    key={reply.replyId}
                                                                    className={`p-4 rounded-xl text-sm ${reply.isAccepted
                                                                            ? 'bg-green-50 border-2 border-green-300'
                                                                            : 'bg-white border border-slate-200'
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="font-bold text-slate-700 flex items-center gap-2">
                                                                            <User className="w-4 h-4 text-slate-400" />
                                                                            {reply.repliedBy.name}
                                                                            {reply.repliedBy.role === 'PROFESSOR' && (
                                                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded uppercase">
                                                                                    Prof
                                                                                </span>
                                                                            )}
                                                                            {reply.isAccepted && (
                                                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded uppercase flex items-center gap-1">
                                                                                    <CheckCircle className="w-3 h-3" /> Accepted
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {getTimeAgo(reply.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-slate-600 leading-relaxed">{reply.content}</p>

                                                                    {/* Accept Answer Button (only for question owner) */}
                                                                    {isOwner && !reply.isAccepted && doubt.status !== 'RESOLVED' && (
                                                                        <button
                                                                            onClick={() => handleAcceptAnswer(doubt.doubtId!, reply.replyId)}
                                                                            className="mt-3 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                                                                        >
                                                                            <CheckCircle className="w-3 h-3" />
                                                                            Accept as Answer
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Reply Input */}
                                                    {doubt.status !== 'RESOLVED' && (
                                                        <div className="flex gap-2 mt-4">
                                                            <Input
                                                                className="bg-white"
                                                                placeholder="Type your answer..."
                                                                value={replyContent[doubt.doubtId!] || ''}
                                                                onChange={(e) => setReplyContent(prev => ({
                                                                    ...prev,
                                                                    [doubt.doubtId!]: e.target.value
                                                                }))}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleSubmitReply(doubt.doubtId!);
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                onClick={() => handleSubmitReply(doubt.doubtId!)}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                disabled={submittingReply === doubt.doubtId || !replyContent[doubt.doubtId!]?.trim()}
                                                            >
                                                                {submittingReply === doubt.doubtId ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Send className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

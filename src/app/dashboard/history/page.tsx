'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import studyHistoryService, { StudyHistoryEvent, EventType } from '@/lib/studyHistoryService';
import GlassCard from '@/components/ui/GlassCard';
import { BookOpen, Video, CheckCircle, Calendar, Filter, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudyHistoryPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<StudyHistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<EventType | 'ALL'>('ALL');

    useEffect(() => {
        loadHistory();
    }, [user, filterType]);

    const loadHistory = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const history = await studyHistoryService.getStudyHistory(
                user.uid,
                'CS101', // TODO: Get from user context
                filterType === 'ALL' ? undefined : filterType
            );
            setEvents(history);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (type: EventType) => {
        switch (type) {
            case 'TOPIC_STUDIED':
                return <BookOpen className="w-5 h-5" />;
            case 'SESSION_ATTENDED':
                return <Video className="w-5 h-5" />;
            case 'DOUBT_SOLVED':
                return <CheckCircle className="w-5 h-5" />;
        }
    };

    const getEventColor = (type: EventType) => {
        switch (type) {
            case 'TOPIC_STUDIED':
                return 'bg-blue-500';
            case 'SESSION_ATTENDED':
                return 'bg-purple-500';
            case 'DOUBT_SOLVED':
                return 'bg-green-500';
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const getDetailedTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Study Session History</h1>
                    <p className="text-slate-500 mt-1">Your personal academic timeline</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>{events.length} {events.length === 1 ? 'event' : 'events'}</span>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="flex gap-3">
                <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filterType === 'ALL'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    All Events
                </button>
                <button
                    onClick={() => setFilterType('TOPIC_STUDIED')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${filterType === 'TOPIC_STUDIED'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Topics Studied
                </button>
                <button
                    onClick={() => setFilterType('SESSION_ATTENDED')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${filterType === 'SESSION_ATTENDED'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    <Video className="w-4 h-4" />
                    Sessions Attended
                </button>
                <button
                    onClick={() => setFilterType('DOUBT_SOLVED')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${filterType === 'DOUBT_SOLVED'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    <CheckCircle className="w-4 h-4" />
                    Doubts Solved
                </button>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-slate-400">Loading your study history...</div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Study History Yet</h3>
                        <p className="text-slate-500 max-w-md">
                            Your learning journey will appear here automatically as you study topics, attend sessions, and solve doubts.
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                        {/* Events */}
                        <div className="space-y-6">
                            {events.map((event, index) => (
                                <motion.div
                                    key={event.eventId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative pl-16"
                                >
                                    {/* Icon */}
                                    <div className={`absolute left-3 w-6 h-6 rounded-full ${getEventColor(event.eventType)} text-white flex items-center justify-center shadow-lg`}>
                                        {getEventIcon(event.eventType)}
                                    </div>

                                    {/* Card */}
                                    <GlassCard className="p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 mb-1">{event.title}</h3>
                                                <p className="text-sm text-slate-500">{getDetailedTimestamp(event.createdAt)}</p>

                                                {/* Metadata */}
                                                <div className="mt-3">
                                                    {event.eventType === 'TOPIC_STUDIED' && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {(event.metadata as any).topics.map((topic: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                                                                >
                                                                    {topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {event.eventType === 'SESSION_ATTENDED' && (
                                                        <div className="text-sm text-slate-600">
                                                            <p>Hosted by <span className="font-medium">{(event.metadata as any).hostedBy}</span></p>
                                                        </div>
                                                    )}

                                                    {event.eventType === 'DOUBT_SOLVED' && (
                                                        <div className="text-sm text-slate-600">
                                                            <p>Resolved by <span className="font-medium">{(event.metadata as any).resolvedBy}</span></p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Relative Time Badge */}
                                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                                {formatTimestamp(event.createdAt)}
                                            </span>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

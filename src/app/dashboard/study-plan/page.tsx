'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { CalendarDays, Clock, CheckCircle, ArrowRight, BookOpen, Target } from 'lucide-react';

export default function StudyPlanPage() {
    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Study Plan Maker</h1>
                    <p className="text-slate-500 text-sm mt-1">Generate personalized learning schedules based on your exams and goals</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-full px-6 shadow-lg shadow-indigo-500/20">
                    <CalendarDays className="w-5 h-5" />
                    New Plan
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Today's Schedule */}
                    <GlassCard className="p-8 bg-white/60 border-white/60">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                Today's Schedule
                            </h2>
                            <span className="text-sm font-medium text-slate-500">Jan 25, 2026</span>
                        </div>

                        <div className="space-y-4">
                            {[
                                { time: '09:00 AM', task: 'Neural Networks: Backpropagation', duration: '2h', status: 'completed' },
                                { time: '11:30 AM', task: 'Data Structures: Graph Algorithms', duration: '1.5h', status: 'in-progress' },
                                { time: '02:00 PM', task: 'Review: System Design Notes', duration: '1h', status: 'upcoming' },
                                { time: '04:00 PM', task: 'Practice Quiz: Linear Algebra', duration: '45m', status: 'upcoming' },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${item.status === 'in-progress'
                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                        : 'bg-white/80 border-slate-100 hover:border-indigo-100'
                                    }`}>
                                    <div className="min-w-[80px] text-sm font-semibold text-slate-600">{item.time}</div>
                                    <div className="w-1 h-12 rounded-full bg-slate-200 relative">
                                        <div className={`absolute top-0 w-full rounded-full ${item.status === 'completed' ? 'h-full bg-green-500' :
                                                item.status === 'in-progress' ? 'h-1/2 bg-indigo-500' : 'h-0'
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-bold ${item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{item.task}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3" /> {item.duration}
                                        </p>
                                    </div>
                                    {item.status === 'completed' ? (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    ) : item.status === 'in-progress' ? (
                                        <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">Complete</Button>
                                    ) : (
                                        <Button size="sm" variant="outline" className="text-slate-400">Start</Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Active Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-6 bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                            <h3 className="font-bold text-lg mb-2">Mid-Term Prep</h3>
                            <div className="flex items-end justify-between mb-4">
                                <span className="text-indigo-100 text-sm">Target: A+ Grade</span>
                                <span className="text-2xl font-bold">65%</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-white/90 w-[65%]" />
                            </div>
                            <Button variant="ghost" className="w-full bg-white/10 hover:bg-white/20 text-white border-none justify-between group">
                                Continue Plan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </GlassCard>

                        <GlassCard className="p-6 bg-white/60 border-white/60">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-slate-900">Python Mastery</h3>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">On Track</span>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Basic Syntax</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Functions & Modules</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                    <span>OOP Concepts</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full">View Details</Button>
                        </GlassCard>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-red-500" />
                            Focus Areas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {['Machine Learning', 'Algorithms', 'System Design', 'Calculus', 'React.js'].map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                                    {tag}
                                </span>
                            ))}
                            <button className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-500 hover:bg-slate-200 transition-colors">
                                + Add
                            </button>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-amber-500" />
                            Reading List
                        </h3>
                        <div className="space-y-4">
                            {[
                                { title: 'Deep Learning', author: 'Ian Goodfellow', progress: 45 },
                                { title: 'Clean Code', author: 'Robert C. Martin', progress: 12 },
                            ].map((book, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-900">{book.title}</span>
                                        <span className="text-slate-500">{book.progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 w-[45%]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-amber-600 hover:text-amber-700 text-sm">
                            View Study Materials
                        </Button>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

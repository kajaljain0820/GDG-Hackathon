'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ClipboardList, Plus, Calendar, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function TasksPage() {
    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Task Assignment</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage course assignments and track student progress</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-full px-6">
                    <Plus className="w-5 h-5" />
                    New Assignment
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Assignments */}
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-blue-500" />
                            Active Assignments
                        </h2>

                        <div className="space-y-4">
                            {[
                                { title: 'Neural Networks Implementation', course: 'CS101', due: '2 days left', submitted: '24/50' },
                                { title: 'Data Structures Project', course: 'CS102', due: '5 days left', submitted: '12/45' },
                                { title: 'Algorithm Analysis Report', course: 'CS101', due: '1 week left', submitted: '5/50' },
                            ].map((task, i) => (
                                <div key={i} className="p-4 bg-white/80 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{task.title}</h3>
                                            <p className="text-sm text-slate-500">{task.course}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                                            {task.due}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4 text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {task.submitted} Submitted
                                            </span>
                                        </div>
                                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 font-medium">
                                            View Details
                                        </Button>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${(parseInt(task.submitted.split('/')[0]) / parseInt(task.submitted.split('/')[1])) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Pending Review */}
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Pending Review
                        </h2>
                        <div className="space-y-3">
                            {[
                                { student: 'Alex Johnson', task: 'Neural Networks Implementation', date: 'Submitted 2 hours ago' },
                                { student: 'Sarah Smith', task: 'Neural Networks Implementation', date: 'Submitted 3 hours ago' },
                                { student: 'Mike Brown', task: 'Data Structures Project', date: 'Submitted 5 hours ago' },
                            ].map((review, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                                            {review.student.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{review.student}</p>
                                            <p className="text-xs text-slate-500">{review.task}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="text-slate-600">Review</Button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                <p className="text-3xl font-bold text-blue-600">3</p>
                                <p className="text-xs text-slate-600 font-medium">Active Tasks</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                                <p className="text-3xl font-bold text-green-600">41</p>
                                <p className="text-xs text-slate-600 font-medium">Submissions</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                                <p className="text-3xl font-bold text-purple-600">8</p>
                                <p className="text-xs text-slate-600 font-medium">To Review</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
                                <p className="text-3xl font-bold text-amber-600">92%</p>
                                <p className="text-xs text-slate-600 font-medium">Avg Grade</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4">Upcoming Deadlines</h3>
                        <div className="space-y-4">
                            {[
                                { task: 'Neural Networks', date: 'Tomorrow, 11:59 PM' },
                                { task: 'Data Structures', date: 'Jan 28, 11:59 PM' },
                            ].map((deadline, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{deadline.task}</p>
                                        <p className="text-xs text-red-500 font-medium">{deadline.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

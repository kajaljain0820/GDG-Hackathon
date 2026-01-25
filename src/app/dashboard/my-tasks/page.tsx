'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ListTodo, CheckSquare, Clock, Filter, Plus, Calendar, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function TaskManagerPage() {
    const [activeTab, setActiveTab] = useState('all');

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Task Manager</h1>
                    <p className="text-slate-500 text-sm mt-1">Track assignments, deadlines, and personal to-dos</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-full px-6 shadow-lg shadow-blue-500/20">
                    <Plus className="w-5 h-5" />
                    New Task
                </Button>
            </header>

            <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
                {['All Tasks', 'Assigned by Professor', 'Personal', 'Completed'].map((tab) => {
                    const key = tab.toLowerCase().split(' ')[0];
                    const isActive = activeTab === key || (key === 'assigned' && activeTab === 'assigned');
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(key)}
                            className={`pb-3 px-1 font-medium text-sm transition-all relative ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {tab}
                            {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task List */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Assigned Tasks */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</h3>
                        {[
                            { title: 'Neural Networks Implementation', course: 'CS101', due: 'Tomorrow', type: 'assigned', priority: 'high' },
                            { title: 'Calculus Quiz Prep', course: 'MATH202', due: 'Jan 28', type: 'assigned', priority: 'medium' },
                        ].map((task, i) => (
                            <div key={i} className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-4">
                                <button className="mt-1 w-5 h-5 rounded border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900">{task.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{task.course}</span>
                                        <span className="text-red-500 font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Due {task.due}
                                        </span>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Professor Assigned</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Edit</Button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Upcoming</h3>
                        {[
                            { title: 'Read Chapter 4: System Design', course: 'CS102', due: 'Jan 30', type: 'personal' },
                            { title: 'Group Project Check-in', course: 'CS101', due: 'Feb 02', type: 'assigned' },
                            { title: 'Apply for Internship', course: 'Career', due: 'Feb 10', type: 'personal' },
                        ].map((task, i) => (
                            <div key={i} className="group p-4 bg-white/60 rounded-xl border border-slate-200 hover:bg-white transition-all flex items-start gap-4">
                                <button className="mt-1 w-5 h-5 rounded border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800">{task.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{task.course}</span>
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {task.due}
                                        </span>
                                        {task.type === 'assigned' && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Assigned</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4">Task Overview</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                <span className="block text-2xl font-bold text-blue-600">5</span>
                                <span className="text-xs text-blue-600/80 font-medium">Pending</span>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                <span className="block text-2xl font-bold text-green-600">12</span>
                                <span className="text-xs text-green-600/80 font-medium">Completed</span>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                <span className="block text-2xl font-bold text-amber-600">2</span>
                                <span className="text-xs text-amber-600/80 font-medium">Overdue</span>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                                <span className="block text-2xl font-bold text-purple-600">85%</span>
                                <span className="text-xs text-purple-600/80 font-medium">Efficiency</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                            Filters
                        </h3>
                        <div className="space-y-2">
                            {['High Priority', 'This Week', 'Professor Assigned', 'Personal'].map((filter) => (
                                <label key={filter} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 cursor-pointer">
                                    <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                                    <span className="text-sm text-slate-600">{filter}</span>
                                </label>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CalendarDays, Clock, CheckCircle, ArrowRight, BookOpen, Target, Plus, Trash2, Loader2, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface StudyTask {
    time: string;
    task: string;
    duration: string;
    status: 'upcoming' | 'in-progress' | 'completed';
}

interface StudyPlan {
    id: string;
    title: string;
    goal: string;
    targetGrade: string;
    subjects: string[];
    totalProgress: number;
    tasks: StudyTask[];
    status: 'active' | 'completed' | 'on-hold';
}

export default function StudyPlanPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewPlanModal, setShowNewPlanModal] = useState(false);

    // Form state
    const [newPlanTitle, setNewPlanTitle] = useState('');
    const [newPlanGoal, setNewPlanGoal] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/study-plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlanTitle.trim()) return;

        try {
            setIsCreating(true);
            // Default tasks for a new plan
            const defaultTasks: StudyTask[] = [
                { time: '09:00 AM', task: 'Self Study / Content Review', duration: '1.5h', status: 'upcoming' },
                { time: '02:00 PM', task: 'Practice Problems / Coding', duration: '2h', status: 'upcoming' },
                { time: '07:00 PM', task: 'Daily Summary & Reflection', duration: '45m', status: 'upcoming' }
            ];

            const response = await api.post('/study-plans', {
                title: newPlanTitle,
                goal: newPlanGoal,
                tasks: defaultTasks
            });

            setPlans([response.data, ...plans]);
            setShowNewPlanModal(false);
            setNewPlanTitle('');
            setNewPlanGoal('');
        } catch (error) {
            console.error('Error creating plan:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await api.delete(`/study-plans/${id}`);
            setPlans(plans.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    };

    const toggleTaskStatus = async (planId: string, taskIndex: number) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        const updatedTasks = [...plan.tasks];
        const currentStatus = updatedTasks[taskIndex].status;

        let nextStatus: 'upcoming' | 'in-progress' | 'completed' = 'in-progress';
        if (currentStatus === 'in-progress') nextStatus = 'completed';
        else if (currentStatus === 'completed') nextStatus = 'upcoming';

        updatedTasks[taskIndex].status = nextStatus;

        // Calculate progress
        const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedCount / updatedTasks.length) * 100);

        try {
            await api.put(`/study-plans/${planId}`, {
                tasks: updatedTasks,
                totalProgress: progress
            });

            setPlans(plans.map(p => p.id === planId ? { ...p, tasks: updatedTasks, totalProgress: progress } : p));
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Smart Study Planner</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your personalized learning schedules and academic goals</p>
                </div>
                <Button
                    onClick={() => setShowNewPlanModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-full px-6 shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-5 h-5" />
                    New Plan
                </Button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-slate-500 animate-pulse">Loading your study plans...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Selected Plan / Today's Schedule */}
                        {plans.length > 0 ? (
                            <GlassCard className="p-8 bg-white/60 border-white/60">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-indigo-500" />
                                        Today's Schedule: {plans[0].title}
                                    </h2>
                                    <span className="text-sm font-medium text-slate-500">
                                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {plans[0].tasks.map((item, i) => (
                                        <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${item.status === 'in-progress'
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                            : 'bg-white/80 border-slate-100 hover:border-indigo-100'
                                            }`}>
                                            <div className="min-w-[80px] text-sm font-semibold text-slate-600">{item.time}</div>
                                            <div className="w-1 h-12 rounded-full bg-slate-200 relative">
                                                <div className={`absolute top-0 w-full rounded-full transition-all duration-500 ${item.status === 'completed' ? 'h-full bg-green-500' :
                                                    item.status === 'in-progress' ? 'h-1/2 bg-indigo-500' : 'h-0'
                                                    }`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-bold transition-all ${item.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.task}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3" /> {item.duration}
                                                </p>
                                            </div>
                                            {item.status === 'completed' ? (
                                                <button onClick={() => toggleTaskStatus(plans[0].id, i)}>
                                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                                </button>
                                            ) : item.status === 'in-progress' ? (
                                                <Button
                                                    onClick={() => toggleTaskStatus(plans[0].id, i)}
                                                    size="sm"
                                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                                >
                                                    Complete
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => toggleTaskStatus(plans[0].id, i)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-slate-400 hover:text-indigo-600 hover:border-indigo-200"
                                                >
                                                    Start
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        ) : (
                            <GlassCard className="p-12 flex flex-col items-center justify-center text-center bg-white/40 border-dashed border-2 border-slate-200">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <CalendarDays className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">No Study Plans Yet</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">Create your first study plan to start tracking your academic goals.</p>
                                <Button
                                    onClick={() => setShowNewPlanModal(true)}
                                    className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full"
                                >
                                    Create First Plan
                                </Button>
                            </GlassCard>
                        )}

                        {/* Active Plans List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {plans.map((plan, index) => (
                                <GlassCard
                                    key={plan.id}
                                    className={`p-6 border-white/60 relative group ${index % 2 === 0
                                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                                            : 'bg-white/60'
                                        }`}
                                >
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className={`absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${index % 2 === 0 ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'
                                            }`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <h3 className={`font-bold text-lg mb-2 ${index % 2 === 0 ? 'text-white' : 'text-slate-900'}`}>{plan.title}</h3>
                                    <div className="flex items-end justify-between mb-4">
                                        <span className={`text-sm ${index % 2 === 0 ? 'text-indigo-100' : 'text-slate-500'}`}>Goal: {plan.goal || 'Knowledge Mastery'}</span>
                                        <span className="text-2xl font-bold">{plan.totalProgress}%</span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden mb-4 ${index % 2 === 0 ? 'bg-black/20' : 'bg-slate-100'}`}>
                                        <div
                                            className={`h-full transition-all duration-700 ${index % 2 === 0 ? 'bg-white/90' : 'bg-indigo-500'}`}
                                            style={{ width: `${plan.totalProgress}%` }}
                                        />
                                    </div>
                                    <Button
                                        variant={index % 2 === 0 ? "ghost" : "outline"}
                                        className={`w-full justify-between group-item ${index % 2 === 0
                                                ? 'bg-white/10 hover:bg-white/20 text-white border-none'
                                                : ''
                                            }`}
                                    >
                                        View Details <ArrowRight className="w-4 h-4 group-item-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </GlassCard>
                            ))}
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
            )}

            {/* New Plan Modal */}
            {showNewPlanModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNewPlanModal(false)} />
                    <GlassCard className="w-full max-w-md p-8 relative z-10 bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowNewPlanModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Create New Plan</h2>
                            <p className="text-slate-500 text-sm mt-1">Set your academic goals and organize your study time.</p>
                        </div>

                        <form onSubmit={handleCreatePlan} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Plan Title</label>
                                <Input
                                    placeholder="e.g., Final Exam Prep, Python Course"
                                    value={newPlanTitle}
                                    onChange={(e) => setNewPlanTitle(e.target.value)}
                                    required
                                    className="border-slate-200 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Your Goal</label>
                                <Input
                                    placeholder="e.g., Achieve A+ grade, Complete 5 chapters"
                                    value={newPlanGoal}
                                    onChange={(e) => setNewPlanGoal(e.target.value)}
                                    className="border-slate-200 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowNewPlanModal(false)}
                                    className="flex-1 py-6 border-slate-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Plan'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}


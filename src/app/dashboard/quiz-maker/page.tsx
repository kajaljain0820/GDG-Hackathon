'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { BrainCircuit, Sparkles, Wand2, Calculator, Copy, Check } from 'lucide-react';

export default function QuizMakerPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Smart Quiz Maker</h1>
                <p className="text-slate-500 text-sm mt-1">Generate AI-powered quizzes and assessments in seconds</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Generation Form */}
                <GlassCard className="p-8 bg-white/60 border-white/60">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <BrainCircuit className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Create Quiz</h2>
                            <p className="text-sm text-slate-500">Configure your quiz parameters</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Topic or Source Material</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-indigo-500/50 resize-none h-32"
                                placeholder="Paste text content, lecture notes, or just type a topic (e.g., 'Thermodynamics Laws')"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Question Type</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80">
                                    <option>Multiple Choice</option>
                                    <option>True / False</option>
                                    <option>Short Answer</option>
                                    <option>Mixed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80">
                                    <option>Easy</option>
                                    <option selected>Medium</option>
                                    <option>Hard</option>
                                    <option>Expert</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions: 10</label>
                            <input type="range" min="5" max="50" defaultValue="10" className="w-full accent-indigo-600" />
                        </div>

                        <Button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg font-bold gap-2">
                            <Wand2 className="w-5 h-5" />
                            Generate Quiz
                        </Button>
                    </div>
                </GlassCard>

                {/* Output/Preview */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-white/60 border-white/60 min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                Quiz Preview
                            </h3>
                            <Button size="sm" variant="ghost" className="text-slate-500">
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50/50">
                            <div className="text-center text-slate-400 p-8">
                                <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Generated questions will appear here</p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Recent Quizzes */}
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4">Recent Quizzes</h3>
                        <div className="space-y-3">
                            {[
                                { title: 'Python Basics Quiz', q: 15, date: '2h ago' },
                                { title: 'Calculus Mid-Term Prep', q: 25, date: 'Yesterday' },
                            ].map((quiz, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-slate-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all">
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">{quiz.title}</p>
                                        <p className="text-xs text-slate-500">{quiz.q} Questions • {quiz.date}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

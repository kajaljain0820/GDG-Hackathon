'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Presentation, Sparkles, FileText, Wand2, Download, ChevronRight } from 'lucide-react';

export default function PPTGeneratorPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI PPT Generator</h1>
                <p className="text-slate-500 text-sm mt-1">Create professional presentations with AI assistance</p>
            </header>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generator Panel */}
                <div className="lg:col-span-2">
                    <GlassCard className="p-8 bg-white/60 border-white/60">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                                <Presentation className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Generate Presentation</h2>
                                <p className="text-sm text-slate-500">Enter your topic and let AI create slides</p>
                            </div>
                        </div>

                        {/* Input Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Presentation Topic
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Introduction to Machine Learning"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-800"
                                    defaultValue="Introduction to Neural Networks"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Number of Slides
                                </label>
                                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-800">
                                    <option>5 slides</option>
                                    <option selected>10 slides</option>
                                    <option>15 slides</option>
                                    <option>20 slides</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Style
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Professional', 'Academic', 'Creative'].map((style, i) => (
                                        <button
                                            key={style}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${i === 1
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button className="w-full gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500">
                                <Wand2 className="w-5 h-5" />
                                Generate Presentation
                            </Button>
                        </div>
                    </GlassCard>
                </div>

                {/* Preview Sidebar */}
                <div className="space-y-6">
                    {/* Generated Preview */}
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            Preview
                        </h3>
                        <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center mb-4">
                            <div className="text-center text-white/80 p-4">
                                <Presentation className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Preview will appear here</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Slides</span>
                                <span className="font-medium text-slate-800">10</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Style</span>
                                <span className="font-medium text-slate-800">Academic</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Recent Presentations */}
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            Recent Presentations
                        </h3>
                        <div className="space-y-3">
                            {[
                                { title: 'Deep Learning Basics', slides: 12, date: 'Today' },
                                { title: 'Data Structures', slides: 8, date: 'Yesterday' },
                                { title: 'Algorithm Analysis', slides: 15, date: 'Jan 23' },
                            ].map((ppt, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">{ppt.title}</p>
                                        <p className="text-xs text-slate-500">{ppt.slides} slides • {ppt.date}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Quick Actions */}
            <GlassCard className="p-6 bg-white/60 border-white/60">
                <h3 className="font-bold text-slate-800 mb-4">Quick Templates</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: 'Lecture Intro', icon: '📚' },
                        { name: 'Research Summary', icon: '🔬' },
                        { name: 'Course Overview', icon: '📋' },
                        { name: 'Lab Instructions', icon: '🧪' },
                    ].map((template) => (
                        <button
                            key={template.name}
                            className="p-4 bg-white/80 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all text-center"
                        >
                            <span className="text-2xl mb-2 block">{template.icon}</span>
                            <span className="text-sm font-medium text-slate-700">{template.name}</span>
                        </button>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}

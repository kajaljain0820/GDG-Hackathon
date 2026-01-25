'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Library, Search, FileText, Video, Link as LinkIcon, Download, FolderOpen, Star, MoreVertical } from 'lucide-react';

export default function ResourceLibraryPage() {
    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resource Library</h1>
                    <p className="text-slate-500 text-sm mt-1">Access course materials, lecture notes, and reference guides</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <GlassCard className="p-4 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 px-2">Categories</h3>
                        <div className="space-y-1">
                            {['All Resources', 'Lecture Notes', 'Assignments', 'Reference Books', 'Video Tutorials', 'Past Papers'].map((cat, i) => (
                                <button key={cat} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                                    }`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-4 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 px-2">Courses</h3>
                        <div className="space-y-1">
                            {['CS101: Intro to CS', 'MATH202: Calculus II', 'CS102: Data Structures', 'PHY101: Physics'].map((course) => (
                                <button key={course} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                                    <FolderOpen className="w-4 h-4 text-slate-400" />
                                    {course.split(':')[0]}
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Resource Grid */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[
                            { title: 'Lecture 4: Neural Networks', type: 'PDF', size: '2.4 MB', date: 'Jan 24', icon: FileText, color: 'text-red-500 bg-red-50' },
                            { title: 'Graph Algorithms Guide', type: 'PDF', size: '1.1 MB', date: 'Jan 22', icon: FileText, color: 'text-red-500 bg-red-50' },
                            { title: 'Sorting Visulization', type: 'Video', size: '15 mins', date: 'Jan 20', icon: Video, color: 'text-blue-500 bg-blue-50' },
                            { title: 'Calculus Cheat Sheet', type: 'IMG', size: '450 KB', date: 'Jan 18', icon: FileText, color: 'text-green-500 bg-green-50' },
                            { title: 'Project Guidelines', type: 'DOC', size: '120 KB', date: 'Jan 15', icon: FileText, color: 'text-blue-500 bg-blue-50' },
                            { title: 'External Ref: React Docs', type: 'Link', size: 'URL', date: 'Jan 10', icon: LinkIcon, color: 'text-purple-500 bg-purple-50' },
                        ].map((resource, i) => (
                            <GlassCard key={i} className="p-5 bg-white/80 border-white/60 hover:shadow-lg transition-all group relative">
                                <button className="absolute top-4 right-4 text-slate-300 hover:text-slate-600">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                <div className={`w-12 h-12 rounded-xl ${resource.color} flex items-center justify-center mb-4`}>
                                    <resource.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1" title={resource.title}>{resource.title}</h3>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                                    <span>{resource.type}</span>
                                    <span>•</span>
                                    <span>{resource.size}</span>
                                    <span>•</span>
                                    <span>{resource.date}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 gap-2 text-slate-600 hover:text-indigo-600 hover:border-indigo-200">
                                        <Download className="w-3 h-3" /> Download
                                    </Button>
                                    <Button size="sm" variant="ghost" className="px-2 text-slate-400 hover:text-amber-500">
                                        <Star className="w-4 h-4" />
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

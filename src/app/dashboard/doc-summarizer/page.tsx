'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Wand2, Download, Copy, AlignLeft } from 'lucide-react';

export default function DocSummarizerPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Document Summarizer</h1>
                <p className="text-slate-500 text-sm mt-1">Transform long research papers and notes into concise summaries</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Area */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-white/60 border-white/60 h-full">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            Source Content
                        </h2>

                        <div className="space-y-4 h-full flex flex-col">
                            {/* File Upload Box */}
                            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-xl p-8 text-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group">
                                <Upload className="w-10 h-10 mx-auto text-emerald-400 group-hover:text-emerald-600 mb-3 transition-colors" />
                                <p className="font-medium text-emerald-900">Upload PDF, DOCX or TXT</p>
                                <p className="text-xs text-emerald-600 mt-1">Drag & drop or click to browse</p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-400">Or paste text</span>
                                </div>
                            </div>

                            <textarea
                                className="w-full flex-1 min-h-[200px] p-4 rounded-xl border border-slate-200 bg-white/80 focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono text-sm"
                                placeholder="Paste your text here..."
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <select className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                                    <option>Summary Length: Medium</option>
                                    <option>Summary Length: Short</option>
                                    <option>Summary Length: Long</option>
                                </select>
                                <select className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                                    <option>Format: Bullet Points</option>
                                    <option>Format: Paragraphs</option>
                                    <option>Format: Key Insights</option>
                                </select>
                            </div>

                            <Button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg gap-2 font-bold">
                                <Wand2 className="w-4 h-4" />
                                Summarize
                            </Button>
                        </div>
                    </GlassCard>
                </div>

                {/* Output Area */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-white/60 border-white/60 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlignLeft className="w-5 h-5 text-emerald-500" />
                                Generated Summary
                            </h2>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" title="Copy">
                                    <Copy className="w-4 h-4 text-slate-500" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Download">
                                    <Download className="w-4 h-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white/50 rounded-xl border border-slate-100 p-6">
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-200 rounded w-full"></div>
                                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                            </div>
                            <p className="text-center text-slate-400 mt-8 text-sm">Summary output will appear here</p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

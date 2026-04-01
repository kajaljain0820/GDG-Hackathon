'use client';

import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Presentation, Sparkles, Wand2, Loader2, AlertCircle, Download } from 'lucide-react';

export default function PPTGeneratorPage() {
    const [topic, setTopic] = useState('');
    const [numSlides, setNumSlides] = useState('10');
    const [style, setStyle] = useState('Professional');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');
    const [htmlContent, setHtmlContent] = useState<string | null>(null);

    // n8n webhook URL
    const WEBHOOK_URL = 'https://rohan12345.app.n8n.cloud/webhook/ppt-gen';

    const styles = ['Professional', 'Academic', 'Creative'];

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a presentation topic');
            return;
        }

        setIsGenerating(true);
        setError('');
        setHtmlContent(null);

        try {
            console.log('Sending to n8n:', { topic, numSlides, style });

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic.trim(),
                    slides: parseInt(numSlides),
                    style: style,
                }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Generation failed: ${response.status} - ${errorText}`);
            }

            const responseText = await response.text();
            console.log('Raw response:', responseText.substring(0, 200) + '...');

            let extractedHtml = responseText;
            try {
                const data = JSON.parse(responseText);
                if (data.output || data.html || data.text) {
                     extractedHtml = data.output || data.html || data.text;
                } else if (Array.isArray(data) && data[0] && (data[0].html || data[0].output)) {
                    extractedHtml = data[0].html || data[0].output;
                }
            } catch {
                // Not JSON, assume raw string is HTML
            }
            
            if (!extractedHtml || extractedHtml.trim().length === 0) {
                 throw new Error("Received empty response from the workflow");
            }
            
            setHtmlContent(extractedHtml);

        } catch (err: any) {
            console.error('Generation error:', err);
            let errorMessage = 'Failed to generate presentation. ';
            if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
                errorMessage += 'Could not connect to the server. Please check if the n8n workflow is active.';
            } else {
                errorMessage += err.message || 'Please try again.';
            }
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!htmlContent) return;
        setIsDownloading(true);
        
        try {
            const res = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: htmlContent })
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate PDF');
            }
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'presentation'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            setError('Failed to download presentation. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Presentation className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI PPT Generator</h1>
                        <p className="text-slate-500 text-sm">Create professional presentations with AI assistance</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generator Panel */}
                <div className="lg:col-span-1">
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                                <Wand2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Generate</h2>
                                <p className="text-xs text-slate-500">Configure your presentation</p>
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
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Number of Slides
                                </label>
                                <select
                                    value={numSlides}
                                    onChange={(e) => setNumSlides(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-800"
                                >
                                    <option value="5">5 slides</option>
                                    <option value="10">10 slides</option>
                                    <option value="15">15 slides</option>
                                    <option value="20">20 slides</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Style
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {styles.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStyle(s)}
                                            className={`px-3 py-2 rounded-lg border-2 transition-all font-medium text-xs ${style === s
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs">{error}</span>
                                </div>
                            )}

                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic.trim()}
                                className="w-full gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Generate Presentation
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Quick Templates */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h3 className="font-semibold text-slate-700 mb-3 text-sm">Quick Templates</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { name: 'Lecture Intro', icon: '📚' },
                                    { name: 'Research Summary', icon: '🔬' },
                                    { name: 'Course Overview', icon: '📋' },
                                    { name: 'Lab Instructions', icon: '🧪' },
                                ].map((template) => (
                                    <button
                                        key={template.name}
                                        onClick={() => setTopic(template.name)}
                                        className="p-3 bg-white/80 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all text-center"
                                    >
                                        <span className="text-xl mb-1 block">{template.icon}</span>
                                        <span className="text-xs font-medium text-slate-700">{template.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2">
                    <GlassCard className="p-6 bg-white/60 border-white/60 h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                {htmlContent ? (topic || 'Generated Presentation') : 'Preview'}
                            </h3>
                            {htmlContent && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        className="p-2 px-4 flex items-center gap-2 text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50"
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        title="Download as PDF/PPT"
                                    >
                                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        <span className="text-sm font-medium">{isDownloading ? 'Downloading...' : 'Download'}</span>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Slide Preview */}
                        {isGenerating ? (
                            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                                <div className="text-center text-white/80 p-4">
                                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin opacity-50" />
                                    <p className="text-sm">Generating your presentation...</p>
                                    <p className="text-xs text-white/50 mt-2">This may take a moment</p>
                                </div>
                            </div>
                        ) : htmlContent ? (
                            <div className="aspect-video bg-white rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                                <iframe 
                                    srcDoc={htmlContent} 
                                    className="w-full h-full border-0"
                                    title="Generated Presentation"
                                    sandbox="allow-same-origin allow-scripts"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                                <div className="text-center text-white/80 p-4">
                                    <Presentation className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium mb-2">No Presentation Yet</p>
                                    <p className="text-sm text-white/50">Enter a topic and click generate to create your presentation</p>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

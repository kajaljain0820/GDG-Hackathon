'use client';

import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Presentation, Sparkles, FileText, Wand2, ChevronRight, Loader2, AlertCircle, ChevronLeft, Download } from 'lucide-react';

interface Slide {
    title: string;
    content: string[];
    notes?: string;
}

interface GeneratedPresentation {
    title: string;
    slides: Slide[];
}

export default function PPTGeneratorPage() {
    const [topic, setTopic] = useState('');
    const [numSlides, setNumSlides] = useState('10');
    const [style, setStyle] = useState('Professional');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [presentation, setPresentation] = useState<GeneratedPresentation | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    // n8n webhook URL
    const WEBHOOK_URL = 'https://swaraj11.app.n8n.cloud/webhook-test/2a7a5e4d-e2f6-4769-a5d3-d99a7bfe5406';

    const styles = ['Professional', 'Academic', 'Creative'];

    // Helper function to extract presentation content from n8n response
    const extractPresentation = (data: any): GeneratedPresentation | null => {
        console.log('Extracting presentation from:', data);

        // Handle array response
        if (Array.isArray(data) && data.length > 0) {
            data = data[0];
        }

        // Try to find slides in various formats
        let slides: Slide[] = [];
        let title = topic || 'Generated Presentation';

        // Check for direct slides array
        if (data.slides && Array.isArray(data.slides)) {
            slides = data.slides.map((slide: any, index: number) => ({
                title: slide.title || slide.heading || `Slide ${index + 1}`,
                content: Array.isArray(slide.content)
                    ? slide.content
                    : (slide.content || slide.text || slide.body || '').split('\n').filter((s: string) => s.trim()),
                notes: slide.notes || slide.speakerNotes || ''
            }));
            title = data.title || data.presentationTitle || title;
        }
        // Check for presentation object
        else if (data.presentation && Array.isArray(data.presentation.slides)) {
            slides = data.presentation.slides.map((slide: any, index: number) => ({
                title: slide.title || slide.heading || `Slide ${index + 1}`,
                content: Array.isArray(slide.content)
                    ? slide.content
                    : (slide.content || slide.text || '').split('\n').filter((s: string) => s.trim()),
                notes: slide.notes || ''
            }));
            title = data.presentation.title || title;
        }
        // Check if the response itself is an array of slides
        else if (Array.isArray(data) && data.length > 0 && (data[0].title || data[0].heading)) {
            slides = data.map((slide: any, index: number) => ({
                title: slide.title || slide.heading || `Slide ${index + 1}`,
                content: Array.isArray(slide.content)
                    ? slide.content
                    : (slide.content || slide.text || '').split('\n').filter((s: string) => s.trim()),
                notes: slide.notes || ''
            }));
        }
        // Try to parse as text/string content
        else if (typeof data === 'string' || data.output || data.text || data.response) {
            const textContent = typeof data === 'string' ? data : (data.output || data.text || data.response);
            // Try to parse slide format from text
            const slideMatches = textContent.match(/(?:Slide\s*\d+|#{1,3}\s+.+)/gi);
            if (slideMatches) {
                const sections = textContent.split(/(?=Slide\s*\d+|#{1,3}\s+)/i);
                slides = sections
                    .filter((s: string) => s.trim())
                    .map((section: string, index: number) => {
                        const lines = section.trim().split('\n').filter((l: string) => l.trim());
                        return {
                            title: lines[0]?.replace(/^#+\s*/, '').replace(/^Slide\s*\d+[:\s]*/i, '') || `Slide ${index + 1}`,
                            content: lines.slice(1).map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter((l: string) => l),
                            notes: ''
                        };
                    });
            } else {
                // Just split by paragraphs
                const paragraphs = textContent.split('\n\n').filter((p: string) => p.trim());
                slides = paragraphs.map((p: string, index: number) => ({
                    title: `Slide ${index + 1}`,
                    content: p.split('\n').filter((l: string) => l.trim()),
                    notes: ''
                }));
            }
        }

        if (slides.length === 0) {
            // Fallback: create a single slide with raw content
            slides = [{
                title: 'Generated Content',
                content: [JSON.stringify(data, null, 2)],
                notes: ''
            }];
        }

        return { title, slides };
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a presentation topic');
            return;
        }

        setIsGenerating(true);
        setError('');
        setPresentation(null);
        setCurrentSlide(0);

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
            console.log('Raw response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                data = responseText;
            }

            console.log('Parsed data:', data);

            const extractedPresentation = extractPresentation(data);
            if (extractedPresentation) {
                setPresentation(extractedPresentation);
            } else {
                throw new Error('Could not parse presentation from response');
            }

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

    const nextSlide = () => {
        if (presentation && currentSlide < presentation.slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
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
                                {presentation ? presentation.title : 'Preview'}
                            </h3>
                            {presentation && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        Slide {currentSlide + 1} of {presentation.slides.length}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        className="p-2"
                                        onClick={() => {
                                            const content = presentation.slides.map((s, i) =>
                                                `Slide ${i + 1}: ${s.title}\n${s.content.join('\n')}`
                                            ).join('\n\n---\n\n');
                                            navigator.clipboard.writeText(content);
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
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
                        ) : presentation ? (
                            <div className="space-y-4">
                                {/* Main Slide Display */}
                                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 flex flex-col relative overflow-hidden">
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

                                    {/* Slide content */}
                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                                            {presentation.slides[currentSlide]?.title}
                                        </h2>
                                        <div className="flex-1 overflow-y-auto">
                                            <ul className="space-y-3">
                                                {presentation.slides[currentSlide]?.content.map((point, index) => (
                                                    <li key={index} className="flex items-start gap-3 text-white/90">
                                                        <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                                        <span className="text-sm md:text-base">{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Slide number badge */}
                                    <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white/60 text-sm">
                                        {currentSlide + 1} / {presentation.slides.length}
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={prevSlide}
                                        disabled={currentSlide === 0}
                                        className="gap-2 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </Button>

                                    {/* Slide thumbnails */}
                                    <div className="flex gap-1 overflow-x-auto max-w-md px-2">
                                        {presentation.slides.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentSlide(index)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${index === currentSlide
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={nextSlide}
                                        disabled={currentSlide === presentation.slides.length - 1}
                                        className="gap-2 disabled:opacity-50"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Speaker Notes */}
                                {presentation.slides[currentSlide]?.notes && (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-xs font-semibold text-amber-700 mb-1">Speaker Notes</p>
                                        <p className="text-sm text-amber-800">{presentation.slides[currentSlide].notes}</p>
                                    </div>
                                )}
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

                        {/* Slide Overview */}
                        {presentation && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    All Slides Overview
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-2">
                                    {presentation.slides.map((slide, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            className={`p-3 rounded-lg border text-left transition-all ${index === currentSlide
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-slate-200 bg-white hover:border-purple-300'
                                                }`}
                                        >
                                            <p className="text-xs font-medium text-slate-800 truncate">{slide.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">{slide.content.length} points</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

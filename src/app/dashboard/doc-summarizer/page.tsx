'use client';

import { useState, useRef, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Wand2, Download, Copy, AlignLeft, X, CheckCircle, Loader2, AlertCircle, HelpCircle } from 'lucide-react';

export default function DocSummarizerPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [textContent, setTextContent] = useState('');
    const [summaryLength, setSummaryLength] = useState('medium');
    const [summaryFormat, setSummaryFormat] = useState('bullet');
    const [generatedSummary, setGeneratedSummary] = useState('');
    const [generatedQA, setGeneratedQA] = useState<{ q: string, a: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // n8n webhook URL
    const N8N_WEBHOOK_URL = 'https://rohan2409.app.n8n.cloud/webhook/document-summary';

    const handleFileSelect = (file: File) => {
        // Validate file type
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const allowedExtensions = ['.pdf', '.docx', '.txt'];

        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            setError('Please upload a PDF, DOCX, or TXT file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setError('');
        setTextContent(''); // Clear text content when file is selected
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, []);

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSummarize = async () => {
        if (!selectedFile && !textContent.trim()) {
            setError('Please upload a file or paste some text');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedSummary('');
        setGeneratedQA([]);

        // Create AbortController with 5 minute timeout (300000ms) for n8n processing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

        try {
            const formData = new FormData();

            // Add file if selected
            if (selectedFile) {
                formData.append('file', selectedFile, selectedFile.name);
            }

            // Add text content if provided (for backward compatibility)
            if (textContent.trim()) {
                formData.append('text', textContent);
            }

            // Add summary options - these will be in body.summaryLength and body.summaryFormat in n8n
            formData.append('summaryLength', summaryLength);
            formData.append('summaryFormat', summaryFormat);

            // Log what we're sending for debugging
            console.log('Sending to n8n:', {
                file: selectedFile?.name,
                summaryLength: summaryLength,
                summaryFormat: summaryFormat
            });

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId); // Clear timeout if request completes

            // Log the response for debugging
            console.log('n8n response status:', response.status);
            console.log('n8n response ok:', response.ok);

            // Get the response text first
            const responseText = await response.text();
            console.log('n8n response text:', responseText);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} - ${responseText}`);
            }

            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                // If not JSON, treat the text as the summary
                setGeneratedSummary(responseText);
                setGeneratedQA([]);
                return;
            }

            console.log('Parsed n8n data:', data);

            // Handle the n8n response format
            let summary = '';
            let qaList: { q: string, a: string }[] = [];

            // n8n returns response wrapped in an array, extract first element
            let responseData = data;
            if (Array.isArray(data) && data.length > 0) {
                responseData = data[0];
                console.log('Extracted first element from array:', responseData);
            }

            // Extract summary
            if (typeof responseData === 'string') {
                summary = responseData;
            } else if (responseData.summary) {
                summary = responseData.summary;
            } else if (responseData.output) {
                summary = responseData.output;
            } else if (responseData.result) {
                summary = responseData.result;
            } else if (responseData.message) {
                summary = responseData.message;
            }


            // Extract Q&A from the 'qa' array (with 'q' and 'a' fields)
            if (responseData.qa && Array.isArray(responseData.qa)) {
                qaList = responseData.qa
                    .filter((item: any) => item.q && item.a)
                    .map((item: any) => ({
                        q: item.q,
                        a: item.a
                    }))
                    .slice(0, 5);
            }

            // If no summary was found and we have the whole data object, don't stringify
            // Just leave it empty to show the placeholder

            setGeneratedSummary(summary);
            setGeneratedQA(qaList);
        } catch (err: any) {
            console.error('Summarization error:', err);

            // Check if the error is due to timeout/abort
            if (err.name === 'AbortError') {
                setError('Request timed out. The document may be too large or the server is busy. Please try again.');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to generate summary. Please try again.');
            }

            clearTimeout(timeoutId);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!generatedSummary) return;

        try {
            await navigator.clipboard.writeText(generatedSummary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        if (!generatedSummary) return;

        const blob = new Blob([generatedSummary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'summary.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

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
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            {/* File Upload Box */}
                            {!selectedFile ? (
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${isDragging
                                        ? 'border-emerald-500 bg-emerald-100'
                                        : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-300'
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-emerald-600' : 'text-emerald-400 group-hover:text-emerald-600'
                                        }`} />
                                    <p className="font-medium text-emerald-900">Upload PDF, DOCX or TXT</p>
                                    <p className="text-xs text-emerald-600 mt-1">Drag & drop or click to browse</p>
                                </div>
                            ) : (
                                <div className="border-2 border-emerald-400 bg-emerald-50 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-emerald-900 truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-emerald-600">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                    <button
                                        onClick={removeFile}
                                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-emerald-600" />
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <select
                                    value={summaryLength}
                                    onChange={(e) => setSummaryLength(e.target.value)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                                >
                                    <option value="short">Summary Length: Short</option>
                                    <option value="medium">Summary Length: Medium</option>
                                    <option value="long">Summary Length: Long</option>
                                </select>
                                <select
                                    value={summaryFormat}
                                    onChange={(e) => setSummaryFormat(e.target.value)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                                >
                                    <option value="bullet">Format: Bullet Points</option>
                                    <option value="paragraph">Format: Paragraphs</option>
                                    <option value="insights">Format: Key Insights</option>
                                </select>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleSummarize}
                                disabled={isLoading || !selectedFile}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Summarizing...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        Summarize
                                    </>
                                )}
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
                                <Button
                                    variant="ghost"
                                    title="Copy"
                                    onClick={handleCopy}
                                    disabled={!generatedSummary}
                                    className="disabled:opacity-50 p-2"
                                >
                                    {copied ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-slate-500" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    title="Download"
                                    onClick={handleDownload}
                                    disabled={!generatedSummary}
                                    className="disabled:opacity-50 p-2"
                                >
                                    <Download className="w-4 h-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white/50 rounded-xl border border-slate-100 p-6 overflow-auto">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                        <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                                    </div>
                                    <p className="text-center text-emerald-600 mt-8 text-sm flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating summary...
                                    </p>
                                </div>
                            ) : generatedSummary ? (
                                <div className="prose prose-sm max-w-none">
                                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                        {generatedSummary}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <AlignLeft className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 text-sm">Summary output will appear here</p>
                                    <p className="text-slate-400 text-xs mt-1">Upload a document to get started</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Questions Section */}
            <GlassCard className="p-6 bg-white/60 border-white/60">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-purple-500" />
                        Quiz Questions
                        <span className="text-sm font-normal text-slate-500 ml-2">(Based on Summary)</span>
                    </h2>
                </div>

                {
                    isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 bg-white/50 rounded-xl border border-slate-100 animate-pulse">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 rounded w-full"></div>
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-100 rounded w-5/6 mt-3"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : generatedQA.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generatedQA.map((qa, index) => (
                                <div
                                    key={index}
                                    className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-lg">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-800 font-medium text-sm leading-relaxed mb-3">
                                                {qa.q}
                                            </p>
                                            <div className="bg-white/60 rounded-lg p-3 border border-purple-100">
                                                <p className="text-xs text-purple-600 font-semibold mb-1">Answer:</p>
                                                <p className="text-slate-600 text-sm leading-relaxed">
                                                    {qa.a}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center py-12 bg-white/30 rounded-xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                <HelpCircle className="w-8 h-8 text-purple-300" />
                            </div>
                            <p className="text-slate-500 text-sm">Quiz questions will appear here</p>
                            <p className="text-slate-400 text-xs mt-1">5 questions with answers based on your document</p>
                        </div>
                    )
                }
            </GlassCard>
        </div>
    );
}

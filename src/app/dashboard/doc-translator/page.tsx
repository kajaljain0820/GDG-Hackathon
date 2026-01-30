'use client';

import { useState, useRef, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Languages, Upload, Wand2, Download, Copy, AlignLeft, X, CheckCircle, Loader2, AlertCircle, HelpCircle, FileText, Globe } from 'lucide-react';

const FAMOUS_LANGUAGES = [
    { name: 'English', code: 'en' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Chinese (Simplified)', code: 'zh' },
    { name: 'Japanese', code: 'ja' },
    { name: 'Korean', code: 'ko' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Arabic', code: 'ar' },
    { name: 'Portuguese', code: 'pt' },
    { name: 'Italian', code: 'it' },
    { name: 'Russian', code: 'ru' },
    { name: 'Dutch', code: 'nl' },
    { name: 'Turkish', code: 'tr' },
    { name: 'Bengali', code: 'bn' },
];

export default function DocTranslatorPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [targetLanguage, setTargetLanguage] = useState('es');
    const [translatedContent, setTranslatedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // n8n webhook URL for document translation
    const N8N_WEBHOOK_URL = 'https://rohan2409.app.n8n.cloud/webhook/doc-translator';

    const handleFileSelect = (file: File) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const allowedExtensions = ['.pdf', '.docx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            setError('Please upload a PDF, DOCX, or TXT file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setError('');
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

    const handleTranslate = async () => {
        if (!selectedFile) {
            setError('Please upload a file');
            return;
        }

        setIsLoading(true);
        setError('');
        setTranslatedContent('');

        // 5 minute timeout for processing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile, selectedFile.name);
            formData.append('targetLanguage', targetLanguage);

            // Get language name for display/prompt
            const langName = FAMOUS_LANGUAGES.find(l => l.code === targetLanguage)?.name || targetLanguage;
            formData.append('targetLanguageName', langName);

            // Debug logging
            console.log('=== DOC TRANSLATOR DEBUG ===');
            console.log('📁 File details:', {
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
                lastModified: selectedFile.lastModified
            });
            console.log('🌐 Target language:', targetLanguage, '(', langName, ')');
            console.log('🔗 Webhook URL:', N8N_WEBHOOK_URL);
            console.log('📦 FormData entries:');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  - ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
                } else {
                    console.log(`  - ${key}: ${value}`);
                }
            }
            console.log('📤 Sending request...');

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('📥 Response received:');
            console.log('  - Status:', response.status, response.statusText);
            console.log('  - OK:', response.ok);
            console.log('  - Headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('📄 Response body:', responseText.substring(0, 500));

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} - ${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
                // Handle n8n array wrap
                if (Array.isArray(data) && data.length > 0) {
                    data = data[0];
                }

                const translated = data.translatedText || data.output || data.result || data.message || responseText;
                setTranslatedContent(translated);
            } catch (parseError) {
                setTranslatedContent(responseText);
            }

        } catch (err: any) {
            console.error('Translation error:', err);
            if (err.name === 'AbortError') {
                setError('Request timed out. Please try again.');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to translate document.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!translatedContent) return;
        try {
            await navigator.clipboard.writeText(translatedContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        if (!translatedContent) return;
        const blob = new Blob([translatedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${targetLanguage}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <header>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Languages className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Document Translator</h1>
                        <p className="text-slate-500 text-sm">Translate your learning materials into multiple languages instantly</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Area */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-white/60 border-white/60 h-full">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-500" />
                            Upload & Configure
                        </h2>

                        <div className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            {!selectedFile ? (
                                <div
                                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all group ${isDragging
                                        ? 'border-blue-500 bg-blue-100'
                                        : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300'
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-blue-600' : 'text-blue-400 group-hover:text-blue-600'}`} />
                                    <p className="font-medium text-blue-900">Choose a document</p>
                                    <p className="text-xs text-blue-600 mt-2">Support for PDF, DOCX, TXT (Max 10MB)</p>
                                </div>
                            ) : (
                                <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-blue-900 truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-blue-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                    <button onClick={removeFile} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    Target Language
                                </label>
                                <select
                                    value={targetLanguage}
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    {FAMOUS_LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleTranslate}
                                disabled={isLoading || !selectedFile}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg gap-2 font-bold disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Translating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Translate Document
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
                                <AlignLeft className="w-5 h-5 text-blue-500" />
                                Translated Content
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={handleCopy}
                                    disabled={!translatedContent}
                                    className="p-2"
                                >
                                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleDownload}
                                    disabled={!translatedContent}
                                    className="p-2"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white/50 rounded-xl border border-slate-100 p-6 overflow-auto min-h-[300px]">
                            {isLoading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                    <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                                </div>
                            ) : translatedContent ? (
                                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">
                                    {translatedContent}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                    <Languages className="w-16 h-16 text-slate-200 mb-4" />
                                    <p className="text-slate-500 text-sm">Translation will appear here</p>
                                    <p className="text-slate-400 text-xs mt-1">Upload and translate to see results</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

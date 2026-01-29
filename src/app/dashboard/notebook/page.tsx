'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
    BookOpen,
    Upload,
    FileText,
    X,
    Send,
    Bot,
    User,
    Loader2,
    AlertCircle,
    CheckCircle,
    Sparkles,
    MessageSquare,
    Paperclip
} from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AINotebookPage() {
    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [chatError, setChatError] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Webhook URLs
    const FILE_UPLOAD_WEBHOOK = 'https://rohan2409.app.n8n.cloud/webhook/file-upload';
    const CHAT_WEBHOOK = 'https://rohan2409.app.n8n.cloud/webhook/chat';

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTo({
                        top: chatContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }, [messages, isSending]);

    // File handling functions
    const handleFileSelect = (file: File) => {
        const allowedTypes = ['application/pdf', 'text/plain'];
        const allowedExtensions = ['.pdf', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            setUploadError('Please upload a PDF or TXT file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setUploadError('');
        setUploadSuccess(false);
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
        setUploadSuccess(false);
        setUploadError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select a file first');
            return;
        }

        setIsUploading(true);
        setUploadError('');
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile, selectedFile.name);

            console.log('Uploading file to:', FILE_UPLOAD_WEBHOOK);
            console.log('File name:', selectedFile.name);
            console.log('File size:', selectedFile.size);
            console.log('File type:', selectedFile.type);

            const response = await fetch(FILE_UPLOAD_WEBHOOK, {
                method: 'POST',
                body: formData,
                mode: 'cors',
            });

            console.log('Upload response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload error response:', errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const responseData = await response.text();
            console.log('Upload success response:', responseData);

            setUploadSuccess(true);

            // Add a system message to chat
            const systemMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `📄 File "${selectedFile.name}" has been uploaded successfully! You can now ask me questions about its content.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, systemMessage]);

        } catch (err: any) {
            console.error('Upload error details:', {
                name: err.name,
                message: err.message,
                stack: err.stack
            });

            // Provide more helpful error messages
            let errorMessage = 'Failed to upload file. ';
            if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
                errorMessage += 'Could not connect to the server. This might be a CORS issue or the webhook URL may be incorrect. Please check if the n8n workflow is active.';
            } else {
                errorMessage += err.message || 'Please try again.';
            }

            setUploadError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    // Helper function to extract text content from n8n response
    const extractResponseContent = (data: any): string => {
        // If it's a string, return it
        if (typeof data === 'string') {
            return data;
        }

        // If it's null or undefined
        if (data === null || data === undefined) {
            return '';
        }

        // If it's an array, try to extract from first element
        if (Array.isArray(data)) {
            if (data.length === 0) return '';
            return extractResponseContent(data[0]);
        }

        // If it's an object, try common response field names
        if (typeof data === 'object') {
            // Check for common response fields (in order of priority)
            const responseFields = [
                'response', 'message', 'output', 'text', 'content', 'answer',
                'reply', 'result', 'data', 'body', 'choices'
            ];

            for (const field of responseFields) {
                if (data[field] !== undefined && data[field] !== null) {
                    const extracted = extractResponseContent(data[field]);
                    if (extracted) return extracted;
                }
            }

            // Special handling for OpenAI-style responses
            if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
                const choice = data.choices[0];
                if (choice.message?.content) return choice.message.content;
                if (choice.text) return choice.text;
            }

            // If object has only one key, try to extract from that
            const keys = Object.keys(data);
            if (keys.length === 1) {
                return extractResponseContent(data[keys[0]]);
            }

            // Last resort: stringify the object nicely
            try {
                return JSON.stringify(data, null, 2);
            } catch {
                return String(data);
            }
        }

        // For numbers, booleans, etc.
        return String(data);
    };

    // Chat functions
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isSending) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsSending(true);
        setChatError('');

        try {
            const response = await fetch(CHAT_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    timestamp: userMessage.timestamp.toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Chat failed: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Raw n8n response:', responseText);

            let assistantContent = '';

            try {
                const data = JSON.parse(responseText);
                console.log('Parsed n8n data:', data);
                assistantContent = extractResponseContent(data);
            } catch (parseError) {
                console.log('Response is not JSON, using as plain text');
                assistantContent = responseText;
            }

            // Clean up the content if needed
            assistantContent = assistantContent.trim();

            // If still empty, show a fallback message
            if (!assistantContent) {
                assistantContent = 'I received a response but could not extract the content. Please check the n8n workflow output.';
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (err: any) {
            console.error('Chat error:', err);
            setChatError(err.message || 'Failed to send message. Please try again.');

            // Add error message to chat
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Sorry, I encountered an error processing your message. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Notebook</h1>
                        <p className="text-slate-500 text-sm">Upload documents and chat with AI about their content</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* File Upload Section */}
                <div className="lg:col-span-1">
                    <GlassCard className="p-6 bg-white/60 border-white/60 h-full">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-violet-500" />
                            Upload Document
                        </h2>

                        <div className="space-y-4">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt,application/pdf,text/plain"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            {/* File Upload Box */}
                            {!selectedFile ? (
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${isDragging
                                        ? 'border-violet-500 bg-violet-100'
                                        : 'border-violet-200 bg-violet-50/30 hover:bg-violet-50 hover:border-violet-300'
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-violet-600' : 'text-violet-400 group-hover:text-violet-600'
                                        }`} />
                                    <p className="font-medium text-violet-900">Upload PDF or TXT</p>
                                    <p className="text-xs text-violet-600 mt-1">Drag & drop or click to browse</p>
                                    <p className="text-xs text-violet-400 mt-2">Max size: 10MB</p>
                                </div>
                            ) : (
                                <div className={`border-2 rounded-xl p-4 flex items-center gap-4 transition-all ${uploadSuccess
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-violet-400 bg-violet-50'
                                    }`}>
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${uploadSuccess ? 'bg-emerald-100' : 'bg-violet-100'
                                        }`}>
                                        {uploadSuccess ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                                        ) : (
                                            <FileText className="w-6 h-6 text-violet-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium truncate ${uploadSuccess ? 'text-emerald-900' : 'text-violet-900'
                                            }`}>{selectedFile.name}</p>
                                        <p className={`text-xs ${uploadSuccess ? 'text-emerald-600' : 'text-violet-600'
                                            }`}>
                                            {formatFileSize(selectedFile.size)}
                                            {uploadSuccess && ' • Uploaded'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={removeFile}
                                        className={`p-2 rounded-lg transition-colors ${uploadSuccess
                                            ? 'hover:bg-emerald-100'
                                            : 'hover:bg-violet-100'
                                            }`}
                                    >
                                        <X className={`w-5 h-5 ${uploadSuccess ? 'text-emerald-600' : 'text-violet-600'
                                            }`} />
                                    </button>
                                </div>
                            )}

                            {/* Error Message */}
                            {uploadError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {uploadError}
                                </div>
                            )}

                            {/* Upload Button */}
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || !selectedFile || uploadSuccess}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : uploadSuccess ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Uploaded Successfully
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload to AI
                                    </>
                                )}
                            </Button>

                            {/* Instructions */}
                            <div className="mt-6 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                                <h3 className="text-sm font-semibold text-violet-800 mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    How it works
                                </h3>
                                <ol className="text-xs text-violet-600 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-violet-200 rounded-full flex items-center justify-center text-violet-700 font-bold flex-shrink-0">1</span>
                                        <span>Upload your PDF or text file</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-violet-200 rounded-full flex items-center justify-center text-violet-700 font-bold flex-shrink-0">2</span>
                                        <span>AI processes your document</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 bg-violet-200 rounded-full flex items-center justify-center text-violet-700 font-bold flex-shrink-0">3</span>
                                        <span>Ask questions in the chat!</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Chat Section */}
                <div className="lg:col-span-2">
                    <div className="backdrop-blur-xl rounded-[2rem] relative bg-white/60 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 h-[calc(100vh-16rem)] flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-violet-500" />
                            Chat with AI
                            {uploadSuccess && (
                                <span className="text-xs font-normal bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full ml-2">
                                    Document loaded
                                </span>
                            )}
                        </h2>

                        {/* Chat Messages - Scrollable Container */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                                        <Bot className="w-10 h-10 text-violet-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Start a Conversation</h3>
                                    <p className="text-slate-500 text-sm max-w-md">
                                        Upload a document first, then ask me anything about its content.
                                        I'm here to help you understand and explore your documents!
                                    </p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                            ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                            : 'bg-gradient-to-br from-violet-500 to-purple-600'
                                            }`}>
                                            {message.role === 'user' ? (
                                                <User className="w-5 h-5 text-white" />
                                            ) : (
                                                <Bot className="w-5 h-5 text-white" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`max-w-[75%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                            <div className={`px-4 py-3 rounded-2xl ${message.role === 'user'
                                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-tr-sm'
                                                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                                                }`}>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                    {message.content}
                                                </p>
                                            </div>
                                            <p className={`text-xs text-slate-400 mt-1 ${message.role === 'user' ? 'text-right' : ''
                                                }`}>
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Typing Indicator */}
                            {isSending && (
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Error */}
                        {chatError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4 flex-shrink-0">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {chatError}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="flex gap-3 items-end flex-shrink-0">
                            <div className="flex-1 relative">
                                <textarea
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Ask a question about your document..."
                                    rows={1}
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm placeholder:text-slate-400"
                                    style={{ minHeight: '48px', maxHeight: '120px' }}
                                />
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                disabled={isSending || !inputMessage.trim()}
                                className="w-12 h-12 p-0 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

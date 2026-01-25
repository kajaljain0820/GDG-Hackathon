'use client';

import { useState, useRef, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Send, Library, X, Mic, MicOff, Sparkles, Bot, User, Paperclip, FileText, Trash2, Database, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getAuth } from 'firebase/auth';
import { firestoreService } from '@/lib/firestoreService';
import { peersService } from '@/lib/peersService';
import studyContextService from '@/lib/studyContextService';
import studyHistoryService from '@/lib/studyHistoryService';

interface Message {
    role: 'user' | 'model';
    content: string;
    timestamp?: string;
}

interface UploadedDocument {
    name: string;
    size: number;
    uploadedAt: string;
    chatId: string;
}

export default function NotebookPage() {
    const { token, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
    const [showLibrary, setShowLibrary] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [partnerNotification, setPartnerNotification] = useState<{ show: boolean, count: number, partners: any[] } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const auth = getAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? ' ' : '') + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Voice input not supported in your browser');
            return;
        }

        if (isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error('Stop error:', e);
            }
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error('Start error:', e);
                setIsListening(false);
            }
        }
    };

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'model',
                content: 'Hi 👋 I\'m SparkLink, your AI companion \n\n📚 Upload a PDF, PPT or DOCX to get started or ask me anything about your studies! 💡',
                timestamp: new Date().toISOString()
            }]);
        }
    }, []);

    // Load user's previously uploaded documents from Firestore
    useEffect(() => {
        const loadUserDocuments = async () => {
            if (!user?.uid) return;

            try {
                const docs = await firestoreService.getUserDocuments(user.uid);

                if (docs.length > 0) {
                    setUploadedDocs(docs.map(d => ({
                        name: d.filename,
                        size: d.fileSize,
                        uploadedAt: d.uploadedAt?.toDate ? d.uploadedAt.toDate().toISOString() : new Date().toISOString(),
                        chatId: d.chatId
                    })));

                    console.log('✅ Loaded', docs.length, 'documents from Firestore');
                }
            } catch (error) {
                console.error('❌ Error loading documents:', error);
            }
        };

        loadUserDocuments();
    }, [user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setUploading(true);
        setMessages(prev => [...prev, {
            role: 'user',
            content: `📄 Uploading ${file.name}...`
        }]);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('courseId', 'default_course_id');

            // Use fetch API to avoid Axios FormData transformation issues
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : null;

            const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://us-central1-echo-1928rn.cloudfunctions.net/api'}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type - browser will set it with boundary
                },
                body: formData
            });

            if (!fetchResponse.ok) {
                throw new Error(`Upload failed: ${fetchResponse.statusText}`);
            }

            const response = { data: await fetchResponse.json() };

            if (response.data.chatId) {
                setCurrentChatId(response.data.chatId);

                const docData = {
                    name: file.name,
                    size: file.size,
                    uploadedAt: new Date().toISOString(),
                    chatId: response.data.chatId
                };

                setUploadedDocs(prev => [...prev, docData]);

                // IMPORTANT: Save document to Firestore (permanent storage)
                await firestoreService.saveDocument({
                    chatId: response.data.chatId,
                    filename: file.name,
                    fileType: file.type || file.name.split('.').pop() || 'unknown',
                    fileSize: file.size,
                    uploadedBy: {
                        name: user?.displayName || user?.email?.split('@')[0] || 'Student',
                        uid: user?.uid || 'anonymous'
                    },
                    extractedText: response.data.text || '',
                    chatHistory: []
                });

                console.log('✅ Document saved to Firestore:', file.name);

                // STUDY MATCH: Sync extracted topics to user profile and active study context
                if (response.data.topics && response.data.topics.length > 0 && user?.uid) {
                    // Update user's persistent topics (merged with existing)
                    await peersService.updateUserTopics(user.uid, response.data.topics);

                    // Update active study context (live, real-time)
                    await studyContextService.updateStudyContext(
                        user.uid,
                        'CS101', // TODO: Get from user context
                        response.data.topics,
                        'file_upload',
                        file.name
                    );

                    console.log('🧠 Synced study topics and active context:', response.data.topics);
                }
            }

            setMessages(prev => [...prev, {
                role: 'model',
                content: `✅ Successfully processed "${file.name}"\n\nExtracted ${response.data.textLength} characters. Saved permanently to Firebase! You can now ask me questions about this document!`
            }]);

        } catch (error: any) {
            console.error('❌ Upload error:', error);
            setMessages(prev => [...prev, {
                role: 'model',
                content: `❌ Failed to upload ${file.name}: ${error.response?.data?.error || error.message}`
            }]);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await api.post('/chat', {
                message: userMessage,
                chatId: currentChatId
            });

            if (response.data.chatId && !currentChatId) {
                setCurrentChatId(response.data.chatId);
            }

            setMessages(prev => [...prev, {
                role: 'model',
                content: response.data.response
            }]);

            // 🧠 STUDY PARTNER MATCHING: Extract topics and update active study context
            if (user?.uid && userMessage.length > 10) {
                try {
                    const topicResponse = await api.post('/notebook/extract-topics', {
                        question: userMessage,
                        uid: user.uid,
                        courseId: 'CS101' // TODO: Get from user context
                    });

                    if (topicResponse.data.topics && topicResponse.data.topics.length > 0) {
                        // Update active study context in Firestore
                        await studyContextService.updateStudyContext(
                            user.uid,
                            'CS101', // TODO: Get from user context
                            topicResponse.data.topics,
                            'question',
                            userMessage
                        );
                        console.log('✅ Updated study context with topics:', topicResponse.data.topics);

                        // 📚 RECORD IN STUDY HISTORY
                        await studyHistoryService.recordTopicStudied(
                            user.uid,
                            'CS101', // TODO: Get from user context
                            topicResponse.data.topics,
                            'question'
                        );

                        // 🔔 CHECK FOR STUDY PARTNERS AND NOTIFY
                        try {
                            const matches = await studyContextService.getRecommendedStudyPartners(
                                user.uid,
                                'CS101',
                                60 // 60-minute window
                            );

                            if (matches.length > 0) {
                                console.log('🎉 Found', matches.length, 'study partner(s) for your topics!');

                                // Show in-app notification
                                setPartnerNotification({
                                    show: true,
                                    count: matches.length,
                                    partners: matches
                                });

                                // Auto-hide after 10 seconds
                                setTimeout(() => {
                                    setPartnerNotification(null);
                                }, 10000);

                                // Also show desktop notification
                                const { default: notificationService } = await import('@/lib/notificationService');

                                if (notificationService.isSupported() &&
                                    notificationService.getPermission().granted) {

                                    console.log('🔔 Showing study partner notification...');

                                    if (matches.length === 1) {
                                        notificationService.showPartnerNotification(matches[0]);
                                    } else {
                                        notificationService.showMultipleNotification(matches.length, matches);
                                    }
                                } else {
                                    console.log('ℹ️ Notifications not enabled. Found partners:',
                                        matches.map(m => m.displayName).join(', '));
                                }
                            } else {
                                console.log('ℹ️ No study partners found studying these topics right now');
                            }
                        } catch (matchError) {
                            console.warn('⚠️ Partner matching failed (non-blocking):', matchError);
                        }
                    }
                } catch (topicError) {
                    // Non-blocking error - don't interrupt chat flow
                    console.warn('⚠️ Topic extraction failed (non-blocking):', topicError);
                }
            }
        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'model',
                content: `Error: ${error.response?.data?.error || error.message || 'Failed to get AI response'}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const removeDocument = (chatId: string) => {
        setUploadedDocs(prev => prev.filter(doc => doc.chatId !== chatId));
        if (currentChatId === chatId) {
            setCurrentChatId(null);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Neural Notebook</h1>
                    <p className="text-slate-500 text-sm mt-1">Your AI-powered research assistant and knowledge base</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 bg-white relative"
                        onClick={() => setShowLibrary(!showLibrary)}
                    >
                        <Library className="w-4 h-4" /> Library
                        {uploadedDocs.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {uploadedDocs.length}
                            </span>
                        )}
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                        setMessages([]);
                        setCurrentChatId(null);
                    }}>
                        <Sparkles className="w-4 h-4" /> New Chat
                    </Button>
                </div>
            </header>

            {/* In-App Study Partner Notification */}
            <AnimatePresence>
                {partnerNotification?.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 right-8 z-50 max-w-md"
                    >
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-6 border border-green-400">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-1">
                                        🎉 {partnerNotification.count === 1 ? 'Study Partner Found!' : `${partnerNotification.count} Study Partners Found!`}
                                    </h3>
                                    <p className="text-sm text-white/90 mb-3">
                                        {partnerNotification.count === 1
                                            ? `${partnerNotification.partners[0].displayName} is studying similar topics`
                                            : `${partnerNotification.count} students studying similar topics`
                                        }
                                    </p>
                                    <a
                                        href="/dashboard/connect"
                                        className="inline-flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-colors"
                                    >
                                        Connect Now <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                                <button
                                    onClick={() => setPartnerNotification(null)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Library Sidebar Modal */}
            <AnimatePresence>
                {showLibrary && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="fixed right-8 top-24 w-80 h-[calc(100vh-12rem)] z-50"
                    >
                        <GlassCard className="h-full bg-white/95 border-slate-200 shadow-2xl p-4 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5" /> Uploaded Documents
                                </h3>
                                <button onClick={() => setShowLibrary(false)} className="p-1 hover:bg-slate-100 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                {uploadedDocs.length === 0 ? (
                                    <div className="text-center text-slate-400 text-sm mt-10">
                                        No documents uploaded yet.<br />Upload PDFs or PPTs to get started!
                                    </div>
                                ) : (
                                    uploadedDocs.map((doc, i) => (
                                        <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeDocument(doc.chatId)}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Container - Properly Structured */}
            <div className="flex-1 overflow-hidden">
                <GlassCard className="h-full flex flex-col border-white/60 bg-white/50 backdrop-blur-xl shadow-xl" intensity="medium">

                    {/* Messages Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 shadow-sm rounded-tl-none text-slate-700'}`}>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                </div>
                            </motion.div>
                        ))}
                        {(loading || uploading) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    {uploading && <span className="text-xs text-slate-400 ml-2">Processing...</span>}
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Fixed at Bottom */}
                    <div className="border-t border-slate-200/50 bg-white/40 backdrop-blur-md p-4 flex-shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="relative max-w-4xl mx-auto"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask SparkLink anything or upload a file..."
                                className="pr-28 h-14 bg-white/80 border-slate-200 focus:border-blue-500 transition-all text-base pl-12 text-slate-800 shadow-inner rounded-2xl"
                                disabled={loading || uploading}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                                onChange={handleFileUpload}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors"
                                title="Upload PDF/PPT"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <button
                                    type="button"
                                    onClick={toggleVoiceInput}
                                    className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-100'}`}
                                    title="Voice Input"
                                >
                                    {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || uploading || !input.trim()}
                                    className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

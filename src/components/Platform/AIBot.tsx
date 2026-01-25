'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AIBot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'How can I help you with your studies today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await api.post('/chat', {
                message: userMessage,
                chatId: null // Assistant uses its own session
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.response
            }]);
        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-96"
                    >
                        <GlassCard className="p-4 backdrop-blur-xl bg-slate-900/90">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-purple-500 shadow-[0_0_10px_#a855f7] animate-pulse' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`} />
                                    <span className="font-semibold text-white">SparkLink Assistant</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="h-64 bg-white/5 rounded-lg mb-4 p-3 text-sm text-slate-300 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`${msg.role === 'user' ? 'self-end bg-blue-600/80' : 'self-start bg-slate-700/80'} p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'} border ${msg.role === 'user' ? 'border-blue-500/30' : 'border-slate-600/30'}`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="self-start bg-slate-700/80 p-3 rounded-lg rounded-tl-none border border-slate-600/30 flex gap-1">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="relative"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask for help..."
                                    className="pr-10 h-10 text-sm bg-slate-950/50 text-white"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-40"
                                >
                                    <Send className={`w-4 h-4 ${input.trim() && !loading ? 'text-blue-400' : 'text-slate-500'}`} />
                                </button>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 relative z-50 group"
            >
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg group-hover:blur-md transition-all opacity-0 group-hover:opacity-100" />
                <Bot className="w-8 h-8 text-white relative z-10" />
                {!isOpen && messages.length > 1 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold z-20"
                    >
                        {messages.length - 1}
                    </motion.span>
                )}
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20 pointer-events-none" />
                <div className="absolute inset-[-4px] rounded-full border border-blue-500/30 animate-[spin_10s_linear_infinite] pointer-events-none border-t-transparent border-l-transparent" />
            </motion.button>
        </div>
    );
}

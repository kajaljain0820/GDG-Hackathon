'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    connectionId: string;
    currentUserId: string;
    peerName: string;
    peerId: string;
}

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any;
}

export default function ChatModal({ isOpen, onClose, connectionId, currentUserId, peerName, peerId }: ChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load messages
    useEffect(() => {
        if (!isOpen || !connectionId) return;

        const q = query(
            collection(db, 'chats', connectionId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
            setLoading(false);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [isOpen, connectionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, 'chats', connectionId, 'messages'), {
                text: newMessage,
                senderId: currentUserId,
                createdAt: serverTimestamp()
            });
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {peerName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{peerName}</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-slate-500">Online</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={onClose} className="rounded-full hover:bg-slate-100 w-10 h-10 p-0">
                            <X className="w-5 h-5 text-slate-500" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.length === 0 && !loading && (
                            <div className="text-center py-10 text-slate-400">
                                <p>Start the conversation with {peerName}!</p>
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.senderId === currentUserId;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-50 border-slate-200 focus:bg-white"
                        />
                        <Button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center p-0">
                            <Send className="w-5 h-5 ml-1" />
                        </Button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

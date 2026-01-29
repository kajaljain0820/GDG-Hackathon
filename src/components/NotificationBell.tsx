'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, ClipboardList, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import taskService, { Notification } from '@/lib/taskService';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        // Subscribe to real-time notifications
        const unsubscribe = taskService.subscribeToNotifications(user.uid, (updatedNotifications) => {
            setNotifications(updatedNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (notification.id && !notification.read) {
            await taskService.markNotificationRead(notification.id);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            );
        }

        // Navigate to tasks page
        if (notification.assignmentId) {
            router.push('/dashboard/tasks');
            setShowDropdown(false);
        }
    };

    const handleMarkAllRead = async () => {
        if (!user?.uid) return;

        await taskService.markAllNotificationsRead(user.uid);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-600" />

                {/* Badge */}
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="p-6 text-center">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.slice(0, 10).map(notification => (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0 ${!notification.read ? 'bg-blue-50/50' : ''
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'assignment'
                                                    ? 'bg-purple-100 text-purple-600'
                                                    : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {getTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-100 bg-slate-50">
                                <button
                                    onClick={() => {
                                        router.push('/dashboard/tasks');
                                        setShowDropdown(false);
                                    }}
                                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View all tasks
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

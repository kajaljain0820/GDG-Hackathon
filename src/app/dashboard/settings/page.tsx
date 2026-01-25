'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Lock, Mail, Save, Camera, ArrowLeft, Shield, Bell, Globe, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { updateProfile, updatePassword, updateEmail, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [bio, setBio] = useState('');
    const [department, setDepartment] = useState('Computer Science');
    const [year, setYear] = useState('3');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');
            setPhotoURL(user.photoURL || '');
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updateProfile(user, {
                displayName,
                photoURL
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updatePassword(user, newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error: any) {
            console.error('Sign out error:', error);
            setMessage({ type: 'error', text: 'Failed to sign out' });
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                    <p className="text-slate-500 text-sm">Manage your account and preferences</p>
                </div>
            </div>

            {/* Message Banner */}
            {message.text && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
                >
                    {message.text}
                </motion.div>
            )}

            <div className="grid grid-cols-12 gap-6">
                {/* Sidebar Tabs */}
                <div className="col-span-3">
                    <GlassCard className="p-4">
                        <nav className="space-y-2">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </GlassCard>
                </div>

                {/* Content Area */}
                <div className="col-span-9">
                    {activeTab === 'profile' && (
                        <GlassCard className="p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Profile Information</h2>

                            {/* Profile Photo */}
                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                                        {displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors shadow-lg">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">{displayName || 'Set your name'}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{email}</p>
                                    <Input
                                        placeholder="Photo URL (optional)"
                                        value={photoURL}
                                        onChange={(e) => setPhotoURL(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
                                        <Input
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                        <Input
                                            value={email}
                                            disabled
                                            className="bg-slate-100 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                                        >
                                            <option>Computer Science</option>
                                            <option>Electrical Engineering</option>
                                            <option>Mechanical Engineering</option>
                                            <option>Civil Engineering</option>
                                            <option>Mathematics</option>
                                            <option>Physics</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                                        <select
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none resize-none"
                                    />
                                </div>

                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </GlassCard>
                    )}

                    {activeTab === 'security' && (
                        <GlassCard className="p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Security Settings</h2>

                            <div className="space-y-6">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-blue-900 mb-1">Change Password</h3>
                                            <p className="text-sm text-blue-700">
                                                Keep your account secure by using a strong password
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min 6 characters)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                    />
                                </div>

                                <Button
                                    onClick={handleChangePassword}
                                    disabled={loading || !newPassword || !confirmPassword}
                                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                                >
                                    <Shield className="w-4 h-4" />
                                    {loading ? 'Updating...' : 'Change Password'}
                                </Button>

                                {/* Signout Button */}
                                <div className="mt-8 pt-8 border-t border-slate-200">
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                                        <div className="flex items-start gap-3">
                                            <LogOut className="w-5 h-5 text-red-600 mt-0.5" />
                                            <div>
                                                <h3 className="font-semibold text-red-900 mb-1">Sign Out</h3>
                                                <p className="text-sm text-red-700">
                                                    Sign out of your account and return to the login page
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSignOut}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {activeTab === 'notifications' && (
                        <GlassCard className="p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Notification Preferences</h2>
                            <div className="space-y-4">
                                {['Email notifications', 'Doubt replies', 'Session reminders', 'New peer requests'].map((item, i) => (
                                    <label key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg cursor-pointer">
                                        <span className="text-slate-700">{item}</span>
                                        <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
                                    </label>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>
        </div>
    );
}

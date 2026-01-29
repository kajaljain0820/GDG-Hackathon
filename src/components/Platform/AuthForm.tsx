'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, GraduationCap, ArrowRight, Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type LoginType = 'student' | 'professor';

export default function AuthForm() {
    const [loginType, setLoginType] = useState<LoginType>('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { professorLogin } = useAuth();

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleStudentSubmit = async () => {
        setError(null);
        setLoading(true);

        try {
            // Use the unified login function that checks both Firebase Auth and Firestore
            const result = await professorLogin(email, password);

            if (result.success) {
                // Check if admin (shouldn't happen in student login, but handle it)
                if (result.isAdmin) {
                    router.push('/dashboard/admin');
                } else {
                    router.push('/dashboard');
                }
            } else {
                setError(result.error || 'Invalid email or password.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleProfessorSubmit = async () => {
        setError(null);
        setLoading(true);

        try {
            const result = await professorLogin(email, password);

            if (result.success) {
                // Check if the login was an admin login
                if (result.isAdmin) {
                    router.push('/dashboard/admin');
                } else {
                    router.push('/dashboard/professor');
                }
            } else {
                setError(result.error || 'Invalid credentials');
            }
        } catch (err: any) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (loginType === 'student') {
            await handleStudentSubmit();
        } else {
            await handleProfessorSubmit();
        }
    };

    return (
        <div className="w-full max-w-md perspective-1000">
            <AnimatePresence mode="wait">
                <motion.div
                    key={loginType}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    <GlassCard className="w-full p-10 bg-gradient-to-br from-white/80 via-white/50 to-blue-100/50 border border-white/60 shadow-[0_20px_50px_rgba(8,112,184,0.1)] backdrop-blur-md">
                        <div className="flex flex-col gap-6">
                            {/* Login Type Tabs */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => {
                                        setLoginType('student');
                                        setError(null);
                                    }}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${loginType === 'student'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Student
                                    </div>
                                </button>
                                <button
                                    onClick={() => {
                                        setLoginType('professor');
                                        setError(null);
                                    }}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${loginType === 'professor'
                                        ? 'bg-white text-purple-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Professor
                                    </div>
                                </button>
                            </div>

                            {/* Header */}
                            <div className="text-center">
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                    {loginType === 'professor'
                                        ? 'Professor Portal'
                                        : 'Welcome Back'
                                    }
                                </h2>
                                <p className="text-slate-500 mt-2 text-sm">
                                    {loginType === 'professor'
                                        ? 'Restricted access for faculty'
                                        : 'Access your AI learning hub'
                                    }
                                </p>
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                {/* Email Field */}
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <Input
                                        placeholder={loginType === 'professor' ? 'Professor Email' : 'Student Email'}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="relative">
                                    <Input
                                        placeholder="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-4 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button className="w-full group" disabled={loading} type="submit">
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {loginType === 'professor'
                                                ? 'Access Dashboard'
                                                : 'Enter Portal'
                                            }
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Note for Students (Login Only) */}
                            {loginType === 'student' && (
                                <div className="text-center text-xs text-slate-400 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <GraduationCap className="w-3 h-3 inline mr-1" />
                                    Use credentials provided by your administrator
                                </div>
                            )}

                            {/* Professor Note */}
                            {loginType === 'professor' && (
                                <div className="text-center text-xs text-slate-400 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    Restricted access - Authorized faculty only
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
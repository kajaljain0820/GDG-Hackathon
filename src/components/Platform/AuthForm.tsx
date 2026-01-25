'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, GraduationCap, Building2, ArrowRight, Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const departments = ['Computer Science', 'Data Science', 'AI & ML', 'Robotics', 'Cyber Security'];
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

type LoginType = 'student' | 'professor';

export default function AuthForm() {
    const [loginType, setLoginType] = useState<LoginType>('student');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { professorLogin } = useAuth();

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');

    const handleStudentSubmit = async () => {
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // Student Login
                await signInWithEmailAndPassword(auth, email, password);
                router.push('/dashboard');
            } else {
                // Student Signup
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, {
                    displayName: fullName
                });
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please login instead.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                setError(err.message || 'Authentication failed');
            }
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
                router.push('/dashboard/professor');
            } else {
                setError(result.error || 'Invalid professor credentials');
            }
        } catch (err: any) {
            setError('Professor login failed');
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
                    key={`${loginType}-${isLogin}`}
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
                                        setIsLogin(true);
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
                                        setIsLogin(true);
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
                                        : (isLogin ? 'Welcome Back' : 'Join the Campus')
                                    }
                                </h2>
                                <p className="text-slate-500 mt-2 text-sm">
                                    {loginType === 'professor'
                                        ? 'Restricted access for faculty'
                                        : (isLogin ? 'Access your AI learning hub' : 'Begin your futuristic journey')
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
                                {/* Student Signup Fields */}
                                {loginType === 'student' && !isLogin && (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                            <Input
                                                placeholder="Full Name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-10 bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                            <select
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                className="pl-10 w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500 transition-colors appearance-none"
                                                required
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(d => <option key={d} value={d} className="bg-white text-slate-900">{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                            <select
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                className="pl-10 w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-blue-500 transition-colors appearance-none"
                                                required
                                            >
                                                <option value="">Academic Year</option>
                                                {years.map(y => <option key={y} value={y} className="bg-white text-slate-900">{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Email Field */}
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <Input
                                        placeholder={loginType === 'professor' ? 'Professor Email' : 'College Email'}
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
                                                : (isLogin ? 'Enter Portal' : 'Register ID')
                                            }
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Toggle Login/Signup (Student Only) */}
                            {loginType === 'student' && (
                                <div className="space-y-3">
                                    <div className="relative flex items-center gap-3">
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <span className="text-xs text-slate-400 font-medium">OR</span>
                                        <div className="flex-1 h-px bg-slate-200" />
                                    </div>

                                    <GoogleSignInButton
                                        onError={(err) => setError(err)}
                                        disabled={loading}
                                    />

                                    <div className="text-center text-sm text-slate-500">
                                        {isLogin ? "New student? " : "Already enrolled? "}
                                        <button
                                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                            className="text-blue-600 hover:text-blue-500 font-medium underline-offset-4 hover:underline"
                                        >
                                            {isLogin ? 'Apply Now' : 'Login'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Toggle Login/Signup (Student Only) */}
                            {loginType === 'student' && !isLogin && (
                                <div className="text-center text-sm text-slate-500">
                                    {isLogin ? "New student? " : "Already enrolled? "}
                                    <button
                                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                        className="text-blue-600 hover:text-blue-500 font-medium underline-offset-4 hover:underline"
                                    >
                                        {isLogin ? 'Apply Now' : 'Login'}
                                    </button>
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
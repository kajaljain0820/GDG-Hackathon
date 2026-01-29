'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Book, MessageCircle, Video, Users, History, GraduationCap, Presentation, ClipboardList, BrainCircuit, FileText, Calendar, ListTodo, Library, CalendarDays, Shield, Building2, UserPlus, BookOpen, Languages } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const studentLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/dashboard/tasks', icon: ClipboardList },
    { name: 'Study Planner', href: '/dashboard/study-plan', icon: CalendarDays },
    { name: 'Doc Translator', href: '/dashboard/doc-translator', icon: Languages },
    { name: 'Resource Library', href: '/dashboard/resources', icon: Library },
    { name: 'AI Notebook', href: '/dashboard/notebook', icon: Book },
    { name: 'Doubt Forum', href: '/dashboard/forum', icon: MessageCircle },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Peer Connect', href: '/dashboard/connect', icon: Users },
    { name: 'Study History', href: '/dashboard/history', icon: History },
];

const professorLinks = [
    { name: 'Professor View', href: '/dashboard/professor', icon: GraduationCap },
    { name: 'Task Assignment', href: '/dashboard/professor/assignments', icon: ClipboardList },
    { name: 'AI Notebook', href: '/dashboard/notebook', icon: Book },
    { name: 'AI PPT Generator', href: '/dashboard/ppt-generator', icon: Presentation },
    { name: 'Doc Translator', href: '/dashboard/doc-translator', icon: Languages },
    { name: 'Smart Quiz Maker', href: '/dashboard/quiz-maker', icon: BrainCircuit },
    { name: 'Doc Summarizer', href: '/dashboard/doc-summarizer', icon: FileText },
    { name: 'Club Management', href: '/dashboard/clubs', icon: Calendar },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
];

const adminLinks = [
    { name: 'Admin Dashboard', href: '/dashboard/admin', icon: Shield },
    { name: 'Manage Students', href: '/dashboard/admin', icon: GraduationCap },
    { name: 'Manage Professors', href: '/dashboard/admin', icon: UserPlus },
    { name: 'Manage Classes', href: '/dashboard/admin', icon: BookOpen },
    { name: 'Manage Branches', href: '/dashboard/admin', icon: Building2 },
];

export default function Navigation() {
    const pathname = usePathname();
    const { user, isProfessor, isAdmin, adminSession, professorSession, isStudent, studentSession } = useAuth();

    // Show different links based on role
    let links = studentLinks;
    let roleLabel = 'Student';
    let roleEmail = studentSession?.email || user?.email || 'student@echo.edu';
    let avatarLetter = studentSession?.name?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || 'S';
    let avatarGradient = 'from-green-500 to-emerald-600';

    if (isAdmin) {
        links = adminLinks;
        roleLabel = 'Administrator';
        roleEmail = adminSession?.email || 'admin@gmail.com';
        avatarLetter = 'A';
        avatarGradient = 'from-purple-500 to-pink-600';
    } else if (isProfessor) {
        links = professorLinks;
        roleLabel = 'Professor';
        roleEmail = professorSession?.email || 'professor@gmail.com';
        avatarLetter = 'P';
        avatarGradient = 'from-blue-500 to-indigo-600';
    }

    return (
        <nav className="h-screen w-20 hover:w-64 transition-all duration-500 ease-out group fixed left-0 top-0 z-50 flex flex-col bg-white/80 backdrop-blur-xl border-r border-green-100/50 shadow-sm">
            {/* Logo / Brand */}
            <div className="h-20 flex items-center justify-center border-b border-green-100/30 relative">
                <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradient} rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    S
                </div>
                <span className="absolute left-16 font-bold text-xl text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
                    SparkLink
                </span>
            </div>

            {/* Role Badge */}
            {(isAdmin || isProfessor) && (
                <div className="px-3 py-2">
                    <div className={`px-2 py-1 rounded-lg text-center text-xs font-bold ${isAdmin
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAdmin ? '🔐 Admin Mode' : '📚 Professor Mode'}
                        </span>
                    </div>
                </div>
            )}

            {/* Links */}
            <div className="flex-1 py-4 flex flex-col gap-2 px-3 overflow-y-auto">
                {links.map((link, index) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard/admin' && pathname?.startsWith(link.href));
                    const Icon = link.icon;
                    return (
                        <Link
                            key={`${link.href}-${index}`}
                            href={link.href}
                            className={cn(
                                "flex items-center p-3 rounded-xl transition-all duration-300 relative overflow-hidden group/item",
                                isActive ? "bg-green-50 text-green-700 shadow-sm" : "text-slate-500 hover:text-green-700 hover:bg-green-50/50"
                            )}
                        >
                            <Icon className={cn("w-6 h-6 min-w-[24px] transition-colors", isActive ? "text-green-600" : "group-hover/item:text-green-500")} />
                            <span className="ml-3 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap translate-x-4 group-hover:translate-x-0 delay-75">
                                {link.name}
                            </span>
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r-full shadow-[0_0_10px_rgba(76,175,80,0.5)]" />
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-green-100/30">
                <Link href="/dashboard/settings" className="flex items-center overflow-hidden p-2 rounded-xl hover:bg-green-50/50 transition-colors cursor-pointer">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarGradient} flex-shrink-0 border border-white/50 flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                        {avatarLetter}
                    </div>
                    <div className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                        <p className="text-sm font-medium text-slate-800">
                            {roleLabel}
                        </p>
                        <p className="text-xs text-slate-500">
                            {roleEmail}
                        </p>
                    </div>
                </Link>
            </div>
        </nav>
    )
}

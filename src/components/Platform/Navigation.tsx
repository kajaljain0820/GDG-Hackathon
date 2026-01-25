'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Book, MessageCircle, Video, Users, History, GraduationCap, Presentation, ClipboardList, BrainCircuit, FileText, Calendar, ListTodo, Library, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const studentLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Study Plan Maker', href: '/dashboard/study-plan', icon: CalendarDays },
    { name: 'Task Manager', href: '/dashboard/my-tasks', icon: ListTodo },
    { name: 'Resource Library', href: '/dashboard/resources', icon: Library },
    { name: 'AI Notebook', href: '/dashboard/notebook', icon: Book },
    { name: 'Doubt Forum', href: '/dashboard/forum', icon: MessageCircle },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Peer Connect', href: '/dashboard/connect', icon: Users },
    { name: 'Study History', href: '/dashboard/history', icon: History },
];

const professorLinks = [
    { name: 'Professor View', href: '/dashboard/professor', icon: GraduationCap },
    { name: 'AI Notebook', href: '/dashboard/notebook', icon: Book },
    { name: 'AI PPT Generator', href: '/dashboard/ppt-generator', icon: Presentation },
    { name: 'Task Assignment', href: '/dashboard/tasks', icon: ClipboardList },
    { name: 'Smart Quiz Maker', href: '/dashboard/quiz-maker', icon: BrainCircuit },
    { name: 'Doc Summarizer', href: '/dashboard/doc-summarizer', icon: FileText },
    { name: 'Club Management', href: '/dashboard/clubs', icon: Calendar },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
];

export default function Navigation() {
    const pathname = usePathname();
    const { user, isProfessor } = useAuth();

    // Show different links based on role
    const links = isProfessor ? professorLinks : studentLinks;

    return (
        <nav className="h-screen w-20 hover:w-64 transition-all duration-500 ease-out group fixed left-0 top-0 z-50 flex flex-col bg-white/80 backdrop-blur-xl border-r border-green-100/50 shadow-sm">
            {/* Logo / Brand */}
            <div className="h-20 flex items-center justify-center border-b border-green-100/30 relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-500/20">
                    C
                </div>
                <span className="absolute left-16 font-bold text-xl text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
                    SparkLink
                </span>
            </div>

            {/* Links */}
            <div className="flex-1 py-8 flex flex-col gap-2 px-3">
                {links.map(link => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex-shrink-0 border border-white/50 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {isProfessor ? 'P' : (user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <div className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                        <p className="text-sm font-medium text-slate-800">
                            {isProfessor ? 'Professor' : (user?.displayName || user?.email?.split('@')[0] || 'User')}
                        </p>
                        <p className="text-xs text-slate-500">
                            {isProfessor ? 'professor@gmail.com' : (user?.email || 'student@echo.edu')}
                        </p>
                    </div>
                </Link>
            </div>
        </nav>
    )
}


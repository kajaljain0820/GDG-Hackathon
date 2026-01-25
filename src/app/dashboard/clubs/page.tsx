'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Calendar, Users, MapPin, Clock, Plus, Star } from 'lucide-react';

export default function ClubManagementPage() {
    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Club Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Oversee student clubs and plan campus activities</p>
                </div>
                <Button className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white gap-2 rounded-full px-6 shadow-lg shadow-pink-500/20">
                    <Plus className="w-5 h-5" />
                    New Activity
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* My Clubs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { name: 'AI & Robotics Club', members: 128, role: 'Faculty Advisor', color: 'bg-blue-500' },
                            { name: 'Coding Society', members: 245, role: 'Coordinator', color: 'bg-indigo-500' },
                        ].map((club, i) => (
                            <GlassCard key={i} className="p-6 bg-white/60 border-white/60 hover:scale-[1.02] transition-transform cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl ${club.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">{club.name}</h3>
                                <div className="flex items-center justify-between mt-4 text-sm">
                                    <span className="text-slate-500">{club.members} Members</span>
                                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium text-xs">{club.role}</span>
                                </div>
                            </GlassCard>
                        ))}
                        <GlassCard className="p-6 bg-white/40 border-dashed border-2 border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-white/60 hover:border-slate-400 transition-all cursor-pointer min-h-[160px]">
                            <Plus className="w-8 h-8 mb-2" />
                            <span className="font-medium">Create New Club</span>
                        </GlassCard>
                    </div>

                    {/* Upcoming Activities */}
                    <GlassCard className="p-8 bg-white/60 border-white/60">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-pink-500" />
                            Upcoming Activities
                        </h2>

                        <div className="space-y-4">
                            {[
                                { title: 'Hackathon Kickoff', club: 'Coding Society', date: 'Jan 28, 10:00 AM', loc: 'Main Auditorium' },
                                { title: 'AI Workshop', club: 'AI & Robotics Club', date: 'Jan 30, 2:00 PM', loc: 'Lab 305' },
                                { title: 'Guest Lecture: Future of Tech', club: 'General', date: 'Feb 05, 11:00 AM', loc: 'Virtual Meet' },
                            ].map((event, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/80 rounded-xl border border-slate-100">
                                    <div className="flex-shrink-0 w-14 h-14 bg-pink-50 text-pink-600 rounded-lg flex flex-col items-center justify-center border border-pink-100">
                                        <span className="text-xs font-bold uppercase">{event.date.split(' ')[0]}</span>
                                        <span className="text-lg font-bold">{event.date.split(' ')[1].replace(',', '')}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900">{event.title}</h3>
                                        <p className="text-xs font-medium text-pink-600 mb-1">{event.club}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.date.split(', ')[1]}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.loc}</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Manage</Button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <GlassCard className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                        <h3 className="font-bold text-lg mb-2">Club Budget</h3>
                        <p className="text-pink-100 text-sm mb-6">Total allocated budget for this semester</p>
                        <div className="text-4xl font-bold mb-2">$2,500</div>
                        <div className="h-1.5 bg-pink-400 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-white w-[65%]" />
                        </div>
                        <div className="flex justify-between text-xs text-pink-100">
                            <span>Used: $1,625</span>
                            <span>Remaining: $875</span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            Top Contributors
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: 'David Kim', role: 'President', points: 450 },
                                { name: 'Sarah Lee', role: 'Event Manager', points: 380 },
                                { name: 'James Chen', role: 'Tech Lead', points: 320 },
                            ].map((user, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{user.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

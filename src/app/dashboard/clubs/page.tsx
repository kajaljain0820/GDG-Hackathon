'use client';

import { useState, useRef, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import {
    Calendar,
    Users,
    MapPin,
    Clock,
    Plus,
    Star,
    Trophy,
    Image as ImageIcon,
    X,
    Edit,
    Trash2,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle,
    Sparkles,
    Target,
    Bell,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';

// Types
interface Club {
    id?: string;
    name: string;
    logo: string;
    description: string;
    focusAreas: string[];
    createdBy: {
        uid: string;
        name: string;
        email: string;
    };
    createdAt: any;
    members: number;
}

interface ClubEvent {
    id?: string;
    clubId: string;
    name: string;
    poster: string;
    details: string;
    prizePool: string;
    date: string;
    time: string;
    venue: string;
    createdAt: any;
    notifiedStudents: boolean;
}

export default function ClubManagementPage() {
    const { user } = useAuth();

    // State
    const [clubs, setClubs] = useState<Club[]>([]);
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal states
    const [showClubModal, setShowClubModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingClub, setEditingClub] = useState<Club | null>(null);
    const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

    // Form states for Club
    const [clubName, setClubName] = useState('');
    const [clubLogo, setClubLogo] = useState('');
    const [clubDescription, setClubDescription] = useState('');
    const [clubFocusAreas, setClubFocusAreas] = useState('');
    const [isSavingClub, setIsSavingClub] = useState(false);

    // Form states for Event
    const [eventName, setEventName] = useState('');
    const [eventPoster, setEventPoster] = useState('');
    const [eventDetails, setEventDetails] = useState('');
    const [eventPrizePool, setEventPrizePool] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventVenue, setEventVenue] = useState('');
    const [isSavingEvent, setIsSavingEvent] = useState(false);

    // File input refs
    const logoInputRef = useRef<HTMLInputElement>(null);
    const posterInputRef = useRef<HTMLInputElement>(null);

    // Fetch clubs on mount
    useEffect(() => {
        fetchClubs();
    }, []);

    // Fetch events when a club is selected
    useEffect(() => {
        if (selectedClub) {
            fetchEvents(selectedClub.id!);
        }
    }, [selectedClub]);

    const fetchClubs = async () => {
        setIsLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'clubs'));
            const clubsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Club[];
            setClubs(clubsData);
        } catch (err) {
            console.error('Error fetching clubs:', err);
            setError('Failed to load clubs');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEvents = async (clubId: string) => {
        try {
            const q = query(
                collection(db, 'clubEvents'),
                where('clubId', '==', clubId)
            );
            const snapshot = await getDocs(q);
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ClubEvent[];
            setEvents(eventsData.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ));
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    // Handle logo file upload (convert to base64)
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('Logo must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setClubLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle poster file upload
    const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Poster must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEventPoster(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Save Club
    const handleSaveClub = async () => {
        if (!clubName.trim()) {
            setError('Please enter a club name');
            return;
        }

        setIsSavingClub(true);
        setError('');

        try {
            const clubData: Omit<Club, 'id'> = {
                name: clubName.trim(),
                logo: clubLogo,
                description: clubDescription.trim(),
                focusAreas: clubFocusAreas.split(',').map(f => f.trim()).filter(f => f),
                createdBy: {
                    uid: user?.uid || '',
                    name: user?.displayName || user?.email || 'Unknown',
                    email: user?.email || ''
                },
                createdAt: serverTimestamp(),
                members: 0
            };

            if (editingClub) {
                await updateDoc(doc(db, 'clubs', editingClub.id!), clubData);
                setSuccess('Club updated successfully!');
            } else {
                await addDoc(collection(db, 'clubs'), clubData);
                setSuccess('Club created successfully!');
            }

            resetClubForm();
            setShowClubModal(false);
            fetchClubs();
        } catch (err) {
            console.error('Error saving club:', err);
            setError('Failed to save club');
        } finally {
            setIsSavingClub(false);
        }
    };

    // Save Event
    const handleSaveEvent = async () => {
        if (!eventName.trim() || !eventDate || !selectedClub) {
            setError('Please fill in required fields');
            return;
        }

        setIsSavingEvent(true);
        setError('');

        try {
            const eventData: Omit<ClubEvent, 'id'> = {
                clubId: selectedClub.id!,
                name: eventName.trim(),
                poster: eventPoster,
                details: eventDetails.trim(),
                prizePool: eventPrizePool.trim(),
                date: eventDate,
                time: eventTime,
                venue: eventVenue.trim(),
                createdAt: serverTimestamp(),
                notifiedStudents: false
            };

            if (editingEvent) {
                await updateDoc(doc(db, 'clubEvents', editingEvent.id!), eventData);
                setSuccess('Event updated successfully!');
            } else {
                const docRef = await addDoc(collection(db, 'clubEvents'), eventData);

                // Create notification for all students
                await notifyStudentsAboutEvent(eventData, selectedClub.name);

                // Mark as notified
                await updateDoc(doc(db, 'clubEvents', docRef.id), {
                    notifiedStudents: true
                });

                setSuccess('Event created and students notified!');
            }

            resetEventForm();
            setShowEventModal(false);
            fetchEvents(selectedClub.id!);
        } catch (err) {
            console.error('Error saving event:', err);
            setError('Failed to save event');
        } finally {
            setIsSavingEvent(false);
        }
    };

    // Notify students about new event
    const notifyStudentsAboutEvent = async (event: Omit<ClubEvent, 'id'>, clubName: string) => {
        try {
            // Create a notification in Firestore that students can see
            await addDoc(collection(db, 'notifications'), {
                type: 'NEW_EVENT',
                title: `New Event: ${event.name}`,
                message: `${clubName} has announced a new event! ${event.prizePool ? `Prize Pool: ${event.prizePool}` : ''}`,
                eventDetails: {
                    name: event.name,
                    date: event.date,
                    time: event.time,
                    venue: event.venue,
                    prizePool: event.prizePool
                },
                targetAudience: 'ALL_STUDENTS',
                createdAt: serverTimestamp(),
                read: false
            });
            console.log('✅ Notification created for students');
        } catch (err) {
            console.error('Error creating notification:', err);
        }
    };

    // Delete Club
    const handleDeleteClub = async (club: Club) => {
        if (!confirm(`Are you sure you want to delete "${club.name}"?`)) return;

        try {
            await deleteDoc(doc(db, 'clubs', club.id!));
            setSuccess('Club deleted successfully');
            fetchClubs();
            if (selectedClub?.id === club.id) {
                setSelectedClub(null);
            }
        } catch (err) {
            console.error('Error deleting club:', err);
            setError('Failed to delete club');
        }
    };

    // Delete Event
    const handleDeleteEvent = async (event: ClubEvent) => {
        if (!confirm(`Are you sure you want to delete "${event.name}"?`)) return;

        try {
            await deleteDoc(doc(db, 'clubEvents', event.id!));
            setSuccess('Event deleted successfully');
            if (selectedClub) {
                fetchEvents(selectedClub.id!);
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            setError('Failed to delete event');
        }
    };

    // Reset forms
    const resetClubForm = () => {
        setClubName('');
        setClubLogo('');
        setClubDescription('');
        setClubFocusAreas('');
        setEditingClub(null);
    };

    const resetEventForm = () => {
        setEventName('');
        setEventPoster('');
        setEventDetails('');
        setEventPrizePool('');
        setEventDate('');
        setEventTime('');
        setEventVenue('');
        setEditingEvent(null);
    };

    // Open edit modals
    const openEditClub = (club: Club) => {
        setEditingClub(club);
        setClubName(club.name);
        setClubLogo(club.logo);
        setClubDescription(club.description);
        setClubFocusAreas(club.focusAreas.join(', '));
        setShowClubModal(true);
    };

    const openEditEvent = (event: ClubEvent) => {
        setEditingEvent(event);
        setEventName(event.name);
        setEventPoster(event.poster);
        setEventDetails(event.details);
        setEventPrizePool(event.prizePool);
        setEventDate(event.date);
        setEventTime(event.time);
        setEventVenue(event.venue);
        setShowEventModal(true);
    };

    // Clear messages after delay
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {selectedClub && (
                        <button
                            onClick={() => setSelectedClub(null)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {selectedClub ? selectedClub.name : 'Club Management'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {selectedClub
                                ? 'Manage events and activities'
                                : 'Create and manage campus clubs and events'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => selectedClub ? setShowEventModal(true) : setShowClubModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white gap-2 rounded-full px-6 shadow-lg shadow-pink-500/20"
                >
                    <Plus className="w-5 h-5" />
                    {selectedClub ? 'New Event' : 'New Club'}
                </Button>
            </header>

            {/* Success/Error Messages */}
            {success && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
            ) : selectedClub ? (
                /* Club Detail View - Events */
                <div className="space-y-6">
                    {/* Club Info Card */}
                    <GlassCard className="p-6 bg-white/60 border-white/60">
                        <div className="flex items-start gap-6">
                            {selectedClub.logo ? (
                                <img
                                    src={selectedClub.logo}
                                    alt={selectedClub.name}
                                    className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                                    <Users className="w-12 h-12 text-white" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-slate-900">{selectedClub.name}</h2>
                                <p className="text-slate-600 mt-2">{selectedClub.description}</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {selectedClub.focusAreas.map((area, i) => (
                                        <span key={i} className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => openEditClub(selectedClub)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Events Grid */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-pink-500" />
                            Club Events
                        </h3>

                        {events.length === 0 ? (
                            <GlassCard className="p-12 bg-white/40 border-dashed border-2 border-slate-300 text-center">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500 font-medium">No events yet</p>
                                <p className="text-slate-400 text-sm mt-1">Create your first event to get started</p>
                                <Button
                                    onClick={() => setShowEventModal(true)}
                                    className="mt-4 bg-pink-500 hover:bg-pink-600"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Event
                                </Button>
                            </GlassCard>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events.map((event) => (
                                    <GlassCard
                                        key={event.id}
                                        className="p-0 bg-white/60 border-white/60 overflow-hidden hover:shadow-xl transition-shadow"
                                    >
                                        {/* Event Poster */}
                                        {event.poster ? (
                                            <img
                                                src={event.poster}
                                                alt={event.name}
                                                className="w-full h-48 object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-48 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                                                <ImageIcon className="w-16 h-16 text-pink-300" />
                                            </div>
                                        )}

                                        <div className="p-5">
                                            <h4 className="font-bold text-lg text-slate-900">{event.name}</h4>

                                            {/* Prize Pool Highlight */}
                                            {event.prizePool && (
                                                <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Trophy className="w-5 h-5 text-amber-500" />
                                                        <span className="font-bold text-amber-700">Prize Pool</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-amber-600 mt-1">{event.prizePool}</p>
                                                </div>
                                            )}

                                            <p className="text-slate-600 text-sm mt-3 line-clamp-2">{event.details}</p>

                                            <div className="mt-4 space-y-2 text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(event.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}</span>
                                                </div>
                                                {event.time && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{event.time}</span>
                                                    </div>
                                                )}
                                                {event.venue && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{event.venue}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                                {event.notifiedStudents && (
                                                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                                                        <Bell className="w-3 h-3" />
                                                        Students notified
                                                    </span>
                                                )}
                                                <div className="flex gap-2 ml-auto">
                                                    <Button variant="ghost" className="p-2" onClick={() => openEditEvent(event)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" className="p-2 text-red-500" onClick={() => handleDeleteEvent(event)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Clubs List View */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Clubs */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {clubs.map((club) => (
                                <GlassCard
                                    key={club.id}
                                    className="p-6 bg-white/60 border-white/60 hover:scale-[1.02] transition-transform cursor-pointer"
                                    onClick={() => setSelectedClub(club)}
                                >
                                    <div className="flex items-start justify-between">
                                        {club.logo ? (
                                            <img
                                                src={club.logo}
                                                alt={club.name}
                                                className="w-14 h-14 rounded-xl object-cover shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                                                <Users className="w-7 h-7" />
                                            </div>
                                        )}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditClub(club); }}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4 text-slate-500" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClub(club); }}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mt-4">{club.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1 line-clamp-2">{club.description}</p>
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {club.focusAreas.slice(0, 3).map((area, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded text-xs font-medium">
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                        <span className="text-slate-500 text-sm flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {club.members} Members
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                </GlassCard>
                            ))}

                            {/* Create New Club Card */}
                            <GlassCard
                                className="p-6 bg-white/40 border-dashed border-2 border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-white/60 hover:border-pink-300 hover:text-pink-500 transition-all cursor-pointer min-h-[200px]"
                                onClick={() => setShowClubModal(true)}
                            >
                                <Plus className="w-10 h-10 mb-2" />
                                <span className="font-medium text-lg">Create New Club</span>
                                <span className="text-sm mt-1">Add a new campus club</span>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Stats Card */}
                        <GlassCard className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                            <h3 className="font-bold text-lg mb-4">Club Statistics</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-pink-100">Total Clubs</span>
                                    <span className="text-2xl font-bold">{clubs.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-pink-100">Active Events</span>
                                    <span className="text-2xl font-bold">{events.length}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Quick Tips */}
                        <GlassCard className="p-6 bg-white/60 border-white/60">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-pink-500" />
                                Quick Tips
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <Target className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                    <span>Add focus areas to help students find relevant clubs</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ImageIcon className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                    <span>Upload attractive event posters to increase engagement</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Trophy className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                    <span>Highlight prize pools to attract more participants</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Bell className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                                    <span>Students are automatically notified about new events</span>
                                </li>
                            </ul>
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* Club Modal */}
            {showClubModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingClub ? 'Edit Club' : 'Create New Club'}
                            </h2>
                            <button
                                onClick={() => { setShowClubModal(false); resetClubForm(); }}
                                className="p-2 hover:bg-slate-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Club Logo</label>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                <div
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-pink-400 transition-colors overflow-hidden"
                                >
                                    {clubLogo ? (
                                        <img src={clubLogo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                    )}
                                </div>
                            </div>

                            {/* Club Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Club Name *</label>
                                <input
                                    type="text"
                                    value={clubName}
                                    onChange={(e) => setClubName(e.target.value)}
                                    placeholder="e.g., AI & Robotics Club"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                <textarea
                                    value={clubDescription}
                                    onChange={(e) => setClubDescription(e.target.value)}
                                    placeholder="Describe what this club is about..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                                />
                            </div>

                            {/* Focus Areas */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Focus Areas</label>
                                <input
                                    type="text"
                                    value={clubFocusAreas}
                                    onChange={(e) => setClubFocusAreas(e.target.value)}
                                    placeholder="e.g., Machine Learning, Robotics, IoT (comma separated)"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Separate multiple areas with commas</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => { setShowClubModal(false); resetClubForm(); }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveClub}
                                disabled={isSavingClub}
                                className="flex-1 bg-pink-500 hover:bg-pink-600"
                            >
                                {isSavingClub ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    editingClub ? 'Update Club' : 'Create Club'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Modal */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingEvent ? 'Edit Event' : 'Create New Event'}
                            </h2>
                            <button
                                onClick={() => { setShowEventModal(false); resetEventForm(); }}
                                className="p-2 hover:bg-slate-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Poster Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Event Poster</label>
                                <input
                                    ref={posterInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePosterUpload}
                                    className="hidden"
                                />
                                <div
                                    onClick={() => posterInputRef.current?.click()}
                                    className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-pink-400 transition-colors overflow-hidden"
                                >
                                    {eventPoster ? (
                                        <img src={eventPoster} alt="Poster" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                            <p className="text-sm text-slate-500">Click to upload poster</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Event Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Event Name *</label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g., Hackathon 2026"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            {/* Prize Pool - Highlighted */}
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    Prize Pool
                                </label>
                                <input
                                    type="text"
                                    value={eventPrizePool}
                                    onChange={(e) => setEventPrizePool(e.target.value)}
                                    placeholder="e.g., ₹50,000 or Exciting Prizes!"
                                    className="w-full px-4 py-3 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {/* Details */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Event Details</label>
                                <textarea
                                    value={eventDetails}
                                    onChange={(e) => setEventDetails(e.target.value)}
                                    placeholder="Describe the event, rules, eligibility..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                                />
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={eventTime}
                                        onChange={(e) => setEventTime(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>
                            </div>

                            {/* Venue */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Venue</label>
                                <input
                                    type="text"
                                    value={eventVenue}
                                    onChange={(e) => setEventVenue(e.target.value)}
                                    placeholder="e.g., Main Auditorium or Online"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            {/* Notification Info */}
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
                                <Bell className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700">
                                    All students will be automatically notified about this event when you create it.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => { setShowEventModal(false); resetEventForm(); }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEvent}
                                disabled={isSavingEvent}
                                className="flex-1 bg-pink-500 hover:bg-pink-600"
                            >
                                {isSavingEvent ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    editingEvent ? 'Update Event' : 'Create & Notify Students'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

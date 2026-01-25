'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Search, Filter, UserPlus, Video, MessageCircle, CheckCircle, XCircle, Clock, Award, BookOpen, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import peersService, { UserProfile, Connection } from '@/lib/peersService';
import notificationService from '@/lib/notificationService';
import ChatModal from '@/components/ChatModal';
import { Sparkles as SparklesIcon } from 'lucide-react';

export default function ConnectPage() {
    const { user, professorSession } = useAuth();
    const currentUserId = user?.uid || professorSession?.uid;

    const { notificationsEnabled, setNotificationsEnabled, recommendedPartners } = useNotifications();
    const [peers, setPeers] = useState<UserProfile[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [activeChatPeer, setActiveChatPeer] = useState<{ id: string; name: string; connectionId: string } | null>(null);

    // Load peers and connections
    useEffect(() => {
        const loadData = async () => {
            if (!currentUserId) return;

            try {
                // Create/update current user's profile ONLY if it's a student
                if (user?.uid) {
                    await peersService.createUserProfile({
                        userId: user.uid,
                        displayName: user.displayName || '',
                        email: user.email || '',
                        department: 'Computer Science',
                        year: 3,
                        interests: ['AI', 'Web Development'],
                        photoURL: user.photoURL
                    });
                }

                // Load all peers
                let allUsers = await peersService.getAllUsers();

                // Load connections
                const userConnections = await peersService.getUserConnections(currentUserId);
                setConnections(userConnections);

                // Check for pending requests from users NOT in allUsers
                const pendingRequestUserIds = userConnections
                    .filter(c => c.toUserId === currentUserId && c.status === 'pending')
                    .map(c => c.fromUserId);

                // Find IDs that are missing from allUsers
                const missingUserIds = pendingRequestUserIds.filter(id => !allUsers.find(u => u.userId === id));

                if (missingUserIds.length > 0) {
                    console.log('Fetching missing profiles for pending requests:', missingUserIds);
                    try {
                        const missingProfiles = await Promise.all(
                            missingUserIds.map(id => peersService.getUserProfile(id))
                        );
                        const validMissingProfiles = missingProfiles.filter(p => p !== null) as UserProfile[];
                        allUsers = [...allUsers, ...validMissingProfiles];
                    } catch (e) {
                        console.error('Error fetching missing profiles:', e);
                    }
                }

                // Filter out current user
                const otherUsers = allUsers.filter(u => u.userId !== currentUserId);

                // Remove duplicates (just in case)
                const uniqueUsers = Array.from(new Map(otherUsers.map(item => [item.userId, item])).values());

                setPeers(uniqueUsers);

                // Get my profile for matching
                const myProfile = allUsers.find(u => u.userId === currentUserId);
                if (myProfile) setCurrentUserProfile(myProfile);

                console.log('✅ Loaded', uniqueUsers.length, 'peers and', userConnections.length, 'connections');
            } catch (error) {
                console.error('❌ Error loading peers:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        // Refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [currentUserId, user]);


    // Note: Recommendations are now loaded globally by NotificationProvider
    // This runs in the background on all pages, not just Peer Connect


    // Check notification permission on mount
    useEffect(() => {
        if (!notificationService.isSupported()) {
            console.warn('Browser notifications not supported');
            return;
        }

        const permission = notificationService.getPermission();
        setNotificationsEnabled(permission.granted);

        // Show prompt if permission is pending and user hasn't dismissed it
        if (permission.pending && !sessionStorage.getItem('notification-prompt-dismissed')) {
            setShowNotificationPrompt(true);
        }
    }, []);

    // Handle notification permission request
    const handleEnableNotifications = async () => {
        const granted = await notificationService.requestPermission();
        setNotificationsEnabled(granted);
        setShowNotificationPrompt(false);

        if (granted) {
            console.log('✅ Notifications enabled');
            // Show a test notification
            notificationService.showPartnerNotification({
                uid: 'demo',
                displayName: 'Demo Student',
                academicYear: 3,
                department: 'Computer Science',
                matchedTopics: ['Notifications Enabled!'],
                lastActiveAt: new Date(),
                courseId: 'CS101'
            });
        } else {
            console.warn('⚠️ Notifications permission denied');
        }
    };

    const handleDismissNotificationPrompt = () => {
        setShowNotificationPrompt(false);
        sessionStorage.setItem('notification-prompt-dismissed', 'true');
    };

    // Send connection request
    const handleConnect = async (peerId: string) => {
        if (!currentUserId) return;

        try {
            await peersService.sendConnectionRequest(currentUserId, peerId);
            // Reload connections
            const userConnections = await peersService.getUserConnections(currentUserId);
            setConnections(userConnections);
            console.log('✅ Connection request sent');
        } catch (error) {
            console.error('❌ Error sending connection:', error);
        }
    };

    // Accept connection request
    const handleAccept = async (connectionId: string) => {
        if (!currentUserId) return;
        try {
            await peersService.updateConnectionStatus(connectionId, 'accepted');
            // Reload connections
            const userConnections = await peersService.getUserConnections(currentUserId);
            setConnections(userConnections);
            console.log('✅ Connection accepted');
        } catch (error) {
            console.error('❌ Error accepting connection:', error);
        }
    };

    // Reject connection request
    const handleReject = async (connectionId: string) => {
        if (!currentUserId) return;
        try {
            await peersService.updateConnectionStatus(connectionId, 'rejected');
            // Reload connections
            const userConnections = await peersService.getUserConnections(currentUserId);
            setConnections(userConnections);
            console.log('✅ Connection rejected');
        } catch (error) {
            console.error('❌ Error rejecting connection:', error);
        }
    };

    // Get connection status for a peer
    const getConnectionStatus = (peerId: string): { status: string; connectionId?: string; isPending?: boolean } => {
        // Check if we sent a request to this peer
        const sentRequest = connections.find(c => c.fromUserId === currentUserId && c.toUserId === peerId);
        if (sentRequest) {
            if (sentRequest.status === 'pending') return { status: 'pending_sent', connectionId: sentRequest.connectionId };
            if (sentRequest.status === 'accepted') return { status: 'connected', connectionId: sentRequest.connectionId };
        }

        // Check if this peer sent us a request
        const receivedRequest = connections.find(c => c.fromUserId === peerId && c.toUserId === currentUserId);
        if (receivedRequest) {
            if (receivedRequest.status === 'pending') return { status: 'pending_received', connectionId: receivedRequest.connectionId, isPending: true };
            if (receivedRequest.status === 'accepted') return { status: 'connected', connectionId: receivedRequest.connectionId };
        }

        return { status: 'not_connected' };
    };

    // Filter peers
    const filteredPeers = peers.filter(peer => {
        const matchesSearch = peer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            peer.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDepartment === 'all' || peer.department === filterDepartment;
        const matchesYear = filterYear === 'all' || peer.year.toString() === filterYear;
        return matchesSearch && matchesDept && matchesYear;
    });

    // Get pending requests (requests sent to us)
    const pendingRequests = connections.filter(c =>
        c.toUserId === currentUserId && c.status === 'pending'
    );

    // Get connected peers
    const connectedPeers = peers.filter(peer => {
        const status = getConnectionStatus(peer.userId);
        return status.status === 'connected';
    });

    // Study Matches (Intersection of topics)
    const studyMatches = peers.filter(peer => {
        if (!currentUserProfile?.studyTopics || !peer.studyTopics) return false;
        const intersection = peer.studyTopics.filter(topic =>
            currentUserProfile.studyTopics?.some(myTopic =>
                myTopic.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(myTopic.toLowerCase())
            )
        );
        return intersection.length > 0;
    });

    const openChat = (peerId: string, peerName: string, connectionId?: string) => {
        if (!connectionId) return;
        setActiveChatPeer({ id: peerId, name: peerName, connectionId });
        setChatOpen(true);
    };

    // Helper function to display relative time
    const getTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} min ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading peers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Peer Connect</h1>
                    <p className="text-slate-500 mt-1">Connect with students, share knowledge, and grow together</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Toggle Button */}
                    {notificationService.isSupported() && (
                        <button
                            onClick={handleEnableNotifications}
                            className={`relative p-2 rounded-lg border transition-colors ${notificationsEnabled ? 'bg-green-50 border-green-300 text-green-700' : 'border-slate-300 hover:bg-slate-50'}`}
                            title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications for new study partners'}
                        >
                            {notificationsEnabled ? (
                                <Bell className="w-5 h-5" />
                            ) : (
                                <BellOff className="w-5 h-5" />
                            )}
                            {notificationsEnabled && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    )}
                    <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{connectedPeers.length}</p>
                        <p className="text-xs text-slate-500">Connected</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
                        <p className="text-xs text-slate-500">Pending</p>
                    </div>
                </div>
            </header>

            {/* Notification Permission Prompt */}
            {showNotificationPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <GlassCard className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-purple-900">Get notified about new study partners</h3>
                                    <p className="text-sm text-purple-700">We'll send you a notification when someone studying similar topics appears</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleEnableNotifications}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm"
                                >
                                    Enable
                                </Button>
                                <Button
                                    onClick={handleDismissNotificationPrompt}
                                    variant="ghost"
                                    className="text-slate-600 hover:text-slate-800 px-3 py-2 text-sm"
                                >
                                    Not now
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {/* Pending Requests Banner */}
            {pendingRequests.length > 0 && (
                <GlassCard className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="font-bold text-blue-900">Pending Connection Requests</h3>
                                <p className="text-sm text-blue-700">You have {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {pendingRequests.map(request => {
                            const requester = peers.find(p => p.userId === request.fromUserId);
                            if (!requester) return null;
                            return (
                                <div key={request.connectionId} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {requester.displayName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-800">{requester.displayName}</p>
                                                {requester.role === 'professor' && (
                                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-200">
                                                        Professor
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{requester.department} • Year {requester.year}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleAccept(request.connectionId!)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm gap-1"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Accept
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(request.connectionId!)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm gap-1"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            )}

            {/* AI-Powered Recommended Study Partners (Real-time Activity-Based) */}
            {recommendedPartners.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-purple-600 animate-pulse" />
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Recommended Study Partners</h2>
                                <p className="text-xs text-slate-500">Students studying similar topics right now</p>
                            </div>
                        </div>
                        {loadingRecommendations && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                Updating...
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendedPartners.slice(0, 6).map(partner => {
                            const connectionInfo = getConnectionStatus(partner.uid);
                            const isConnected = connectionInfo.status === 'connected';
                            const isPendingSent = connectionInfo.status === 'pending_sent';

                            return (
                                <motion.div
                                    key={partner.uid}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <GlassCard className="p-5 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50 hover:shadow-xl transition-all">
                                        {/* Partner Header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg relative">
                                                {partner.displayName.charAt(0)}
                                                {/* Active indicator */}
                                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900">{partner.displayName}</h3>
                                                <p className="text-xs text-slate-500">{partner.department} • Year {partner.academicYear}</p>
                                            </div>
                                        </div>

                                        {/* Currently Studying Badge */}
                                        <div className="mb-3 space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-purple-700 font-medium">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>Currently studying:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {partner.matchedTopics.slice(0, 2).map((topic, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs rounded-full font-medium border border-purple-200"
                                                    >
                                                        {topic}
                                                    </span>
                                                ))}
                                                {partner.matchedTopics.length > 2 && (
                                                    <span className="px-2 py-1 text-xs text-slate-500">
                                                        +{partner.matchedTopics.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity Timestamp */}
                                        <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Active {getTimeAgo(partner.lastActiveAt)}</span>
                                        </div>

                                        {/* Action Buttons */}
                                        {isConnected ? (
                                            <div className="flex gap-2">
                                                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 text-sm h-9">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Connected
                                                </Button>
                                                <Button
                                                    onClick={() => openChat(partner.uid, partner.displayName, connectionInfo.connectionId)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : isPendingSent ? (
                                            <Button disabled className="w-full bg-gray-400 text-white gap-2 text-sm h-9 cursor-not-allowed">
                                                <Clock className="w-4 h-4" />
                                                Request Sent
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleConnect(partner.uid)}
                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 text-sm h-9"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                Connect
                                            </Button>
                                        )}
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        placeholder="Search by name or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                >
                    <option value="all">All Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                >
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            </div>

            {/* Peers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPeers.map(peer => {
                    const connectionInfo = getConnectionStatus(peer.userId);
                    const isConnected = connectionInfo.status === 'connected';
                    const isPendingSent = connectionInfo.status === 'pending_sent';
                    const isPendingReceived = connectionInfo.status === 'pending_received';

                    return (
                        <motion.div
                            key={peer.userId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <GlassCard className="p-5 hover:shadow-lg transition-shadow">
                                {/* Profile Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg relative">
                                            {peer.displayName.charAt(0)}
                                            {peer.isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-800">{peer.displayName}</h3>
                                                {peer.role === 'professor' && (
                                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-200">
                                                        Professor
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{peer.department}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Award className="w-4 h-4 text-orange-500" />
                                        <span>Year {peer.year}</span>
                                    </div>
                                    {peer.interests && peer.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {peer.interests.slice(0, 3).map((interest, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {isConnected ? (
                                        <>
                                            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                Connected
                                            </Button>
                                            <Button
                                                onClick={() => openChat(peer.userId, peer.displayName, connectionInfo.connectionId)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white p-2">
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </>
                                    ) : isPendingSent ? (
                                        <Button disabled className="flex-1 bg-gray-400 text-white gap-2 text-sm cursor-not-allowed">
                                            <Clock className="w-4 h-4" />
                                            Request Sent
                                        </Button>
                                    ) : isPendingReceived ? (
                                        <div className="flex gap-2 flex-1">
                                            <Button
                                                onClick={() => handleAccept(connectionInfo.connectionId!)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(connectionInfo.connectionId!)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => handleConnect(peer.userId)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {filteredPeers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No peers found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters</p>
                </div>
            )}
            {/* Chat Modal */}
            {activeChatPeer && (
                <ChatModal
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                    connectionId={activeChatPeer.connectionId}
                    currentUserId={currentUserId || ''}
                    peerName={activeChatPeer.name}
                    peerId={activeChatPeer.id}
                />
            )}
        </div>
    );
}

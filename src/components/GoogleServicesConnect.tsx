'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, linkWithPopup, unlink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Check, X, Link as LinkIcon, Unlink } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

interface GoogleServicesConnectProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function GoogleServicesConnect({
    onSuccess,
    onError,
}: GoogleServicesConnectProps) {
    const [loading, setLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
    const { user, refreshUser } = useAuth();

    // Check if Google is already linked
    useEffect(() => {
        const checkConnection = () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const googleProvider = currentUser.providerData.find(
                    (provider) => provider.providerId === 'google.com'
                );
                if (googleProvider) {
                    setIsConnected(true);
                    setConnectedEmail(googleProvider.email);
                } else {
                    setIsConnected(false);
                    setConnectedEmail(null);
                }
            } else if (user) {
                // Fallback: check if we have a stored token if Auth user isn't loaded yet
                const storedToken = localStorage.getItem('googleAccessToken');
                if (storedToken) {
                    // We don't have the email from the token easily, but we know it was connected
                    // For now, we'll wait for Firebase Auth to initialize
                }
            }
        };

        checkConnection();
        const unsubscribe = auth.onAuthStateChanged(checkConnection);
        return () => unsubscribe();
    }, [user]);

    // Check for stored access token
    useEffect(() => {
        const storedToken = localStorage.getItem('googleAccessToken');
        if (storedToken && !isConnected) {
            // Token exists but not linked - might be from a previous session
            console.log('Found stored Google access token');
        }
    }, [isConnected]);

    const handleConnectGoogle = async () => {
        const currentUser = auth.currentUser;
        if (!user || !currentUser) {
            onError?.('You must be logged in with a valid session to connect Google services');
            return;
        }

        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();

            // Add scopes for profile, email, and Google Drive access
            provider.addScope('profile');
            provider.addScope('email');
            provider.addScope('https://www.googleapis.com/auth/drive');
            provider.addScope('https://www.googleapis.com/auth/drive.file');

            // Set custom parameters to prompt for consent
            provider.setCustomParameters({
                prompt: 'consent'
            });

            const result = await linkWithPopup(auth.currentUser!, provider);

            // Extract Google OAuth access token (for Google API calls like Drive)
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const googleAccessToken = credential?.accessToken;

            if (googleAccessToken) {
                // Store the Google access token for API calls
                localStorage.setItem('googleAccessToken', googleAccessToken);
                console.log('✅ Google access token stored for API access');
            }

            setIsConnected(true);
            setConnectedEmail(result.user.providerData.find(p => p.providerId === 'google.com')?.email || null);
            onSuccess?.();
            await refreshUser();
            console.log('✅ Google account linked successfully');
        } catch (error: any) {
            console.error('❌ Error linking Google:', error);

            let errorMessage = 'Failed to connect Google. Please try again.';

            if (error.code === 'auth/credential-already-in-use') {
                errorMessage = 'This Google account is already linked to another user.';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Google sign-in popup was closed.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup was blocked. Please allow popups.';
            } else if (error.code === 'auth/provider-already-linked') {
                errorMessage = 'A Google account is already connected.';
                setIsConnected(true);
            }

            onError?.(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectGoogle = async () => {
        const currentUser = auth.currentUser;
        if (!user || !currentUser) return;

        setLoading(true);
        try {
            await unlink(currentUser, 'google.com');
            localStorage.removeItem('googleAccessToken');
            setIsConnected(false);
            setConnectedEmail(null);
            console.log('✅ Google account unlinked');
        } catch (error: any) {
            console.error('❌ Error unlinking Google:', error);
            onError?.(error.message || 'Failed to disconnect Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="p-6 bg-gradient-to-br from-white via-slate-50 to-blue-50">
            <div className="flex items-start gap-4">
                {/* Google Icon */}
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-800 text-lg">Google Services</h3>
                        {isConnected && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Connected
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Connect your Google account to access Google Drive, Docs, and other services for enhanced learning features.
                    </p>

                    {isConnected && connectedEmail && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm text-green-700">
                                <span className="font-medium">Connected as:</span> {connectedEmail}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        {isConnected ? (
                            <Button
                                onClick={handleDisconnectGoogle}
                                disabled={loading}
                                variant="outline"
                                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Unlink className="w-4 h-4" />
                                )}
                                Disconnect Google
                            </Button>
                        ) : (
                            <Button
                                onClick={handleConnectGoogle}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LinkIcon className="w-4 h-4" />
                                )}
                                Connect Google Account
                            </Button>
                        )}
                    </div>

                    {/* Services List */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-2">Available services:</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { name: 'Google Drive', available: true },
                                { name: 'Google Docs', available: true },
                                { name: 'Google Sheets', available: true },
                                { name: 'Google Slides', available: true },
                            ].map((service) => (
                                <span
                                    key={service.name}
                                    className={`text-xs px-2 py-1 rounded ${isConnected && service.available
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-400'
                                        }`}
                                >
                                    {service.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}

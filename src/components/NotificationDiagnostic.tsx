// Notification Diagnostic Component
// Add this to your Connect page for debugging

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface DiagnosticProps {
    notificationsEnabled: boolean;
    recommendedPartners: any[];
    previousPartners: any[];
}

export function NotificationDiagnostic({ notificationsEnabled, recommendedPartners, previousPartners }: DiagnosticProps) {
    const [show, setShow] = useState(false);

    const checks = [
        {
            label: 'Notifications Supported',
            status: 'Notification' in window,
            icon: 'Notification' in window ? CheckCircle : XCircle
        },
        {
            label: 'Permission Granted',
            status: Notification.permission === 'granted',
            icon: Notification.permission === 'granted' ? CheckCircle : AlertCircle,
            detail: `Current: ${Notification.permission}`
        },
        {
            label: 'Enabled in App',
            status: notificationsEnabled,
            icon: notificationsEnabled ? CheckCircle : AlertCircle
        },
        {
            label: 'Has Recommendations',
            status: recommendedPartners.length > 0,
            icon: recommendedPartners.length > 0 ? CheckCircle : Info,
            detail: `${recommendedPartners.length} partners found`
        },
        {
            label: 'Previous Partners Tracked',
            status: previousPartners.length >= 0,
            icon: Info,
            detail: `${previousPartners.length} previous`
        }
    ];

    const newPartnersCount = recommendedPartners.filter(
        p => !previousPartners.some(prev => prev.uid === p.uid)
    ).length;

    return (
        <>
            <button
                onClick={() => setShow(!show)}
                className="fixed bottom-4 right-4 px-4 py-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all z-50 text-sm font-medium"
            >
                {show ? 'Hide' : 'Show'} Diagnostics
            </button>

            {show && (
                <div className="fixed bottom-16 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">🔔 Notification Status</h3>

                    <div className="space-y-3">
                        {checks.map((check, i) => {
                            const Icon = check.icon;
                            return (
                                <div key={i} className="flex items-start gap-3">
                                    <Icon className={`w-5 h-5 mt-0.5 ${Icon === CheckCircle ? 'text-green-600' :
                                            Icon === AlertCircle ? 'text-orange-600' :
                                                Icon === XCircle ? 'text-red-600' :
                                                    'text-blue-600'
                                        }`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">{check.label}</p>
                                        {check.detail && (
                                            <p className="text-xs text-slate-500">{check.detail}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-600 mb-2">Detection Status:</p>
                        <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono">
                            <div>Current: {recommendedPartners.length}</div>
                            <div>Previous: {previousPartners.length}</div>
                            <div className="text-purple-600 font-bold mt-1">
                                New: {newPartnersCount}
                                {newPartnersCount > 0 && ' 🎉'}
                            </div>
                        </div>
                    </div>

                    {recommendedPartners.length === 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                                <strong>No partners found.</strong> Try asking a question in Neural Notebook to test topic extraction.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            console.log('📊 Diagnostic Info:', {
                                notificationsEnabled,
                                permission: Notification.permission,
                                currentPartners: recommendedPartners,
                                previousPartners,
                                newCount: newPartnersCount
                            });
                        }}
                        className="mt-4 w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                        Log to Console
                    </button>
                </div>
            )}
        </>
    );
}

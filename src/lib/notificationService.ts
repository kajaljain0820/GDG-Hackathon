// Browser Notification Service for Study Partner Recommendations
import { StudyPartnerMatch } from './studyContextService';

export interface NotificationPermissionState {
    granted: boolean;
    denied: boolean;
    pending: boolean;
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
    if (!isNotificationSupported()) {
        return { granted: false, denied: true, pending: false };
    }

    const permission = Notification.permission;
    return {
        granted: permission === 'granted',
        denied: permission === 'denied',
        pending: permission === 'default'
    };
}

/**
 * Request notification permission from user
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported in this browser');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('Notification permission was previously denied');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Show notification for a new recommended study partner
 */
export function showStudyPartnerNotification(partner: StudyPartnerMatch): void {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
        console.log('Cannot show notification - permission not granted');
        return;
    }

    try {
        const topicsText = partner.matchedTopics.slice(0, 2).join(', ');
        const moreTopics = partner.matchedTopics.length > 2
            ? ` +${partner.matchedTopics.length - 2} more`
            : '';

        const notification = new Notification('✨ New Study Partner Match!', {
            body: `${partner.displayName} is studying ${topicsText}${moreTopics}`,
            icon: '/favicon.ico', // Use your app icon
            badge: '/favicon.ico',
            tag: `study-partner-${partner.uid}`, // Prevents duplicate notifications
            requireInteraction: false,
            silent: false,
            data: {
                partnerId: partner.uid,
                partnerName: partner.displayName,
                topics: partner.matchedTopics
            }
        });

        // Handle notification click - focus the app and navigate to Peer Connect
        notification.onclick = () => {
            window.focus();
            // Navigate to peer connect page
            if (window.location.pathname !== '/dashboard/connect') {
                window.location.href = '/dashboard/connect';
            }
            notification.close();
        };

        // Auto-close after 8 seconds
        setTimeout(() => {
            notification.close();
        }, 8000);

        console.log('✅ Notification shown for:', partner.displayName);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

/**
 * Show notification for multiple new study partners
 */
export function showMultiplePartnersNotification(count: number, partners: StudyPartnerMatch[]): void {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
        return;
    }

    try {
        const firstPartner = partners[0];
        const topicsText = firstPartner.matchedTopics.slice(0, 2).join(', ');

        const notification = new Notification(`✨ ${count} New Study Partner${count > 1 ? 's' : ''}!`, {
            body: count === 1
                ? `${firstPartner.displayName} is studying ${topicsText}`
                : `${firstPartner.displayName} and ${count - 1} other${count > 2 ? 's' : ''} studying similar topics`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'study-partners-multiple',
            requireInteraction: false,
            silent: false
        });

        notification.onclick = () => {
            window.focus();
            if (window.location.pathname !== '/dashboard/connect') {
                window.location.href = '/dashboard/connect';
            }
            notification.close();
        };

        setTimeout(() => {
            notification.close();
        }, 10000);

        console.log(`✅ Notification shown for ${count} partners`);
    } catch (error) {
        console.error('Error showing multiple partners notification:', error);
    }
}

/**
 * Test notification (for debugging)
 */
export async function testNotification(): Promise<boolean> {
    console.log('🧪 Testing notification system...');
    console.log('1️⃣ Checking browser support:', isNotificationSupported());
    console.log('2️⃣ Current permission:', Notification.permission);

    if (!isNotificationSupported()) {
        alert('❌ Your browser does not support notifications.\n\nPlease use Chrome, Firefox, Edge, or Safari.');
        return false;
    }

    console.log('3️⃣ Requesting permission...');
    const hasPermission = await requestNotificationPermission();
    console.log('4️⃣ Permission result:', hasPermission);

    if (!hasPermission) {
        const reason = Notification.permission === 'denied'
            ? 'You previously blocked notifications.\n\nTo fix:\n1. Click the lock/info icon in address bar\n2. Find "Notifications"\n3. Change to "Allow"\n4. Refresh the page'
            : 'Permission was not granted.';

        alert(`❌ Cannot show notifications\n\n${reason}`);
        console.warn('Cannot show test notification - permission denied');
        return false;
    }

    try {
        console.log('5️⃣ Creating test notification...');

        const testPartner: StudyPartnerMatch = {
            uid: 'test-123',
            displayName: 'Test Student',
            academicYear: 3,
            department: 'Computer Science',
            matchedTopics: ['Notifications Working!', 'Test Mode'],
            lastActiveAt: new Date(),
            courseId: 'CS101'
        };

        const notification = new Notification('🎉 Notification Test Successful!', {
            body: 'Your notifications are working! You will receive alerts when new study partners appear.',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            silent: false
        });

        notification.onclick = () => {
            console.log('Notification clicked!');
            window.focus();
            notification.close();
        };

        setTimeout(() => notification.close(), 5000);

        console.log('✅ Test notification sent successfully!');

        // Also show a success alert
        setTimeout(() => {
            alert('✅ SUCCESS!\n\nNotification appeared! Your notification system is working.\n\nYou will receive alerts when new study partners are detected.');
        }, 100);

        return true;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        alert(`❌ Error showing notification:\n\n${error}\n\nCheck browser console (F12) for details.`);
        return false;
    }
}

/**
 * Detect new partners by comparing with previous list
 */
export function detectNewPartners(
    currentPartners: StudyPartnerMatch[],
    previousPartners: StudyPartnerMatch[]
): StudyPartnerMatch[] {
    const previousIds = new Set(previousPartners.map(p => p.uid));
    return currentPartners.filter(partner => !previousIds.has(partner.uid));
}

export const notificationService = {
    isSupported: isNotificationSupported,
    getPermission: getNotificationPermission,
    requestPermission: requestNotificationPermission,
    showPartnerNotification: showStudyPartnerNotification,
    showMultipleNotification: showMultiplePartnersNotification,
    detectNew: detectNewPartners,
    test: testNotification
};

export default notificationService;

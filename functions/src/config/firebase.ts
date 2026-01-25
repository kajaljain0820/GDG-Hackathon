import * as admin from 'firebase-admin';

// Initialize Admin SDK - simplified for emulator compatibility
if (!admin.apps.length) {
    if (process.env.FUNCTIONS_EMULATOR) {
        // Emulator mode - use default init (faster startup)
        console.log('🔧 Running in emulator mode');
        admin.initializeApp({
            projectId: 'sparklink-d72d1',
            storageBucket: 'sparklink-d72d1.firebasestorage.app'
        });
    } else {
        // Production - use default credentials
        admin.initializeApp({
            storageBucket: 'sparklink-d72d1.firebasestorage.app'
        });
    }
    console.log('✅ Admin SDK initialized');
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();


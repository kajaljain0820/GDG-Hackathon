import * as admin from 'firebase-admin';

// Initialize Admin SDK
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

    if (serviceAccount || process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
            credential: serviceAccount ? admin.credential.cert(serviceAccount) : undefined,
            projectId: process.env.FIREBASE_PROJECT_ID || 'sparklink-d72d1',
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'sparklink-d72d1.firebasestorage.app'
        });
        console.log('✅ Firebase Admin SDK initialized');
    } else {
        console.warn('⚠️ Firebase Admin SDK initialization skipped: No credentials provided');
    }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { db, auth, storage, admin };

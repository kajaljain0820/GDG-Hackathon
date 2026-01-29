import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC88Eau0Kd94gi-JUyyk7p6BGfX2TL8YQ4",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sparklink-d72d1.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sparklink-d72d1",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sparklink-d72d1.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1071232973102",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1071232973102:web:3cf6c11fcf8063f929a2bf"
};

// Validate configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
    console.error('Firebase configuration is missing! Check .env.local file');
    console.log('Current config:', firebaseConfig);
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Enable Emulators in Development
// NOTE: We are switching to HYBRID mode (Local Functions + Real Firestore/Storage)
// because local emulators are unstable on this machine.
/*
if (process.env.NODE_ENV === 'development') {
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    console.log('Connected to Firestore & Storage Emulators');
}
*/

export { db, storage, auth };


import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// Setup Firebase Client (ensure it matches your firebase.json / env)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) {
    initializeApp(firebaseConfig);
}

const auth = getAuth();

// API Client
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api',
    // Note: No default Content-Type - let requests specify their own
});

// Request Interceptor: Attach Token
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Remove Content-Type for FormData (axios adds correct boundary automatically)
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Compat wrapper for legacy code
export const apiRequest = async (endpoint: string, method: string, body?: any, token?: string) => {
    try {
        const config: any = {
            method: method,
            url: endpoint,
            data: body,
            headers: {
                'Content-Type': 'application/json'  // JSON by default
            }
        };
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await api(config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error ? new Error(error.response.data.error) : error;
    }
};

export default api;

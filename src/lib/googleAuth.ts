/**
 * Google OAuth Access Token Utilities
 * 
 * This module provides helper functions to access the Google OAuth token
 * that was obtained during Firebase authentication with Google.
 * 
 * The token is needed to make Google API calls (e.g., Drive API).
 */

/**
 * Get the stored Google OAuth access token
 * @returns The Google access token or null if not available
 */
export function getGoogleAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('googleAccessToken');
}

/**
 * Check if a valid Google access token exists
 * @returns True if a token is stored
 */
export function hasGoogleAccessToken(): boolean {
    return getGoogleAccessToken() !== null;
}

/**
 * Clear the stored Google access token
 * (useful during logout)
 */
export function clearGoogleAccessToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('googleAccessToken');
}

/**
 * Create headers for Google API requests
 * @returns Headers object with Authorization bearer token
 */
export function getGoogleApiHeaders(): HeadersInit | null {
    const token = getGoogleAccessToken();
    if (!token) return null;

    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Example: Make a request to Google Drive API
 * @param endpoint - The Drive API endpoint (e.g., '/files')
 * @returns The API response
 */
export async function callGoogleDriveApi(endpoint: string, options: RequestInit = {}) {
    const headers = getGoogleApiHeaders();

    if (!headers) {
        throw new Error('No Google access token available. Please sign in with Google.');
    }

    const url = `https://www.googleapis.com/drive/v3${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Drive API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Example: Using Google OAuth Access Token
 * 
 * This file demonstrates how to use the Google OAuth access token
 * that is obtained during Firebase authentication to make Google API calls.
 */

import {
    getGoogleAccessToken,
    hasGoogleAccessToken,
    callGoogleDriveApi,
    getGoogleApiHeaders
} from '@/lib/googleAuth';

/**
 * Example 1: List files from Google Drive
 */
export async function listGoogleDriveFiles() {
    try {
        // Check if user has signed in with Google
        if (!hasGoogleAccessToken()) {
            throw new Error('Please sign in with Google first');
        }

        // List files from Drive
        const response = await callGoogleDriveApi('/files?pageSize=10');

        console.log('Files from Google Drive:', response.files);
        return response.files;
    } catch (error) {
        console.error('Error listing Drive files:', error);
        throw error;
    }
}

/**
 * Example 2: Create a folder in Google Drive
 */
export async function createDriveFolder(folderName: string) {
    try {
        if (!hasGoogleAccessToken()) {
            throw new Error('Please sign in with Google first');
        }

        const response = await callGoogleDriveApi('/files', {
            method: 'POST',
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            })
        });

        console.log('Created folder:', response);
        return response;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}

/**
 * Example 3: Upload a file to Google Drive
 */
export async function uploadFileToDrive(fileName: string, fileContent: string, mimeType: string = 'text/plain') {
    try {
        const token = getGoogleAccessToken();
        if (!token) {
            throw new Error('Please sign in with Google first');
        }

        // Google Drive upload requires multipart upload
        const metadata = {
            name: fileName,
            mimeType: mimeType
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: mimeType }));

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form
            }
        );

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('File uploaded:', result);
        return result;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

/**
 * Example 4: Custom Google API call
 */
export async function callCustomGoogleApi(apiUrl: string) {
    try {
        const headers = getGoogleApiHeaders();

        if (!headers) {
            throw new Error('No Google access token available');
        }

        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error calling Google API:', error);
        throw error;
    }
}

/**
 * Example 5: Usage in a React component
 */
/*
import { useEffect, useState } from 'react';
import { listGoogleDriveFiles } from '@/lib/examples/googleApiUsage';
import { hasGoogleAccessToken } from '@/lib/googleAuth';

export default function DriveFilesComponent() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (hasGoogleAccessToken()) {
            loadFiles();
        }
    }, []);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const driveFiles = await listGoogleDriveFiles();
            setFiles(driveFiles);
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!hasGoogleAccessToken()) {
        return <div>Please sign in with Google to view your Drive files</div>;
    }

    if (loading) {
        return <div>Loading files...</div>;
    }

    return (
        <div>
            <h2>Your Google Drive Files</h2>
            <ul>
                {files.map(file => (
                    <li key={file.id}>{file.name}</li>
                ))}
            </ul>
        </div>
    );
}
*/

import { Router } from 'express';
// Use shared db from config to ensure initialization
import { db } from '../config/firebase';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import * as admin from 'firebase-admin'; // Keep for types or specific utils if needed

const router = Router();

// ============================================
// CONFIGURATION
// ============================================
const MASTER_SHEET_ID = '1yBjv9ocNpGul9Fc7o2ywwn0lAf_FTuC52_zJ-OD568Y'; // Pre-created by Professor

// ============================================
// GOOGLE SHEETS HELPER FUNCTIONS
// ============================================

/** 
 * Get authenticated Google API clients (Sheets + Drive) 
 */
async function getGoogleClients() {
    // Try environment variable first, then fallback to local file
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '../../serviceAccountKey.json');

    try {
        if (fs.existsSync(serviceAccountPath)) {
            const auth = new google.auth.GoogleAuth({
                keyFile: serviceAccountPath,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive'
                ],
            });
            const authClient = await auth.getClient();
            return {
                sheets: google.sheets({ version: 'v4', auth: authClient as any }),
                drive: google.drive({ version: 'v3', auth: authClient as any })
            };
        } else {
            console.warn('⚠️ Service account file not found at:', serviceAccountPath);
            // Fallback to ADC if available in cloud environment
            try {
                const auth = new google.auth.GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
                });
                const authClient = await auth.getClient();
                return {
                    sheets: google.sheets({ version: 'v4', auth: authClient as any }),
                    drive: google.drive({ version: 'v3', auth: authClient as any })
                };
            } catch (adcError) {
                console.warn('⚠️ Could not initialize ADC:', adcError);
            }
        }
    } catch (error: any) {
        console.error('Failed to initialize Google clients:', error.message);
    }
    return null;
}

/** 
 * Backward compatibility wrapper 
 */
async function getSheetsClient() {
    const clients = await getGoogleClients();
    return clients?.sheets || null;
}

/** 
 * Helper to ensure a tab exists in the master sheet 
 */
async function ensureTabExists(sheets: any, title: string) {
    try {
        let metadata = await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });
        let sheet = metadata.data.sheets.find((s: any) => s.properties.title === title);

        if (!sheet) {
            console.log(`📑 Creating tab "${title}"...`);
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: MASTER_SHEET_ID,
                requestBody: {
                    requests: [{ addSheet: { properties: { title } } }]
                }
            } as any);
            // Fetch updated metadata
            metadata = await sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });
            sheet = metadata.data.sheets.find((s: any) => s.properties.title === title);
        }
        return sheet ? sheet.properties.sheetId : 0;
    } catch (e: any) {
        console.error(`⚠️ Error checking/creating tab "${title}":`, e.message);
        return 0;
    }
}

// ============================================
// ROUTES
// ============================================

/** 
 * Initialize all sheets for a course (Using MASTER SHEET) 
 */
router.post('/initialize', async (req, res): Promise<any> => {
    try {
        const { courseId, professorEmail } = req.body;
        console.log(`🔄 Initializing Master Sheet for ${courseId}...`);

        const clients = await getGoogleClients();
        // Use shared db
        const courseRef = db.collection('courses').doc(courseId);

        // Define the sheet configuration using the ONE Master ID
        // Default config (fallback)
        const sheetConfig = {
            escalatedDoubtsSheetId: MASTER_SHEET_ID,
            escalatedDoubtsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=0`,
            topicAnalyticsSheetId: MASTER_SHEET_ID,
            topicAnalyticsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=0`,
            engagementSummarySheetId: MASTER_SHEET_ID,
            engagementSummaryUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=0`,
            isDemoMode: false
        };

        if (clients && clients.sheets) {
            try {
                // Verification that we can access the sheet
                await clients.sheets.spreadsheets.get({ spreadsheetId: MASTER_SHEET_ID });

                // Create specific tabs for data clarity AND capture their IDs
                const doubtsId = await ensureTabExists(clients.sheets, 'Escalated Doubts');
                const topicsId = await ensureTabExists(clients.sheets, 'Topic Analytics');
                const engagementId = await ensureTabExists(clients.sheets, 'Engagement Summary');

                // Update config with DIRECT LINK URLs
                const updatedConfig = {
                    ...sheetConfig,
                    escalatedDoubtsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${doubtsId}`,
                    topicAnalyticsUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${topicsId}`,
                    engagementSummaryUrl: `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${engagementId}`,
                };

                // Save to Firestore
                await courseRef.set({ sheets: updatedConfig }, { merge: true });
                console.log(`✅ Master Sheet linked with specific tabs!`);

                return res.json({ success: true, sheets: updatedConfig });
            } catch (sheetError: any) {
                console.error('❌ Master Sheet Access Error:', sheetError.message);
                console.log('   (Ensure Service Account is Editor on the sheet)');
                // Return fallback config but mark as demo mode if access fails
                const demoConfig = { ...sheetConfig, isDemoMode: true };
                await courseRef.set({ sheets: demoConfig }, { merge: true });
                return res.json({ success: true, sheets: demoConfig });
            }
        } else {
            console.warn('⚠️ Google Clients not initialized. Using demo mode.');
            const demoConfig = { ...sheetConfig, isDemoMode: true };
            await courseRef.set({ sheets: demoConfig }, { merge: true });
            return res.json({ success: true, sheets: demoConfig });
        }

    } catch (error: any) {
        console.error('Sheet initialization error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** 
 * Get sheet URLs for a course 
 */
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        // Use shared db
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const sheets = courseDoc.exists ? courseDoc.data()?.sheets || {} : {};

        const urls = {
            escalatedDoubtsUrl: sheets.escalatedDoubtsUrl || '',
            topicAnalyticsUrl: sheets.topicAnalyticsUrl || '',
            engagementSummaryUrl: sheets.engagementSummaryUrl || '',
            isDemoMode: sheets.isDemoMode || false
        };

        res.json(urls);
    } catch (error: any) {
        console.error('Error getting sheet URLs:', error);
        res.status(500).json({ error: error.message });
    }
});

/** 
 * Refresh all sheets (Clear data to force re-init) 
 */
router.post('/refresh/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        console.log(`🔄 Force refreshing sheets for course ${courseId}...`);

        // Use shared db
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.set({ sheets: {} }, { merge: true });

        console.log(`✅ Cleared old sheet data.`);
        res.json({ success: true, message: 'Sheet data cleared. Refresh dashboard to re-initialize.' });
    } catch (error: any) {
        console.error('Sheet refresh error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** 
 * Sync real Firestore data to sheets 
 */
router.post('/sync/:courseId', async (req, res): Promise<any> => {
    try {
        const { courseId } = req.params;
        console.log(`📊 Syncing data for course ${courseId}...`);

        // Use shared db
        // 1. Get Course Settings First
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const sheetData = courseDoc.data()?.sheets || {};
        const isDemo = sheetData.isDemoMode;

        // 2. Initialize Sheets Client
        let sheets = null;
        if (!isDemo) {
            sheets = await getSheetsClient();
            if (!sheets) {
                // Even if fails, we might still want to return data for CSV download
                console.warn('Sheets client failed to init during sync');
            }
        }

        if (!sheetData.escalatedDoubtsSheetId && !isDemo) {
            // If not demo mode and no ID, we can't sync to sheet, but we can return data
            console.warn('No sheet ID found for sync');
        }

        // 1. POPULATE ESCALATED DOUBTS
        const doubtsQuery = await db.collection('doubts')
            .where('courseId', '==', courseId)
            // .where('escalationLevel', '==', 'PROFESSOR') // Removed strict filter to show more data in demo
            .get();

        // Filter for escalated/professor content roughly
        const relevantDoubts = doubtsQuery.docs.filter(doc => {
            const d = doc.data();
            return d.status === 'PROFESSOR' || d.status === 'RESOLVED' || d.escalated === true;
        });

        const doubtRows = relevantDoubts.map(doc => {
            const data = doc.data();
            const escalatedStr = data.createdAt ? new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt).toLocaleString() : '';

            return [
                doc.id,
                courseId,
                data.topic || 'General',
                data.askedBy?.name || 'Unknown',
                escalatedStr,
                (data.replies || []).length,
                data.isResolved ? 'RESOLVED' : 'OPEN'
            ];
        });

        // Write to Sheet
        if (doubtRows.length > 0 && sheets && !isDemo && sheetData.escalatedDoubtsSheetId) {
            const rowsWithHeaders = [
                ['Doubt ID', 'Course', 'Topic', 'Student', 'Escalated At', 'Replies', 'Status'],
                ...doubtRows
            ];
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetData.escalatedDoubtsSheetId,
                range: `'Escalated Doubts'!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: rowsWithHeaders }
            } as any);
            console.log(`✅ Wrote ${doubtRows.length} escalated doubts to Master Sheet`);
        }

        // 2. POPULATE TOPIC CONFUSION ANALYTICS
        const topicMap: any = {};
        // Process all doubts for analytics
        doubtsQuery.docs.forEach(doc => {
            const data = doc.data();

            // Extract topic either from tag or content
            let topic = 'General';
            if (data.tags && data.tags.length > 0) topic = data.tags[0];
            else if (data.content) topic = data.content.split(' ').slice(0, 5).join(' ') + '...';

            if (!topicMap[topic]) {
                topicMap[topic] = { total: 0, escalated: 0, lastSeen: 0 };
            }
            topicMap[topic].total++;
            if (data.status === 'PROFESSOR') topicMap[topic].escalated++;

            let timestamp = 0;
            if (data.createdAt) timestamp = new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt).getTime();
            if (timestamp > topicMap[topic].lastSeen) topicMap[topic].lastSeen = timestamp;
        });

        const topicRows = Object.entries(topicMap)
            .sort((a: any, b: any) => b[1].total - a[1].total)
            .map(([topic, stats]: any) => [
                topic,
                stats.total,
                stats.escalated,
                stats.lastSeen ? new Date(stats.lastSeen).toLocaleDateString() : ''
            ]);

        // Write to Sheet
        if (topicRows.length > 0 && sheets && !isDemo && sheetData.topicAnalyticsSheetId) {
            const rowsWithHeaders = [
                ['Topic', 'Total Doubts', 'Escalated', 'Last Seen'],
                ...topicRows
            ];
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetData.topicAnalyticsSheetId,
                range: `'Topic Analytics'!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: rowsWithHeaders }
            } as any);
        }

        // 3. ENGAGEMENT SUMMARY
        // (Simplified for now to match available data)
        const engagementRows = [
            ['Total Doubts Logged', doubtsQuery.docs.length],
            ['Escalated Doubts', relevantDoubts.length],
            ['Topics Tracked', topicRows.length]
        ];

        if (sheets && !isDemo && sheetData.engagementSummarySheetId) {
            const rowsWithHeaders = [
                ['Metric', 'Value'],
                ...engagementRows
            ];
            await sheets.spreadsheets.values.update({
                spreadsheetId: sheetData.engagementSummarySheetId,
                range: `'Engagement Summary'!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: rowsWithHeaders }
            } as any);
        }

        // Return Data for CSV Download
        res.json({
            success: true,
            message: isDemo ? 'Simulated Sync (Demo Mode)' : 'Synced Successfully',
            stats: {
                doubtsSynced: doubtRows.length,
                topicsSynced: topicRows.length,
            },
            exportData: {
                doubts: [['ID', 'Course', 'Topic', 'Student', 'Escalated At', 'Replies', 'Status'], ...doubtRows],
                topics: [['Topic', 'Total Doubts', 'Escalated', 'Last Seen'], ...topicRows],
                engagement: [['Metric', 'Value'], ...engagementRows]
            }
        });

    } catch (error: any) {
        console.error('Sheet sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

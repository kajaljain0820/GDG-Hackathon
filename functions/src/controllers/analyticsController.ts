import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getProfessorAnalytics = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.query;
        if (!courseId) return res.status(400).json({ error: 'Missing courseId' });

        // 1. Aggregate Stats (Mock logic for speed, real DB aggregation is costly without Counters)

        // Count Doubts
        const doubtsSnap = await db.collection('doubts').where('courseId', '==', courseId).get();
        const totalDoubts = doubtsSnap.size;

        const resolvedDoubts = doubtsSnap.docs.filter(d => d.data().resolved).length;

        // Topic Analysis (Mock)
        const commonTopics = [
            { topic: "Backpropagation", count: 15 },
            { topic: "Gradient Descent", count: 8 },
            { topic: "Activation Functions", count: 5 }
        ];

        return res.json({
            totalDoubts,
            resolvedDoubts,
            resolutionRate: totalDoubts > 0 ? (resolvedDoubts / totalDoubts) * 100 : 0,
            commonTopics
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const exportAnalyticsToSheet = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.body;
        // 1. Fetch Data (Reuse logic)
        const doubtsSnap = await db.collection('doubts').where('courseId', '==', courseId).get();
        const stats = doubtsSnap.docs.map(d => {
            const data = d.data();
            return [data.doubtId, data.status, data.createdAt.toDate().toISOString()];
        });

        // 2. Google Sheets API
        const { google } = require('googleapis');
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });

        // Create new sheet
        const spreadSheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: { title: `Analytics - Course ${courseId}` }
            }
        });
        const spreadsheetId = spreadSheet.data.spreadsheetId;

        // Write Data
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['Doubt ID', 'Status', 'Date'], ...stats]
            }
        });

        return res.json({ message: 'Export successful', spreadsheetUrl: spreadSheet.data.spreadsheetUrl });

    } catch (error: any) {
        console.error('Export Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Google Sheets Service - Live Academic Intelligence Layer
// Sheets = Read-only derived view of Firestore data

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/echo-1928rn/us-central1/api';

export interface CourseSheets {
    escalatedDoubtsSheetId?: string;
    topicAnalyticsSheetId?: string;
    engagementSummarySheetId?: string;
}

export interface EscalatedDoubtRow {
    doubtId: string;
    course: string;
    topic: string;
    askedBy: string;
    escalatedAt: string;
    repliesCount: number;
    status: string;
}

export interface TopicConfusionRow {
    topic: string;
    totalDoubts: number;
    escalatedCount: number;
    lastSeen: string;
}

export interface EngagementMetric {
    metric: string;
    count: number;
}

/**
 * Call backend to initialize all sheets for a course
 */
export async function initializeCourseSheets(courseId: string, professorEmail: string): Promise<CourseSheets> {
    try {
        const response = await fetch(`${API_BASE_URL}/sheets/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, professorEmail })
        });

        if (!response.ok) {
            throw new Error('Failed to initialize sheets');
        }

        const data = await response.json();
        return data.sheets;
    } catch (error) {
        console.error('Error initializing course sheets:', error);
        throw error;
    }
}

/**
 * Get sheet URLs for a course
 */
export async function getCourseSheetUrls(courseId: string): Promise<{
    escalatedDoubtsUrl?: string;
    topicAnalyticsUrl?: string;
    engagementSummaryUrl?: string;
}> {
    try {
        const response = await fetch(`${API_BASE_URL}/sheets/course/${courseId}`);

        if (!response.ok) {
            console.warn('Failed to get sheet URLs, returning empty config');
            return {};
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting sheet URLs:', error);
        return {};
    }
}

/**
 * Manually trigger sheet refresh (backup - normally auto-synced)
 */
export async function refreshCourseSheets(courseId: string): Promise<void> {
    try {
        await fetch(`${API_BASE_URL}/sheets/refresh/${courseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error refreshing sheets:', error);
        // Non-blocking - sheets are optional
    }
}

/**
 * Sync real Firestore data to sheets
 */
export async function syncDataToSheets(courseId: string): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/sheets/sync/${courseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to sync data to sheets');
        }

        const data = await response.json();
        console.log('✅ Data synced:', data.stats);
        return data;
    } catch (error) {
        console.error('Error syncing data to sheets:', error);
        throw error;
    }
}

export const sheetsService = {
    initializeCourseSheets,
    getCourseSheetUrls,
    refreshCourseSheets,
    syncDataToSheets
};

export default sheetsService;

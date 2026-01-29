import { Router } from 'express';
import { admin } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';

const router = Router();

// Middleware to validate professor authorization
const validateProfessor = (req: any, res: any, next: any): any => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Professor ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Extract professor UID from header
    const authHeaderParts = authHeader.split('Professor ');
    req.professorUid = authHeaderParts.length > 1 ? authHeaderParts[1] : undefined;
    next();
};

// Get all users/peers for professor
router.get('/peers', validateProfessor, async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();

        const users = usersSnapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));

        res.json({ users });
    } catch (error) {
        console.error('Error fetching peers:', error);
        res.status(500).json({ error: 'Failed to fetch peers' });
    }
});

// Get professor's connections
router.get('/connections', validateProfessor, async (req, res) => {
    try {
        const connectionsSnapshot = await db.collection('connections').get();

        const connections = connectionsSnapshot.docs.map(doc => ({
            connectionId: doc.id,
            ...doc.data()
        }));

        res.json({ connections });
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

// Get escalated doubts for a course
router.get('/doubts/:courseId', validateProfessor, async (req, res) => {
    try {
        const courseId = req.params.courseId as string;

        const doubtsSnapshot = await db.collection('doubts')
            .where('courseId', '==', courseId)
            .where('status', 'in', ['PROFESSOR', 'SENIOR_VISIBLE', 'OPEN'])
            .get();

        const doubts = doubtsSnapshot.docs.map(doc => ({
            doubtId: doc.id,
            ...doc.data()
        }));

        res.json({ doubts });
    } catch (error) {
        console.error('Error fetching doubts:', error);
        res.status(500).json({ error: 'Failed to fetch doubts' });
    }
});

// Get confusion insights for a course
router.get('/insights/:courseId', validateProfessor, async (req, res) => {
    try {
        const courseId = req.params.courseId as string;

        // Get all doubts for the course and analyze topics
        const doubtsSnapshot = await db.collection('doubts')
            .where('courseId', '==', courseId)
            .get();

        // Count topics
        const topicCounts: { [key: string]: number } = {};
        doubtsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            let hasTags = false;

            if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
                data.tags.forEach((tag: string) => {
                    topicCounts[tag] = (topicCounts[tag] || 0) + 1;
                });
                hasTags = true;
            }

            // Fallback: Use the doubt content itself as the topic if tags are missing
            if (!hasTags && data.content) {
                // Use the first 7 words for a meaningful phrase
                const contentPreview = data.content.split(/\s+/).slice(0, 7).join(' ') + (data.content.length > 50 ? '...' : '');
                topicCounts[contentPreview] = (topicCounts[contentPreview] || 0) + 1;
            }
        });

        // Convert to array and sort
        const insights = Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        res.json({ insights });
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

// Get sessions for a course
router.get('/sessions/:courseId', validateProfessor, async (req, res) => {
    try {
        const courseId = req.params.courseId as string;

        // Query teachingSessions collection (not 'sessions')
        const sessionsSnapshot = await db.collection('teachingSessions')
            .where('courseId', '==', courseId)
            .get();

        const sessions = sessionsSnapshot.docs.map(doc => ({
            sessionId: doc.id,
            ...doc.data()
        }));

        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Reply to a doubt (professor)
router.post('/doubts/:doubtId/reply', validateProfessor, async (req, res) => {
    try {
        const doubtId = req.params.doubtId as string;
        const { content, professorName, professorUid } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Reply content is required' });
        }

        // Add reply to the doubt
        const doubtRef = db.collection('doubts').doc(doubtId);
        const doubtDoc = await doubtRef.get();

        if (!doubtDoc.exists) {
            return res.status(404).json({ error: 'Doubt not found' });
        }

        const existingReplies = doubtDoc.data()?.replies || [];
        const newReply = {
            content,
            repliedBy: {
                name: professorName || 'Professor',
                uid: professorUid || (req as any).professorUid,
                role: 'PROFESSOR'
            },
            repliedAt: admin.firestore.FieldValue.serverTimestamp(),
            isAi: false,
            isAccepted: true
        };

        // Update doubt with new reply and mark as resolved
        await doubtRef.update({
            replies: [...existingReplies, newReply],
            status: 'RESOLVED',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            success: true,
            message: 'Reply sent and doubt resolved'
        });
    } catch (error) {
        console.error('Error replying to doubt:', error);
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

export default router;



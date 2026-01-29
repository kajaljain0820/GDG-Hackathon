
import { Request, Response, NextFunction } from 'express';
import { admin } from '@/lib/firebase-admin';

export interface AuthRequest extends Request {
    user?: any;
}

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // EMULATOR MODE: Skip strict token validation when running locally
        if (process.env.FUNCTIONS_EMULATOR) {
            console.log('🔧 Emulator mode: Skipping strict token validation');
            // Decode token without verification for local dev
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                (req as AuthRequest).user = decodedToken;
            } catch (authErr) {
                // In emulator, allow bypass with mock user
                console.warn('⚠️ Token verification failed in emulator, using mock user');
                (req as AuthRequest).user = {
                    uid: 'emulator-user',
                    email: 'dev@sparklink.edu',
                    name: 'Dev User'
                };
            }
            next();
            return;
        }

        // 1. Verify ID Token (Production)
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 2. Enforce College Email (e.g., .edu or specific domain)
        // For now, we enforce that it MUST NOT be a generic gmail/yahoo/hotmail
        // You can make this stricter by verifying it ends with '.edu' or 'university.ac.in'
        const email = decodedToken.email || '';
        const forbiddenDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const domain = email.split('@')[1];

        if (!email || forbiddenDomains.includes(domain)) {
            // OPTIONAL: Allow if it's a specific admin override, otherwise block
            return res.status(403).json({
                error: 'Access Denied: Please use your college/university email address.',
                details: `The domain @${domain} is not permitted.`
            });
        }

        (req as AuthRequest).user = decodedToken;
        next();
        return;

    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

export const requireRole = (role: 'student' | 'professor') => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!(req as any).user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Note: In a real app, you might store role in custom claims or look it up in Firestore
        // For now, checking if it exists in the decoded token (if you added custom claims)
        // Or we fetching user from DB. For now, we'll pass.
        // TODO: Implement strict role checking via custom claims or DB lookup
        next();
        return;
    }
}



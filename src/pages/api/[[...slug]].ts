import { NextApiRequest, NextApiResponse } from 'next';
import app from '@/server/app';

// This is the Next.js API route handler that wraps our Express app
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    return new Promise((resolve, reject) => {
        // Strip the /api prefix if present because Express routers expect paths relative to root or their mount point
        if (req.url) {
            req.url = req.url.replace(/^\/api/, '');
        }

        // Run the express app
        app(req as any, res as any, (err?: any) => {
            if (err) {
                return reject(err);
            }
            resolve(true);
        });
    });
}

// Disable body parsing for Express to handle it (especially for Busboy/Multer)
export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};

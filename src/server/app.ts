import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import notebookRoutes from './routes/notebookRoutes';
import doubtRoutes from './routes/doubtRoutes';
import sessionRoutes from './routes/sessionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import chatRoutes from './routes/chatRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import professorRoutes from './routes/professorRoutes';

const app = express();

// Middleware
app.use(cors({ origin: true }));

// Specific paths that don't need JSON/URL parsers (like uploads)
// We let Busboy handle the raw stream for uploads
const jsonParser = express.json({ limit: '50mb' });
const urlEncodedParser = express.urlencoded({ extended: true, limit: '50mb' });

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes('/upload')) {
        return next();
    }
    jsonParser(req, res, (err) => {
        if (err) return next(err);
        urlEncodedParser(req, res, next);
    });
});

// Routes
// Note: In Next.js, the base path is already /api, so we adjust accordingly if needed
// But if we mount this app at /api/..., we can keep the sub-paths
app.use('/auth', authRoutes);
app.use('/professor', professorRoutes);
app.use('/users', userRoutes);
app.use('/notebook', notebookRoutes);
app.use('/chats', chatRoutes);
app.use('/doubts', doubtRoutes);
app.use('/sessions', sessionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/upload', uploadRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Campus AI Platform API is running on Vercel');
});

export default app;


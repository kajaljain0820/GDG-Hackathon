import { Request, Response } from 'express';

// HARDCODED PROFESSOR CREDENTIALS
// In production, these should be in environment variables or database
const PROFESSOR_CREDENTIALS = {
    email: 'professor@echo.edu',
    password: 'Prof@2024',
    name: 'Dr. Professor',
    uid: 'prof_echo_001'
};

export const professorLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Validate credentials
        if (email === PROFESSOR_CREDENTIALS.email && password === PROFESSOR_CREDENTIALS.password) {
            const session = {
                role: 'professor',
                email: PROFESSOR_CREDENTIALS.email,
                name: PROFESSOR_CREDENTIALS.name,
                uid: PROFESSOR_CREDENTIALS.uid
            };

            return res.status(200).json({
                success: true,
                session,
                message: 'Professor login successful'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });

    } catch (error) {
        console.error('Professor login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

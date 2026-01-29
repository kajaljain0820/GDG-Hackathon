import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';

// HARDCODED PROFESSOR CREDENTIALS (FALLBACK)
// In production, these should be in environment variables or database
const PROFESSOR_CREDENTIALS = {
    email: 'professor@echo.edu',
    password: 'Prof@2024',
    name: 'Dr. Professor',
    uid: 'prof_echo_001'
};

// Create a new professor account (Admin only)
export const createProfessor = async (req: Request, res: Response) => {
    try {
        const { email, password, name, department } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // 1. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Set custom claims to identify as professor
        await auth.setCustomUserClaims(userRecord.uid, { role: 'professor' });

        // 3. Create professor document in Firestore
        await db.collection('professors').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            department: department || 'General',
            role: 'professor',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 4. Also create a user profile in 'users' collection for platform compatibility
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            displayName: name,
            email,
            role: 'professor',
            createdAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: 'Professor account created successfully',
            professor: {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName
            }
        });

    } catch (error: any) {
        console.error('Error creating professor:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create professor account'
        });
    }
};

// Create a new student account (Admin only)
export const createStudent = async (req: Request, res: Response) => {
    try {
        const { email, password, name, department, year, classId, className } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // 1. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Set custom claims to identify as student
        await auth.setCustomUserClaims(userRecord.uid, { role: 'student' });

        // 3. Create student document in Firestore
        await db.collection('students').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            department: department || 'General',
            year: year || '1st Year',
            classId: classId || '',
            className: className || '',
            role: 'student',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 4. Also create a user profile in 'users' collection for platform compatibility
        await db.collection('users').doc(userRecord.uid).set({
            userId: userRecord.uid,
            displayName: name,
            email,
            role: 'student',
            department: department || 'General',
            year: parseInt(year?.replace(/\D/g, '') || '1') || 1,
            classId: classId || '',
            className: className || '',
            isOnline: false,
            interests: [],
            createdAt: new Date(),
            lastSeen: new Date()
        });

        return res.status(201).json({
            success: true,
            uid: userRecord.uid,
            message: 'Student account created successfully',
            student: {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName,
                classId,
                className
            }
        });

    } catch (error: any) {
        console.error('Error creating student:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create student account'
        });
    }
};

// Legacy/Fallback Professor Login (Can also be used for verifying custom flows)
export const professorLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // 1. Check Hardcoded Credentials first (Fallback)
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
                message: 'Professor login successful (Hardcoded)'
            });
        }

        // 2. Ideally, the client should login with Firebase Auth. 
        // If we reach here, it means we are trying to login via API, which is not recommended for Firebase Auth passwords.
        // We cannot verify password serverside without using the client SDK or Identity Toolkit API.

        // For now, we will return a message instructing to use Client SDK login for real accounts
        return res.status(400).json({
            success: false,
            message: 'Please use client-side authentication for real accounts'
        });

    } catch (error) {
        console.error('Professor login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

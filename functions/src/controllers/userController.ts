import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const syncUser = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: 'No user in request' });
        }

        const { uid, email, name, picture } = user;
        const { department, academicYear } = req.body;

        const userRef = db.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            const newUser = {
                uid,
                email,
                name: name || '',
                photoUrl: picture || '',
                department: department || '',
                academicYear: academicYear || '',

                // Auto-assign role based on email pattern or default to student
                // Security: Prevent users from claiming 'professor' role arbitrarily
                role: (email.includes('faculty') || email.includes('prof')) ? 'professor' : 'student',
                createdAt: new Date().toISOString()
            };
            await userRef.set(newUser);
            return res.status(201).json({ message: 'User created', user: newUser });
        } else {
            if (department || academicYear) {
                await userRef.update({
                    department: department || userSnap.data()?.department,
                    academicYear: academicYear || userSnap.data()?.academicYear
                });
            }
            return res.status(200).json({ message: 'User exists', user: userSnap.data() });
        }
    } catch (error: any) {
        console.error('Error syncing user:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(userDoc.data());
    } catch (error) {
        console.error('Error getting profile:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

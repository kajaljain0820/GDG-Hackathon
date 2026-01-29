import { Request, Response } from 'express';
import { db, admin } from '@/lib/firebase-admin';

export const createStudyPlan = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const { title, goal, targetGrade, subjects, tasks } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const planRef = db.collection('users').doc(uid).collection('studyPlans').doc();
        const planData = {
            id: planRef.id,
            title,
            goal: goal || '',
            targetGrade: targetGrade || '',
            subjects: subjects || [],
            totalProgress: 0,
            status: 'active',
            tasks: tasks || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await planRef.set(planData);
        return res.status(201).json(planData);
    } catch (error: any) {
        console.error('Create Study Plan Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

export const getStudyPlans = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const plansSnap = await db.collection('users').doc(uid).collection('studyPlans')
            .orderBy('updatedAt', 'desc')
            .get();

        const plans = plansSnap.docs.map(doc => doc.data());
        return res.json(plans);
    } catch (error: any) {
        console.error('Get Study Plans Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

export const updateStudyPlan = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const planId = req.params.planId as string;
        const updateData = req.body;

        const planRef = db.collection('users').doc(uid).collection('studyPlans').doc(planId);

        await planRef.update({
            ...updateData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json({ message: 'Plan updated' });
    } catch (error: any) {
        console.error('Update Study Plan Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

export const deleteStudyPlan = async (req: Request, res: Response) => {
    try {
        const { uid } = (req as any).user;
        const planId = req.params.planId as string;

        await db.collection('users').doc(uid).collection('studyPlans').doc(planId).delete();
        return res.json({ message: 'Plan deleted' });
    } catch (error: any) {
        console.error('Delete Study Plan Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

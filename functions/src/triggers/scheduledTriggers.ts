import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';

// Run every 60 minutes
export const escalateDoubts = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
    console.log('Running Doubt Escalation Job');
    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    try {
        const doubtsRef = db.collection('doubts');
        const unresolvedSnapshot = await doubtsRef.where('resolved', '==', false).get();

        if (unresolvedSnapshot.empty) {
            console.log('No unresolved doubts to check.');
            return null;
        }

        const batch = db.batch();
        let updateCount = 0;

        unresolvedSnapshot.forEach(doc => {
            const data = doc.data();
            const createdTime = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt); // Handle Firestore Timestamp or string
            const age = now.getTime() - createdTime.getTime();
            const currentStatus = data.status;

            // Logic: 
            // AI_ANSWERED -> (24h) -> SENIOR_VISIBLE
            // SENIOR_VISIBLE -> (24h more i.e. 48h total) -> PROFESSOR_VISIBLE

            let newStatus = null;

            if (age > TWO_DAYS_MS && currentStatus !== 'PROFESSOR_VISIBLE') {
                newStatus = 'PROFESSOR_VISIBLE';
            } else if (age > ONE_DAY_MS && currentStatus === 'AI_ANSWERED') {
                newStatus = 'SENIOR_VISIBLE';
            }

            // Also escalation from OPEN state if AI failed
            if (age > ONE_DAY_MS && currentStatus === 'OPEN') {
                newStatus = 'SENIOR_VISIBLE';
            }

            if (newStatus) {
                batch.update(doc.ref, {
                    status: newStatus,
                    escalatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                updateCount++;
            }
        });

        if (updateCount > 0) {
            await batch.commit();
            console.log(`Escalated ${updateCount} doubts.`);
        } else {
            console.log('No doubts needed escalation.');
        }

        return null;

    } catch (error) {
        console.error('Escalation Job Failed:', error);
        return null;
    }
});

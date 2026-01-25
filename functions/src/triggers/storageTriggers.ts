import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';

// This function is triggered when a file is uploaded to the 'course-materials' folder in Storage
export const onMaterialUpload = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Check if it's a file in the course-materials folder
    // Structure expected: course-materials/{courseId}/{fileId}/{filename}
    if (!filePath || !filePath.startsWith('course-materials/')) {
        console.log('File is not a course material, skipping.');
        return;
    }

    const fileBucket = object.bucket;

    console.log(`Processing file: ${filePath}`);

    // Extract metadata (assuming path structure: course-materials/courseId/filename)
    // Adjust logic based on actual path strategy
    const parts = filePath.split('/');
    if (parts.length < 3) {
        console.log('Invalid file path structure.');
        return;
    }

    const courseId = parts[1];
    const fileName = parts[parts.length - 1];

    try {
        // 1. Create a record in Firestore
        const materialRef = db.collection('courses').doc(courseId).collection('materials').doc();
        await materialRef.set({
            title: fileName,
            filePath: filePath,
            bucket: fileBucket,
            contentType: contentType,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'processing', // Initial status for AI ingestion
            ingestionId: null
        });

        console.log(`Metadata created for ${fileName} in course ${courseId}`);

        // 2. Trigger Ingestion Pipeline
        // We call the ingestion service directly since we are in the same environment
        const { processMaterial } = await import('../services/ingestionService');
        await processMaterial(courseId, materialRef.id, filePath, contentType || 'application/octet-stream');


    } catch (error) {
        console.error('Error processing material upload:', error);
    }
});

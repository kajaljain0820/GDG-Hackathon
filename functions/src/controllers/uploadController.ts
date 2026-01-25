import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { db, storage } from '../config/firebase';
import { processMaterial } from '../services/ingestionService';
const Busboy = require('busboy');

export const uploadFile = async (req: Request, res: Response) => {
    try {
        console.log('=== UPLOAD FILE CALLED (MANUAL BUSBOY) ===');

        const busboy = Busboy({ headers: req.headers });
        const fields: any = {};
        let fileBuffer: Buffer | null = null;

        interface FileInfo {
            filename: string;
            mimeType: string;
        }
        let fileInfo: FileInfo | null = null;

        // Parse Request
        await new Promise<void>((resolve, reject) => {
            busboy.on('field', (fieldname: string, val: string) => {
                fields[fieldname] = val;
            });

            busboy.on('file', (fieldname: string, file: any, info: any) => {
                const { filename, mimeType } = info;
                console.log(`📎 File stream received: ${filename}`);

                const chunks: any[] = [];
                file.on('data', (data: any) => chunks.push(data));
                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                    fileInfo = { filename, mimeType };
                    console.log(`✅ File buffered: ${fileBuffer.length} bytes`);
                });
            });

            busboy.on('finish', () => {
                console.log('✅ Busboy finished parsing');
                resolve();
            });

            busboy.on('error', (err: any) => {
                console.error('❌ Busboy error:', err);
                reject(err);
            });

            // CRITICAL: Cloud Functions Gen 1 provides rawBody
            if ((req as any).rawBody) {
                console.log('🔧 Using req.rawBody for Cloud Functions');
                busboy.end((req as any).rawBody);
            } else {
                console.log('🔧 Piping req stream');
                req.pipe(busboy);
            }
        });

        if (!fileBuffer || !fileInfo) {
            return res.status(400).json({ error: 'No file provided or parsing failed' });
        }

        // Type assertion after null check
        const safeFileInfo = fileInfo as FileInfo;
        const safeBuffer = fileBuffer as Buffer;

        const { courseId } = fields;
        const targetCourseId = courseId || 'default_course_id';
        const fileName = safeFileInfo.filename.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize
        const filePath = `course-materials/${targetCourseId}/${fileName}`;

        console.log(`Processing upload: ${fileName} → ${targetCourseId}`);

        // 1. Upload to Storage
        const bucket = storage.bucket('sparklink-d72d1.firebasestorage.app');
        const fileRef = bucket.file(filePath);

        await fileRef.save(safeBuffer, {
            contentType: safeFileInfo.mimeType,
            resumable: false,
            metadata: { contentType: safeFileInfo.mimeType }
        });

        console.log('✅ File saved to storage:', filePath);

        // 2. Create Firestore Record
        const materialRef = db.collection('courses').doc(targetCourseId).collection('materials').doc();
        await materialRef.set({
            title: safeFileInfo.filename,
            fileName: fileName,
            filePath: filePath,
            contentType: safeFileInfo.mimeType,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'processing',
            size: safeBuffer.length
        });

        console.log('✅ Metadata created:', materialRef.id);

        // 3. Trigger Ingestion (Background)
        processMaterial(targetCourseId, materialRef.id, filePath, safeFileInfo.mimeType)
            .then(() => console.log('✅ Ingestion finished:', materialRef.id))
            .catch(err => console.error('❌ Ingestion failed:', materialRef.id, err));

        return res.status(201).json({
            message: 'File uploaded and processing started',
            materialId: materialRef.id,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('❌ Upload Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
};

import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { vertexService } from './vertexService';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

// Initialize Document AI Client
const client = new DocumentProcessorServiceClient();

interface Chunk {
    id: string;
    text: string;
    courseId: string;
    materialId: string;
    embedding: number[];
}

// Helper: Token-aware chunking
// Splits text into chunks of roughly ~500 words/tokens with overlap
const chunkText = (text: string, chunkSize: number = 2000, overlap: number = 200): string[] => {
    // Simple character-based chunking as a proxy for tokens (approx 4 chars/token -> 500 tokens ~ 2000 chars)
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        let chunk = text.slice(start, end);

        // Try to break at the last period or newline to be semantically cleaner
        const lastPeriod = chunk.lastIndexOf('.');
        if (lastPeriod > chunkSize * 0.8 && end < text.length) {
            chunk = chunk.slice(0, lastPeriod + 1);
            start += (lastPeriod + 1) - overlap;
        } else {
            start += chunkSize - overlap;
        }

        if (chunk.trim().length > 50) {
            chunks.push(chunk.trim());
        }
    }
    return chunks;
};

// Helper: Document AI Extraction
const extractTextWithDocAI = async (buffer: Buffer, mimeType: string): Promise<string> => {
    try {
        const projectId = process.env.GCP_PROJECT_ID || 'echo-1928rn';
        const location = 'us'; // Format: 'us' or 'eu'
        const processorId = process.env.DOCAI_PROCESSOR_ID || 'c01e56b43729863c'; // Replace with env var

        if (!processorId) throw new Error('DOCAI_PROCESSOR_ID not configured');

        const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
        const request = {
            name,
            rawDocument: {
                content: buffer.toString('base64'),
                mimeType: mimeType,
            },
        };

        const [result] = await client.processDocument(request);
        const { document } = result;
        return document?.text || '';
    } catch (error) {
        console.error('Document AI Error, falling back to simple extraction:', error);
        throw error;
    }
};

export const processMaterial = async (courseId: string, materialId: string, gcsPath: string, mimeType: string) => {
    try {
        console.log(`Starting ingestion for ${materialId}`);
        const materialRef = db.collection('courses').doc(courseId).collection('materials').doc(materialId);

        // 1. Download file content
        const bucket = admin.storage().bucket();
        const file = bucket.file(gcsPath);
        const [buffer] = await file.download();

        // 2. Extract Text
        let fullText = "";

        if (mimeType === 'application/pdf') {
            try {
                // Try Document AI first for PDFs (handles OCR)
                fullText = await extractTextWithDocAI(buffer, mimeType);
                console.log(`Extracted ${fullText.length} chars using Document AI`);
            } catch (err) {
                console.warn('Falling back to pdf-parse due to DocAI error.');
                const pdf = require('pdf-parse');
                const data = await pdf(buffer);
                fullText = data.text;
            }
        } else if (mimeType.startsWith('text/') || mimeType === 'application/markdown') {
            fullText = buffer.toString('utf-8');
        } else {
            // Fallback/Placeholder for PPTX etc (keep existing logic or expand)
            // For MVP speed, handling text/pdf primarily as per tasks
            if (mimeType.includes('presentation')) {
                const getText = require('office-text-extractor');
                const fs = require('fs');
                const os = require('os');
                const path = require('path');
                const tempFilePath = path.join(os.tmpdir(), `temp_${materialId}.pptx`);
                fs.writeFileSync(tempFilePath, buffer);
                fullText = await getText(tempFilePath);
                fs.unlinkSync(tempFilePath);
            } else {
                fullText = buffer.toString('utf-8');
            }
        }

        if (!fullText || fullText.length < 50) {
            throw new Error('Could not extract text or text is too short.');
        }

        // 3. Chunking (Robust)
        const textChunks = chunkText(fullText);
        const chunks: Chunk[] = [];

        console.log(`Generated ${textChunks.length} chunks.`);

        // 4. Generate Embeddings & Prepare for Vector Search
        for (const [index, text] of textChunks.entries()) {
            const embedding = await vertexService.getEmbeddings(text);

            chunks.push({
                id: `${materialId}_${index}`,
                text: text,
                courseId,
                materialId,
                embedding
            });
        }

        // 5. Store Data
        // Ideally: Upload `chunks` to Vertex AI Vector Search Index
        // MVP: Store in Firestore 'chunks' collection for basic retrieval + vector field for future
        const batch = db.batch();
        for (const chunk of chunks) {
            const chunkRef = db.collection('courses').doc(courseId).collection('chunks').doc(chunk.id);
            batch.set(chunkRef, {
                text: chunk.text,
                materialId: chunk.materialId,
                embedding: chunk.embedding, // Vector field
                metadata: {
                    source: gcsPath,
                    processedAt: new Date().toISOString()
                }
            });
        }
        await batch.commit();

        // 6. Update Status
        await materialRef.update({
            status: 'processed',
            chunkCount: chunks.length,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Ingestion complete for ${materialId}.`);

    } catch (error: any) {
        console.error('Ingestion failed:', error);
        await db.collection('courses').doc(courseId).collection('materials').doc(materialId).update({
            status: 'failed',
            error: error.message
        });
    }
};

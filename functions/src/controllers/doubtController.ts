import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { vertexService } from '../services/vertexService';
import * as admin from 'firebase-admin';

export const createDoubt = async (req: Request, res: Response) => {
    try {
        const { courseId, content } = req.body;
        const { uid, name } = (req as any).user;

        // 1. Create Doubt
        const doubtRef = db.collection('doubts').doc();
        const doubtData = {
            doubtId: doubtRef.id,
            courseId,
            content,
            askedBy: { uid, name },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'AI_PROCESSING', // Intermediate state
            resolved: false,
            replies: []
        };
        await doubtRef.set(doubtData);

        // 2. Immediate AI Attempt
        // We do this inline for the "wow" factor of speed, but could be backgrounded
        const prompt = `
        A student asked: "${content}"
        
        Provide a helpful, precise answer. If it's too complex, suggest asking a professor.
        `;
        const aiAnswer = await vertexService.generateContent(prompt);

        // 3. Add AI Reply
        const aiReply = {
            replyId: `ai_${Date.now()}`,
            doubtId: doubtRef.id,
            content: aiAnswer,
            repliedBy: { uid: 'ai-bot', name: 'Campus AI' },
            createdAt: new Date().toISOString(), // Use simple string for array storage
            isAi: true
        };

        await doubtRef.update({
            replies: admin.firestore.FieldValue.arrayUnion(aiReply),
            status: 'AI_ANSWERED'
        });

        return res.status(201).json({ ...doubtData, aiReply });

    } catch (error) {
        console.error('Create Doubt Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDoubts = async (req: Request, res: Response) => {
    try {
        const { courseId } = req.query;
        let query = db.collection('doubts').orderBy('createdAt', 'desc');

        if (courseId) {
            query = query.where('courseId', '==', courseId);
        }

        const snapshot = await query.get();
        const doubts = snapshot.docs.map(doc => doc.data());

        return res.json(doubts);

    } catch (error) {
        console.error('Get Doubts Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const createDoubtFromAudio = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

        const { courseId } = req.body; // metadata
        const { uid, name } = (req as any).user;

        // 1. Transcribe Audio using Google Speech-to-Text
        const speech = require('@google-cloud/speech');
        const client = new speech.SpeechClient();

        const audioBytes = req.file.buffer.toString('base64');
        const audio = { content: audioBytes };
        const config = {
            encoding: 'WEBM_OPUS', // Assume web recording standard, or LINEAR16
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            alternativeLanguageCodes: ['hi-IN'], // Support Hinglish context
        };
        const request = {
            audio: audio,
            config: config,
        };

        const [response] = await client.recognize(request);
        const transcription = response.results
            .map((result: any) => result.alternatives[0].transcript)
            .join('\n');

        if (!transcription) {
            return res.status(400).json({ error: 'Could not transcribe audio' });
        }

        console.log(`Transcribed: ${transcription}`);

        // 2. Reuse Create Doubt Logic (Pass to regular pipeline)
        // We can internal call or just duplicate the logic for clarity
        // Let's duplicate slightly to include "audio_source" tag

        const doubtRef = db.collection('doubts').doc();
        const doubtData = {
            doubtId: doubtRef.id,
            courseId,
            content: transcription,
            isVoice: true,
            askedBy: { uid, name },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'AI_PROCESSING',
            resolved: false,
            replies: []
        };
        await doubtRef.set(doubtData);

        // 3. AI Answer (Inline)
        const prompt = `
        Voice Question: "${transcription}"
        Provide a helpful, precise answer.
        `;
        const aiAnswer = await vertexService.generateContent(prompt);

        const aiReply = {
            replyId: `ai_${Date.now()}`,
            doubtId: doubtRef.id,
            content: aiAnswer,
            repliedBy: { uid: 'ai-bot', name: 'Campus AI' },
            createdAt: new Date().toISOString(),
            isAi: true
        };

        await doubtRef.update({
            replies: admin.firestore.FieldValue.arrayUnion(aiReply),
            status: 'AI_ANSWERED'
        });

        return res.status(201).json({ ...doubtData, aiReply, transcription });

    } catch (error: any) {
        console.error('Voice Doubt Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

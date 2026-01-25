import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { vertexService } from '../services/vertexService';

export const queryNotebook = async (req: Request, res: Response) => {
    try {
        const { courseId, question } = req.body;

        if (!courseId || !question) {
            return res.status(400).json({ error: 'Missing courseId or question' });
        }

        // 1. Generate Embedding for the question
        // const queryEmbedding = await vertexService.getEmbeddings(question);

        // 2. Retrieval (RAG)
        // In a full production env, we query Vertex AI Vector Search here.
        // For this MVP/Function logic, we will fetch "relevant" chunks from Firestore.
        // SIMULATION: Fetching top 5 documents from the course (Naivest retrieval possible)
        const chunksSnap = await db.collection('courses').doc(courseId).collection('chunks').limit(5).get();
        if (chunksSnap.empty) {
            return res.status(200).json({ answer: "I don't have enough information in this course yet.", sources: [] });
        }

        const contextText = chunksSnap.docs.map(doc => doc.data().text).join('\n\n');

        // 3. Generate Answer with Gemini
        const prompt = `
        You are an AI teaching assistant. Use the following context to answer the student's question.
        If the answer is not in the context, say "I couldn't find that in the course materials." and try to give a general answer but explicitly state it is general knowledge.

        Context:
        ${contextText}

        Question: ${question}
        `;

        const answer = await vertexService.generateContent(prompt);

        return res.json({
            answer,
            sources: chunksSnap.docs.map(doc => doc.id)
        });

    } catch (error) {
        console.error('Notebook Query Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

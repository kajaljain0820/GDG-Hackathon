import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
// Note: These values should be in environment variables
const project = process.env.GCP_PROJECT_ID || 'echo-1928rn';
const location = process.env.GCP_LOCATION || 'us-central1';

const vertex_ai = new VertexAI({ project: project, location: location });

// Gemini Model for Generation
const generativeModel = vertex_ai.getGenerativeModel({
    model: 'gemini-1.5-flash-preview-0514',
    generationConfig: {
        'maxOutputTokens': 2048,
        'temperature': 0.7,
        'topP': 0.8,
    },
});

// Embedding Model
const embeddingModel = vertex_ai.getGenerativeModel({ model: 'text-embedding-004' });

async function getEmbeddings(text: string): Promise<number[]> {
    try {
        const result = await (embeddingModel as any).embedContent(text);

        if (!result.embedding || !result.embedding.values) {
            throw new Error('No embedding generated');
        }

        return result.embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        // Fallback for dev/mock if API fails (e.g. no creds)
        // return new Array(768).fill(0); 
        throw error;
    }
}

async function generateContent(prompt: string): Promise<string> {
    try {
        const resp = await generativeModel.generateContent(prompt);
        const aggregatedResponse = await resp.response;

        if (!aggregatedResponse.candidates || aggregatedResponse.candidates.length === 0) {
            return "I couldn't generate a response at this time.";
        }

        const text = aggregatedResponse.candidates[0].content.parts[0].text;
        return text || "";
    } catch (error) {
        console.error('Error in Gemini generation:', error);
        return "I encountered an error while thinking.";
    }
}

export const vertexService = {
    getEmbeddings,
    generateContent,
    searchSimilarChunks
};

// Helper: Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB);
}

// Simulated Vector Search (Retrieves all chunks for course and ranks them)
// In production with millions of docs, replace this with Vertex AI Vector Search (MatchingEngine) query
async function searchSimilarChunks(query: string, courseId: string, topK: number = 3): Promise<any[]> {
    try {
        // 1. Embed Query
        const queryEmbedding = await getEmbeddings(query);

        // 2. Fetch all chunks for the course (Optimization: Cache this or use real Vector DB)
        const { db } = require('../config/firebase'); // Lazy import to avoid circular dep if any
        const chunksSnap = await db.collection('courses').doc(courseId).collection('chunks').get();

        if (chunksSnap.empty) return [];

        // 3. Rank by Similarity
        const scoredChunks = chunksSnap.docs.map((doc: any) => {
            const data = doc.data();
            if (!data.embedding) return null;
            return {
                text: data.text,
                score: cosineSimilarity(queryEmbedding, data.embedding),
                metadata: data.metadata
            };
        }).filter((chunk: any) => chunk !== null);

        // 4. Sort and Slice
        scoredChunks.sort((a: any, b: any) => b.score - a.score);
        return scoredChunks.slice(0, topK);

    } catch (error) {
        console.error('Vector Search Error:', error);
        return [];
    }
}

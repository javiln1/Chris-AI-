// Vector store search API endpoint using Supabase
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI for embeddings
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get embedding for text using OpenAI
async function getEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Embedding error:', error);
        throw error;
    }
}

// Search vector store using Supabase
async function searchVectorStore(query, topK = 5) {
    try {
        const embedding = await getEmbedding(query);
        
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_count: topK
        });
        
        if (error) {
            console.error('Supabase search error:', error);
            throw error;
        }
        
        return (data || []).map(match => ({
            content: match.content || 'No content available',
            score: match.similarity || 0,
            metadata: match.metadata || {},
            doc_id: match.doc_id
        }));

    } catch (error) {
        console.error('Vector search error:', error);
        return [];
    }
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query, topK = 5 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const results = await searchVectorStore(query, topK);

        res.status(200).json({
            results: results,
            query: query,
            total: results.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Vector search handler error:', error);
        res.status(500).json({ 
            error: 'Vector search failed', 
            details: error.message 
        });
    }
}

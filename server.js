// Simple Node.js server for testing the AI interface
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize clients
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, model = 'gpt-4', useVectorStore = true } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let prompt = message;
        let sources = [];
        
        // Always use vector store
        if (useVectorStore) {
            try {
                // Get embedding for the user's message
                const embeddingResponse = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: message,
                });
                
                const queryEmbedding = embeddingResponse.data[0].embedding;
                
                // Search Supabase for relevant documents
                const { data: searchResults, error: searchError } = await supabase.rpc('match_documents', {
                    query_embedding: queryEmbedding,
                    match_count: 5
                });
                
                if (!searchError && searchResults && searchResults.length > 0) {
                    // Build context from search results
                    const contextText = searchResults.map((result, index) => 
                        `Source ${index + 1} (${result.doc_id}):\n${result.content}`
                    ).join('\n\n');
                    
                    prompt = `Context from knowledge base:\n${contextText}\n\nUser Question: ${message}\n\nPlease answer based on the context provided. If the context doesn't contain relevant information, say so and provide a general answer.`;
                    sources = searchResults.map(result => ({
                        doc_id: result.doc_id,
                        title: result.metadata?.title || result.doc_id,
                        similarity: result.similarity
                    }));
                }
            } catch (vectorError) {
                console.error('Vector search error:', vectorError);
                // Continue without context if vector search fails
            }
        }

        // Get AI response
        const response = await openai.chat.completions.create({
            model: model,
            messages: [{
                role: 'user',
                content: prompt
            }],
            max_tokens: 1000,
            temperature: 0.7,
        });

        res.status(200).json({
            response: response.choices[0].message.content,
            model: model,
            sources: sources,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({ 
            error: 'AI API error', 
            details: error.message
        });
    }
});

// Vector search API endpoint
app.post('/api/vector-search', async (req, res) => {
    try {
        const { query, topK = 5 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Get embedding for the query
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });
        
        const queryEmbedding = embeddingResponse.data[0].embedding;
        
        // Search Supabase for relevant documents
        const { data: searchResults, error: searchError } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_count: topK
        });
        
        if (searchError) {
            throw searchError;
        }
        
        const results = (searchResults || []).map(match => ({
            content: match.content || 'No content available',
            score: match.similarity || 0,
            metadata: match.metadata || {},
            doc_id: match.doc_id
        }));

        res.status(200).json({
            results: results,
            query: query,
            total: results.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Vector search error:', error);
        res.status(500).json({ 
            error: 'Vector search failed', 
            details: error.message 
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📱 Open http://localhost:${port}/index.html to use the AI interface`);
});

// Vercel serverless function for chat API
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Initialize API clients
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // Enable CORS for development
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
        const { message, model = 'gpt-4', useVectorStore = true, context = '', image } = req.body;

        if (!message && !image) {
            return res.status(400).json({ error: 'Message or image is required' });
        }

        let prompt = message;
        let sources = [];
        
        // If vector store is enabled, search for relevant context
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

        let response;
        let modelUsed = model;

        try {
            // If image is provided, use GPT-4 Vision
            if (image) {
                modelUsed = 'gpt-4-vision-preview';
                
                // Build messages array for vision model
                const messages = [{
                    role: 'system',
                    content: `You are a mentor-style AI assistant speaking and thinking like Chris. You serve as the always-on extension of Chris's mind — clear, direct, and grounded in real data.

When analyzing screenshots or images:
- **Identify the platform/context** (TikTok analytics, Shopify dashboard, Facebook ads, etc.)
- **Extract specific metrics and numbers** from the image
- **Compare against industry benchmarks** and best practices
- **Identify problems, opportunities, and trends** visible in the data
- **Provide specific, actionable recommendations** based on what you see
- **Explain the "why" behind each recommendation** using Chris's strategic thinking

Always follow this response structure:
1. **Step-by-Step Instructions** - Comprehensive and detailed actions
2. **Explanation (Theory/Why)** - Why this works and strategic insights
3. **Optional Extras** - Bonus tips, warnings, shortcuts when relevant
4. **Follow-Up Questions** - 5-10 tailored questions to drive continued learning and action

Be outcome-oriented and focus on leverage, not just answers.`
                }];

                const userMessage = {
                    role: 'user',
                    content: []
                };

                // Add text content if provided
                if (message) {
                    userMessage.content.push({
                        type: 'text',
                        text: prompt
                    });
                }

                // Add image
                userMessage.content.push({
                    type: 'image_url',
                    image_url: {
                        url: image,
                        detail: 'high'
                    }
                });

                messages.push(userMessage);

                response = await openai.chat.completions.create({
                    model: modelUsed,
                    messages: messages,
                    max_tokens: 2000,
                    temperature: 0.7,
                });
                response = response.choices[0].message;
                
            } else if (model === 'claude') {
                response = await anthropic.messages.create({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                });
                response = { content: response.content[0].text };
            } else {
                response = await openai.chat.completions.create({
                    model: model,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    max_tokens: 1000,
                    temperature: 0.7,
                });
                response = response.choices[0].message;
            }

            res.status(200).json({
                response: response.content,
                model: modelUsed,
                sources: sources,
                timestamp: new Date().toISOString()
            });

        } catch (apiError) {
            console.error('API Error:', apiError);
            res.status(500).json({ 
                error: 'AI API error', 
                details: apiError.message,
                model: modelUsed
            });
        }

    } catch (error) {
        console.error('Handler Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

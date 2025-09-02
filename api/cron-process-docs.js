// Automated document processing with cron scheduling
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import axios from 'axios';
import Papa from 'papaparse';

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
            model: 'text-embedding-ada-002',
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Embedding error:', error);
        throw error;
    }
}

// Fetch and parse CSV from Google Sheets
async function fetchCSVData() {
    try {
        const response = await axios.get(process.env.SHEET_CSV_URL);
        const csvData = response.data;
        
        return new Promise((resolve, reject) => {
            Papa.parse(csvData, {
                header: true,
                complete: (results) => {
                    resolve(results.data);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('CSV fetch error:', error);
        throw error;
    }
}

// Process and store documents in Supabase
async function processDocuments() {
    try {
        console.log('Starting automated document processing...');
        const csvData = await fetchCSVData();
        const processedDocs = [];
        
        for (const row of csvData) {
            if (!row.Title || !row.Transcript) continue;
            
            const content = `${row.Title}\n\n${row.Transcript}`;
            const embedding = await getEmbedding(content);
            
            const doc = {
                title: row.Title,
                content: content,
                source_type: row.source_type || 'unknown',
                language: row.language || 'en',
                category: row.category || 'general',
                status: row.status || 'active',
                doc_id: row.doc_id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                embedding: embedding,
                last_updated: new Date().toISOString()
            };
            
            processedDocs.push(doc);
        }
        
        // Store documents in Supabase
        const { data, error } = await supabase
            .from('documents')
            .upsert(processedDocs, { 
                onConflict: 'doc_id',
                ignoreDuplicates: false 
            });
            
        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }
        
        console.log(`Successfully processed ${processedDocs.length} documents`);
        return { success: true, count: processedDocs.length, timestamp: new Date().toISOString() };
        
    } catch (error) {
        console.error('Document processing error:', error);
        throw error;
    }
}

// Schedule document processing (runs every 6 hours by default)
function scheduleDocumentProcessing(cronExpression = '0 */6 * * *') {
    console.log(`Scheduling document processing with cron: ${cronExpression}`);
    
    cron.schedule(cronExpression, async () => {
        try {
            await processDocuments();
        } catch (error) {
            console.error('Scheduled document processing failed:', error);
        }
    });
    
    console.log('Document processing scheduled successfully');
}

// Manual trigger for document processing
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Start the cron job
        try {
            const { cronExpression } = req.query;
            scheduleDocumentProcessing(cronExpression);
            
            res.status(200).json({
                message: 'Document processing cron job started',
                cronExpression: cronExpression || '0 */6 * * *',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to start cron job', 
                details: error.message 
            });
        }
    } else if (req.method === 'POST') {
        // Manual document processing
        try {
            const result = await processDocuments();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ 
                error: 'Manual document processing failed', 
                details: error.message 
            });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

// Export the processing function for use in other modules
export { processDocuments, scheduleDocumentProcessing };

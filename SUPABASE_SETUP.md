# Supabase Integration Setup Guide

## Prerequisites

1. **Node.js and npm**: Make sure you have Node.js installed (version 18 or higher)
2. **Supabase Project**: You need a Supabase project with the `documents` table and `match_documents` RPC function

## Installation

Since npm wasn't available in the shell, you'll need to install the dependencies manually:

```bash
# Navigate to the project directory
cd /Users/javilopez/cursor-projects/chris/ai-template-html

# Install dependencies
npm install openai @supabase/supabase-js axios papaparse node-cron
```

## Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google Sheets CSV URL
SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/export?format=csv
```

### Getting the Google Sheets CSV URL:

1. Open your Google Sheet
2. Go to **File** → **Share** → **Publish to web**
3. Select the specific tab you want to publish
4. Choose **CSV** format
5. Copy the generated URL

### Required Google Sheet Columns:

Your Google Sheet should have these columns:
- `Title` - Document title
- `Transcript` - Document content/transcript
- `source_type` - Source type (e.g., "video", "audio", "document")
- `language` - Language code (e.g., "en", "es", "fr")
- `category` - Document category
- `status` - Document status
- `doc_id` - Unique document identifier

## Supabase Database Setup

Make sure your Supabase project has:

1. **`documents` table** with the following structure:
   ```sql
   CREATE TABLE documents (
     id BIGSERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     source_type TEXT,
     language TEXT,
     category TEXT,
     status TEXT,
     doc_id TEXT UNIQUE NOT NULL,
     embedding vector(1536),
     last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **`match_documents` RPC function** for vector similarity search:
   ```sql
   CREATE OR REPLACE FUNCTION match_documents(
     query_embedding vector(1536),
     match_threshold float,
     match_count int
   )
   RETURNS TABLE(
     id bigint,
     title text,
     content text,
     source_type text,
     language text,
     category text,
     status text,
     doc_id text,
     similarity float
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       documents.id,
       documents.title,
       documents.content,
       documents.source_type,
       documents.language,
       documents.category,
       documents.status,
       documents.doc_id,
       1 - (documents.embedding <=> query_embedding) AS similarity
     FROM documents
     WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
     ORDER BY documents.embedding <=> query_embedding
     LIMIT match_count;
   END;
   $$;
   ```

## API Endpoints

The following API endpoints are now available:

### 1. Document Processing (`/api/supabase-integration`)
- **GET**: Process documents from Google Sheets CSV and store in Supabase
- **POST**: Search documents using vector similarity

### 2. Automated Processing (`/api/cron-process-docs`)
- **GET**: Start automated document processing cron job
- **POST**: Manually trigger document processing

### 3. Vector Search (`/api/vector-search`)
- **POST**: Search documents using vector similarity (updated to use Supabase)

### 4. Chat (`/api/chat`)
- **POST**: Chat with AI models (GPT-4, Claude)

## Usage Examples

### Process Documents from CSV:
```bash
curl -X GET "http://localhost:3000/api/supabase-integration"
```

### Search Documents:
```bash
curl -X POST "http://localhost:3000/api/supabase-integration" \
  -H "Content-Type: application/json" \
  -d '{"query": "your search query", "topK": 5}'
```

### Start Automated Processing:
```bash
curl -X GET "http://localhost:3000/api/cron-process-docs"
```

## Testing

1. Start your development server: `npm run dev`
2. Test the endpoints using the examples above
3. Check your Supabase dashboard to see documents being processed
4. Monitor the console for any error messages

## Troubleshooting

- **Missing dependencies**: Make sure all packages are installed with `npm install`
- **Environment variables**: Verify all required environment variables are set
- **Supabase permissions**: Ensure your service role key has the necessary permissions
- **CSV format**: Verify your Google Sheet has the required columns
- **Vector dimensions**: Ensure embeddings are 1536-dimensional (OpenAI ada-002 model)

## Next Steps

1. Configure your environment variables
2. Test the document processing
3. Set up automated cron jobs if needed
4. Integrate with your frontend application
5. Monitor performance and adjust thresholds as needed

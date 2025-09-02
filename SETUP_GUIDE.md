# 🚀 GPC AI - Complete Setup Guide

## 📋 What We've Created

### 1. **API Integration Files**
- `api/chat.js` - Main chat API endpoint (GPT + Claude)
- `api/vector-search.js` - Vector store search endpoint
- `js/api-client.js` - Frontend API communication
- `package.json` - Dependencies and scripts
- `vercel.json` - Vercel deployment configuration

### 2. **Updated HTML Interface**
- Model selector (GPT-4, GPT-3.5, Claude)
- Knowledge base toggle
- API-integrated chat functionality
- Error handling and loading states

## 🔑 Required API Keys

### **OpenAI API**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up/Login and get your API key
3. Add to environment variables: `OPENAI_API_KEY`

### **Anthropic Claude API**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up/Login and get your API key
3. Add to environment variables: `CLAUDE_API_KEY`

### **Vector Store (Choose One)**

#### Option A: Pinecone (Recommended)
1. Go to [pinecone.io](https://pinecone.io)
2. Create account and get API key
3. Create an index
4. Add to environment variables:
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX`

#### Option B: Weaviate
1. Self-hosted or cloud version
2. Add to environment variables:
   - `WEAVIATE_URL`
   - `WEAVIATE_API_KEY`

#### Option C: Chroma (Local Development)
1. Install locally: `pip install chromadb`
2. Run: `chroma run --host localhost --port 8000`
3. Add to environment variables: `CHROMA_URL`

## 🚀 Deployment Steps

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Set Environment Variables**
Create `.env.local` file:
```bash
OPENAI_API_KEY=your-openai-key
CLAUDE_API_KEY=your-claude-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=your-index-name
EMBEDDING_MODEL=text-embedding-ada-002
```

### **Step 3: Deploy to Vercel**
```bash
npm run deploy
```

### **Step 4: Set Vercel Environment Variables**
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add all the API keys from Step 2

## 🧪 Testing

### **Local Testing**
```bash
npm run dev
```

### **Test Chat**
1. Open the app
2. Select a model (GPT-4, Claude, etc.)
3. Toggle "Use Knowledge Base" if you have vector store
4. Send a message and see the AI response

## 🔧 Customization

### **Add More Models**
Edit `api/chat.js` to add:
- GPT-4 Turbo
- Claude 3 Haiku
- Custom models

### **Vector Store Sources**
Edit `api/vector-search.js` to:
- Add more vector stores
- Customize search parameters
- Add filtering options

### **UI Enhancements**
Edit `index.html` to:
- Add more model options
- Customize chat interface
- Add streaming responses

## 📊 Monitoring

### **Vercel Analytics**
- View API usage in Vercel dashboard
- Monitor response times
- Track error rates

### **API Usage**
- OpenAI: Check usage at platform.openai.com
- Claude: Check usage at console.anthropic.com
- Vector Store: Check respective dashboards

## 🆘 Troubleshooting

### **Common Issues**
1. **API Key Errors**: Check environment variables
2. **CORS Issues**: Ensure Vercel functions are working
3. **Vector Store Errors**: Verify index configuration
4. **Rate Limits**: Check API usage limits

### **Debug Mode**
Add to `.env.local`:
```bash
DEBUG=true
NODE_ENV=development
```

## 🎯 Next Steps

1. **Get API Keys** from the services
2. **Set up Vector Store** (Pinecone recommended)
3. **Deploy to Vercel** with environment variables
4. **Test the integration** with real APIs
5. **Customize further** based on your needs

---

**Your GPC AI is ready to go live!** 🎉

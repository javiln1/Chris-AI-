#!/bin/bash

echo "🚀 Deploying GPC AI Assistant v1 to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🎉 Your AI Assistant v1 is now live!"
echo "📱 Test on both desktop and mobile to see the hamburger menu in action!"
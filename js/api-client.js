// Frontend API client for communicating with our backend
class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.isTyping = false;
    }

    // Send a chat message and get AI response
    async sendMessage(message, model = 'gpt-4', useVectorStore = false) {
        try {
            // Show typing indicator
            this.showTypingIndicator();

            const response = await fetch(`${this.baseURL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    model: model,
                    useVectorStore: useVectorStore
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();

            return {
                success: true,
                response: data.response,
                model: data.model,
                sources: data.sources || [],
                timestamp: data.timestamp
            };

        } catch (error) {
            console.error('API Error:', error);
            this.hideTypingIndicator();
            
            return {
                success: false,
                error: error.message,
                response: 'Sorry, I encountered an error. Please try again.'
            };
        }
    }

    // Send a message with image for analysis
    async sendMessageWithImage(message, imageData, model = 'gpt-4') {
        try {
            // Show typing indicator
            this.showTypingIndicator();

            const response = await fetch(`${this.baseURL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    image: imageData,
                    model: model,
                    useVectorStore: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();

            return {
                success: true,
                response: data.response,
                model: data.model,
                sources: data.sources || [],
                timestamp: data.timestamp
            };

        } catch (error) {
            console.error('API Error:', error);
            this.hideTypingIndicator();
            
            return {
                success: false,
                error: error.message,
                response: 'Sorry, I encountered an error analyzing your image. Please try again.'
            };
        }
    }

    // Search vector store for relevant context
    async searchVectorStore(query, topK = 5) {
        try {
            const response = await fetch(`${this.baseURL}/api/vector-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    topK: topK
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.results || [];

        } catch (error) {
            console.error('Vector search error:', error);
            return [];
        }
    }

    // Show typing indicator
    showTypingIndicator() {
        this.isTyping = true;
        this.renderTypingIndicator();
    }

    // Hide typing indicator
    hideTypingIndicator() {
        this.isTyping = false;
        this.removeTypingIndicator();
    }

    // Render typing indicator in chat
    renderTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = `
            <div class="max-w-[70%] p-4 rounded-2xl bg-custom-dark-secondary text-text border border-border">
                <div class="flex items-center space-x-2">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-text rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-text rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-text rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="text-text-secondary text-sm">AI is thinking...</span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Remove typing indicator
    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// Export for use in main HTML
window.APIClient = APIClient;

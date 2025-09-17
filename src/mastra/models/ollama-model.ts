
import { OllamaProvider } from './ollama-provider';

export interface OllamaModelConfig {
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
}

export function createOllamaModel(config: OllamaModelConfig) {
    const provider = new OllamaProvider(config.baseURL);

    // Return a model configuration compatible with Mastra V1 models
    return {
        provider: 'ollama',  // Changed from 'custom' to be more explicit
        name: config.model,
        toolChoice: 'auto',
        
        // V1 model interface - only implement V1 methods
        async generate(input: any) {
            // Handle the input parameter which could be various formats
            let prompt: string;
            
            if (typeof input === 'string') {
                prompt = input;
            } else if (Array.isArray(input)) {
                // Convert messages array to a single prompt
                prompt = input.map(msg => `${msg.role}: ${msg.content}`).join('\n');
            } else if (input?.messages) {
                return provider.chat(input.messages, config.model);
            } else if (input?.text || input?.content) {
                prompt = input.text || input.content;
            } else {
                prompt = JSON.stringify(input);
            }

            return provider.generate(prompt, config.model);
        },

        // V1 stream method (non-streaming implementation)
        async stream(input: any) {
            // For V1 compatibility, just return the generate result
            return this.generate(input);
        },

        // Additional compatibility methods
        async chat(messages: Array<{ role: string; content: string }>) {
            return provider.chat(messages, config.model);
        },

        async checkHealth() {
            return provider.checkHealth();
        }
    };
}
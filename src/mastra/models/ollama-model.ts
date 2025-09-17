import { OllamaProvider } from './ollama-provider';

export interface OllamaModelConfig {
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
}

export function createOllamaModel(config: OllamaModelConfig) {
    const provider = new OllamaProvider(config.baseURL);

    return {
        provider: 'ollama',
        model: config.model,
        baseURL: config.baseURL,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 2048,

        async generate(prompt: string) {
            return provider.generate(prompt, config.model);
        },

        async chat(messages: Array<{ role: string; content: string }>) {
            return provider.chat(messages, config.model);
        },

        async checkHealth() {
            return provider.checkHealth();
        }
    };
}
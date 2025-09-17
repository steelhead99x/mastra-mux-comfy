import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export interface OllamaModelConfig {
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
}

export function createOllamaModel(config: OllamaModelConfig) {
    // Create OpenAI-compatible provider for Ollama
    const ollama = createOpenAICompatible({
        name: 'ollama',
        baseUrl: `${config.baseURL || "http://192.168.88.16:11434"}/v1`,
        apiKey: 'not-needed', // Ollama doesn't require API key
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Return the model instance
    return ollama(config.model);
}
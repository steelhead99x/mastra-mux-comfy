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
        baseURL: `${config.baseURL || "http://localhost:11434"}/v1`,
        apiKey: 'not-needed', // Ollama doesn't require API key
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Return the model instance
    return ollama(config.model, {
        temperature: config.temperature,
        maxTokens: config.maxTokens,
    });
}

// Alternative direct implementation for testing
export class DirectOllamaModel {
    constructor(private config: OllamaModelConfig) {}

    async generate(prompt: string): Promise<{ text: string; usage?: any }> {
        const response = await fetch(`${this.config.baseURL || "http://localhost:11434"}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.config.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: this.config.temperature,
                    num_predict: this.config.maxTokens,
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            text: data.response || '',
            usage: {
                prompt_tokens: data.prompt_eval_count || 0,
                completion_tokens: data.eval_count || 0,
                total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
            }
        };
    }
}
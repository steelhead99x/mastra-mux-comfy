import { Ollama } from "ollama";

export interface OllamaModel {
    name: string;
    size: number;
    digest: string;
    modified_at: string;
}

export interface OllamaHealthResponse {
    status: string;
    version?: string;
}

interface OllamaGenerationResponse {
    text: string;
    response?: string;
    model?: string;
    created_at?: string;
    done?: boolean;
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

function normalizeDateLike(value: any): string | undefined {
    if (value == null) return undefined;
    if (typeof value === 'string') return value;
    if (typeof (value as any)?.toISOString === 'function') {
        try { return (value as any).toISOString(); } catch {}
    }
    try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString();
    } catch {}
    try {
        return String(value);
    } catch {
        return undefined;
    }
}

export class OllamaProvider {
    private client: Ollama;
    private baseURL: string;

    constructor(baseURL?: string) {
        this.baseURL = baseURL || "http://localhost:11434";
        this.client = new Ollama({
            host: this.baseURL
        });
    }

    async healthCheck(): Promise<OllamaHealthResponse> {
        try {
            // Fix: Use this.baseURL instead of accessing protected config.host
            const response = await fetch(`${this.baseURL}/api/version`);
            if (response.ok) {
                const data = await response.json();
                return {
                    status: 'healthy',
                    version: data.version
                };
            } else {
                throw new Error(`Health check failed with status: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Ollama health check failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async listModels(): Promise<OllamaModel[]> {
        try {
            const response = await this.client.list();
            // Fix: Map the response models to match our interface
            return response.models.map(model => ({
                name: model.name,
                size: model.size,
                digest: model.digest,
                modified_at: normalizeDateLike(model.modified_at) || String(model.modified_at)
            }));
        } catch (error) {
            throw new Error(`Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generate(prompt: string, model?: string): Promise<OllamaGenerationResponse> {
        try {
            const response = await this.client.generate({
                model: model || 'llama3.2:3b',
                prompt: prompt,
                stream: false
            });

            return {
                text: response.response || '',
                response: response.response,
                model: response.model,
                created_at: normalizeDateLike(response.created_at),
                done: response.done
            };
        } catch (error) {
            throw new Error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async chat(messages: ChatMessage[], model?: string): Promise<OllamaGenerationResponse> {
        try {
            const response = await this.client.chat({
                model: model || 'llama3.2:3b',
                messages: messages,
                stream: false
            });

            return {
                text: response.message?.content || '',
                response: response.message?.content,
                model: response.model,
                created_at: normalizeDateLike(response.created_at),
                done: response.done
            };
        } catch (error) {
            throw new Error(`Chat failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async pull(model: string): Promise<void> {
        try {
            await this.client.pull({
                model: model,
                stream: false
            });
        } catch (error) {
            throw new Error(`Failed to pull model ${model}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async show(model: string): Promise<any> {
        try {
            return await this.client.show({
                model: model
            });
        } catch (error) {
            throw new Error(`Failed to show model ${model}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default OllamaProvider;
import { Ollama } from 'ollama';

export class OllamaProvider {
    private client: Ollama;

    constructor(baseUrl: string = "http://192.168.88.16:11434") {
        this.client = new Ollama({
            host: baseUrl
        });
    }

    async generate(prompt: string, model: string = "gpt-oss:20b") {
        const response = await this.client.generate({
            model,
            prompt,
            stream: false
        });

        return {
            text: response.response,
            finishReason: 'stop',
            usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
            }
        };
    }

    async chat(messages: Array<{ role: string; content: string }>, model: string = "gpt-oss:20b") {
        const response = await this.client.chat({
            model,
            messages: messages.map(msg => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content
            })),
            stream: false
        });

        return {
            text: response.message.content,
            finishReason: 'stop',
            usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
            }
        };
    }

    async listModels() {
        const models = await this.client.list();
        return models.models;
    }

    async checkHealth() {
        try {
            await this.listModels();
            return true;
        } catch (error) {
            return false;
        }
    }
}
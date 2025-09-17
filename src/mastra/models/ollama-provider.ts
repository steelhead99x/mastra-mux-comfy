
import { Ollama } from 'ollama';

export class OllamaProvider {
    private client: Ollama;

    constructor(baseUrl: string = "http://192.168.88.16:11434") {
        this.client = new Ollama({
            host: baseUrl
        });
    }

    async generate(prompt: string, model: string = "gpt-oss:20b", options: any = {}) {
        try {
            const response = await this.client.generate({
                model,
                prompt,
                stream: false,
                format: options.format || undefined,
                ...options
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
        } catch (error) {
            console.error('Ollama generation error:', error);
            throw error;
        }
    }

    async generateWithTools(prompt: string, tools: any[] = [], model: string = "gpt-oss:20b") {
        // For models that don't support native tool calling, we need to format the prompt differently
        const systemPrompt = `You are a helpful assistant. When you need to use tools, respond with ONLY valid JSON in this format:
{
  "action": "tool_call",
  "tool": "tool_name",
  "arguments": {...}
}

Available tools:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

User request: ${prompt}

If you don't need tools, respond normally. If you need tools, respond with ONLY the JSON format above.`;

        try {
            const response = await this.client.generate({
                model,
                prompt: systemPrompt,
                stream: false,
                format: 'json' // Try to force JSON format
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
        } catch (error) {
            // Fallback to regular generation if JSON format fails
            console.warn('JSON format failed, falling back to regular generation');
            return await this.generate(prompt, model);
        }
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
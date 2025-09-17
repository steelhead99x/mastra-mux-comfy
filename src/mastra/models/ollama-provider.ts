import { Ollama } from 'ollama';

export class OllamaProvider {
    private client: Ollama;
    private debug: boolean;

    constructor(baseUrl: string = "http://192.168.88.16:11434") {
        this.client = new Ollama({
            host: baseUrl
        });
        this.debug = process.env.DEBUG === 'true';
    }

    private debugLog(label: string, data: any) {
        if (this.debug) {
            console.log(`\n🔧 OLLAMA DEBUG - ${label}:`);
            console.log('─'.repeat(30));
            if (typeof data === 'object' && data !== null) {
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(data);
            }
            console.log('─'.repeat(30));
        }
    }

    async generate(prompt: string, model: string = "gpt-oss:20b", options: any = {}) {
        try {
            this.debugLog("Generate Request", {
                model,
                promptLength: prompt.length,
                promptPreview: prompt.substring(0, 300) + (prompt.length > 300 ? '...' : ''),
                options
            });

            const response = await this.client.generate({
                model,
                prompt,
                stream: false,
                format: options.format || undefined,
                ...options
            });

            this.debugLog("Raw Ollama Response", {
                response: response.response,
                responseLength: response.response?.length || 0,
                done: response.done,
                context: response.context?.length || 0,
                totalDuration: response.total_duration,
                loadDuration: response.load_duration,
                promptEvalCount: response.prompt_eval_count,
                evalCount: response.eval_count,
                evalDuration: response.eval_duration
            });

            // Check if response is empty and try to understand why
            if (!response.response || response.response.trim() === '') {
                this.debugLog("Empty Response Investigation", {
                    promptTooLong: prompt.length > 4000,
                    modelLoaded: response.prompt_eval_count > 0,
                    evalTokens: response.eval_count || 0,
                    contextLength: response.context?.length || 0
                });

                // If we got an empty response, try a simplified version
                if (prompt.length > 2000) {
                    console.log("⚠️  Long prompt detected, trying simplified version...");
                    const simplifiedPrompt = `You are a helpful Mux video asset manager.

User request: ${prompt.split('User request:')[1]?.trim() || prompt.substring(prompt.length - 500)}

Please provide a helpful response about video asset management.`;

                    this.debugLog("Retrying with simplified prompt", {
                        originalLength: prompt.length,
                        simplifiedLength: simplifiedPrompt.length,
                        simplifiedPrompt: simplifiedPrompt
                    });

                    const retryResponse = await this.client.generate({
                        model,
                        prompt: simplifiedPrompt,
                        stream: false,
                        ...options
                    });

                    this.debugLog("Retry Response", {
                        response: retryResponse.response,
                        responseLength: retryResponse.response?.length || 0
                    });

                    if (retryResponse.response && retryResponse.response.trim() !== '') {
                        return {
                            text: retryResponse.response,
                            finishReason: 'stop',
                            usage: {
                                promptTokens: retryResponse.prompt_eval_count || 0,
                                completionTokens: retryResponse.eval_count || 0,
                                totalTokens: (retryResponse.prompt_eval_count || 0) + (retryResponse.eval_count || 0)
                            },
                            raw: retryResponse
                        };
                    }
                }
            }

            const result = {
                text: response.response || '',
                finishReason: 'stop',
                usage: {
                    promptTokens: response.prompt_eval_count || 0,
                    completionTokens: response.eval_count || 0,
                    totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
                },
                raw: response
            };

            this.debugLog("Final Response", result);

            return result;
        } catch (error) {
            console.error('Ollama generation error:', error);
            this.debugLog("Generation Error", {
                error: error.message,
                stack: error.stack
            });
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

        this.debugLog("Generate With Tools Request", {
            model,
            toolCount: tools.length,
            tools: tools.map(t => t.name),
            systemPromptLength: systemPrompt.length
        });

        try {
            const response = await this.client.generate({
                model,
                prompt: systemPrompt,
                stream: false,
                format: 'json' // Try to force JSON format
            });

            this.debugLog("Tools Response (JSON format)", {
                response: response.response,
                responseLength: response.response?.length || 0
            });

            return {
                text: response.response || '',
                finishReason: 'stop',
                usage: {
                    promptTokens: response.prompt_eval_count || 0,
                    completionTokens: response.eval_count || 0,
                    totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
                },
                raw: response
            };
        } catch (error) {
            // Fallback to regular generation if JSON format fails
            console.warn('JSON format failed, falling back to regular generation');
            this.debugLog("JSON Format Failed", error);
            return await this.generate(prompt, model);
        }
    }

    async chat(messages: Array<{ role: string; content: string }>, model: string = "gpt-oss:20b") {
        this.debugLog("Chat Request", {
            model,
            messageCount: messages.length,
            messages: messages.map(m => ({ role: m.role, contentLength: m.content.length }))
        });

        const response = await this.client.chat({
            model,
            messages: messages.map(msg => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content
            })),
            stream: false
        });

        this.debugLog("Chat Response", {
            content: response.message.content,
            contentLength: response.message.content?.length || 0,
            role: response.message.role
        });

        return {
            text: response.message.content || '',
            finishReason: 'stop',
            usage: {
                promptTokens: response.prompt_eval_count || 0,
                completionTokens: response.eval_count || 0,
                totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
            },
            raw: response
        };
    }

    async listModels() {
        const models = await this.client.list();
        this.debugLog("Available Models", models.models.map(m => ({ name: m.name, size: m.size, modified_at: m.modified_at })));
        return models.models;
    }

    async checkHealth() {
        try {
            await this.listModels();
            this.debugLog("Health Check", "PASSED");
            return true;
        } catch (error) {
            this.debugLog("Health Check", "FAILED: " + error.message);
            return false;
        }
    }
}
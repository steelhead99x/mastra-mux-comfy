import { Ollama, type GenerateResponse } from "ollama";

export interface OllamaConfig {
    baseURL?: string;
    timeout?: number;
    retries?: number;
    debugLevel?: 'none' | 'minimal' | 'full';
}

export interface OllamaGenerateResult {
    text: string;
    finishReason?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: {
        response: string;
        responseLength: number;
        done: boolean;
        context: number;
        totalDuration?: number;
        loadDuration?: number;
        promptEvalCount: number;
        evalCount: number;
        evalDuration?: number;
        error?: string;
        stack?: string;
    };
}

export interface HealthCheckResult {
    healthy: boolean;
    model?: string;
    error?: string;
    metadata?: {
        modelLoaded: boolean;
        evalTokens: number;
        contextLength: number;
    };
}

export class OllamaProvider {
    private ollama: Ollama;
    private debug: boolean;
    private debugLevel: 'none' | 'minimal' | 'full';
    private timeout: number;
    private retries: number;

    constructor(baseURL?: string, config: OllamaConfig = {}) {
        this.ollama = new Ollama({
            host: baseURL || config.baseURL || "http://192.168.88.16:11434"
        });
        this.debug = process.env.DEBUG === 'true' || false;
        this.debugLevel = config.debugLevel || (process.env.DEBUG_LEVEL as 'none' | 'minimal' | 'full') || 'minimal';
        this.timeout = config.timeout || 60000;
        this.retries = config.retries || 3;

        this.debugLog("Initialization", `Provider created with baseURL: ${baseURL || config.baseURL || "default"}`);
    }

    private debugLog(label: string, data: any) {
        if (!this.debug || this.debugLevel === 'none') return;

        console.log(`\n🔧 OLLAMA DEBUG - ${label}:`);
        try {
            if (this.debugLevel === 'full') {
                console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
            } else {
                // Minimal debug - just show key info
                if (typeof data === 'object' && data !== null) {
                    console.log(`[Object with ${Object.keys(data).length} keys]`);
                } else {
                    console.log(data);
                }
            }
        } catch {
            console.log(data);
        }
    }

    async generate(prompt: string, model: string = "gpt-oss:20b", options: any = {}): Promise<OllamaGenerateResult> {
        this.debugLog("Generate Request", { prompt: prompt.substring(0, 100) + "...", model, options });

        try {
            // Explicitly assert non-streaming response type to disambiguate overloads
            const response = await this.ollama.generate({
                model,
                prompt,
                stream: false,
                ...options
            }) as unknown as GenerateResponse;

            this.debugLog("Generate Response", {
                hasResponse: !!response.response,
                done: response.done
            });

            // Handle empty or invalid responses with retry mechanism
            if (!response.response || response.response.trim() === '') {
                this.debugLog("Empty Response Detected", {
                    modelLoaded: (response.prompt_eval_count || 0) > 0,
                    evalTokens: response.eval_count || 0,
                    contextLength: response.context?.length || 0
                });

                // Retry with simpler prompt
                let retryAttempt = 0;
                let retryResponse: GenerateResponse = response;

                while ((!retryResponse.response || retryResponse.response.trim() === '') && retryAttempt < this.retries) {
                    retryAttempt++;
                    this.debugLog("Retry Attempt", { attempt: retryAttempt, reason: "empty response" });

                    const retryPrompt = retryAttempt === 1
                        ? `Please respond to: ${prompt.substring(0, 200)}`
                        : `Answer briefly: ${prompt.substring(0, 100)}`;

                    try {
                        retryResponse = await this.ollama.generate({
                            model,
                            prompt: retryPrompt,
                            stream: false,
                            // Fix: Use correct Ollama options format
                            options: {
                                temperature: 0.8,
                                num_predict: 150  // Use num_predict instead of max_tokens
                            }
                        }) as unknown as GenerateResponse;

                        this.debugLog("Retry Response", {
                            hasResponse: !!retryResponse.response,
                            attempt: retryAttempt
                        });

                        if (retryResponse.response && retryResponse.response.trim() !== '') {
                            return {
                                text: retryResponse.response,
                                finishReason: "stop",
                                usage: {
                                    promptTokens: retryResponse.prompt_eval_count || 0,
                                    completionTokens: retryResponse.eval_count || 0,
                                    totalTokens: (retryResponse.prompt_eval_count || 0) + (retryResponse.eval_count || 0)
                                }
                            };
                        }
                    } catch (retryError) {
                        this.debugLog("Retry Failed", {
                            attempt: retryAttempt,
                            error: retryError instanceof Error ? retryError.message : String(retryError)
                        });
                    }
                }
            }

            return {
                text: response.response || '',
                finishReason: "stop",
                usage: {
                    promptTokens: response.prompt_eval_count || 0,
                    completionTokens: response.eval_count || 0,
                    totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
                }
            };

        } catch (error) {
            this.debugLog("Generate Error", error);

            // Provide structured error response with fixed metadata
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;

            return {
                text: `Error: ${errorMessage}`,
                finishReason: "error",
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                metadata: {
                    response: '',
                    responseLength: 0,
                    done: false,
                    context: 0,
                    promptEvalCount: 0,
                    evalCount: 0,
                    error: errorMessage,
                    stack: errorStack
                }
            };
        }
    }

    async *generateStream(prompt: string, model: string = "gpt-oss:20b", options: any = {}): AsyncIterator<string> {
        this.debugLog("Generate Stream Request", { prompt: prompt.substring(0, 100) + "...", model });

        try {
            const stream = await this.ollama.generate({
                model,
                prompt,
                stream: true,
                ...options
            });

            for await (const chunk of stream) {
                if (chunk.response) {
                    yield chunk.response;
                }
            }

        } catch (error) {
            this.debugLog("Generate Stream Error", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            yield `Error: ${errorMessage}`;
        }
    }

    async healthCheck(model: string = "gpt-oss:20b"): Promise<HealthCheckResult> {
        try {
            this.debugLog("Health Check", `Testing model: ${model}`);

            const response = await this.ollama.generate({
                model,
                prompt: "Hello",
                stream: false,
                // Fix: Use correct Ollama options format
                options: { num_predict: 5 }  // Use num_predict instead of max_tokens
            }) as unknown as GenerateResponse;

            const healthy = !!(response.response && response.response.trim());

            this.debugLog("Health Check", healthy ? "PASSED" : "FAILED");

            return {
                healthy,
                model,
                metadata: {
                    modelLoaded: (response.prompt_eval_count || 0) > 0,
                    evalTokens: response.eval_count || 0,
                    contextLength: response.context?.length || 0
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.debugLog("Health Check", "FAILED: " + errorMessage);
            return {
                healthy: false,
                model,
                error: errorMessage
            };
        }
    }

    async listModels(): Promise<Array<{name: string, size: number, modified_at: string}>> {
        try {
            const response = await this.ollama.list();
            const models = response.models || [];
            return models.map(m => ({
                name: m.name,
                size: m.size,
                modified_at: (m.modified_at instanceof Date) ? m.modified_at.toISOString() : String(m.modified_at)
            }));
        } catch (error) {
            this.debugLog("List Models Error", error);
            return [];
        }
    }

    async pullModel(model: string): Promise<boolean> {
        try {
            this.debugLog("Pulling Model", model);
            await this.ollama.pull({ model, stream: false });
            return true;
        } catch (error) {
            this.debugLog("Pull Model Error", error);
            return false;
        }
    }

    async showModel(model: string): Promise<any> {
        try {
            return await this.ollama.show({ model });
        } catch (error) {
            this.debugLog("Show Model Error", error);
            return null;
        }
    }

    // Add missing chat method that was referenced in test-debug-tools
    async chat(messages: Array<{role: string, content: string}>, model: string = "gpt-oss:20b"): Promise<OllamaGenerateResult> {
        // Convert chat format to simple prompt for Ollama
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';
        return this.generate(prompt, model);
    }
}
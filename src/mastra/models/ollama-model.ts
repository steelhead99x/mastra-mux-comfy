// Clean, minimal Ollama model factory used by Mastra Agent configuration.
// This avoids external SDK/type dependencies and simply returns an object
// that exposes getModelId/getProvider, which is sufficient for display
// and basic wiring in your current setup.

export interface OllamaModelConfig {
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

/**
 * Returns a lightweight model descriptor compatible with the current Agent usage.
 * Note: This is a stub. If you later need full generation capabilities via AI SDK,
 * implement that in a separate module to keep this file dependency-free.
 */
export function createOllamaModel(config: OllamaModelConfig): any {
    const {
        model,
        baseURL,
        temperature,
        maxTokens,
        topP,
        topK,
        frequencyPenalty,
        presencePenalty,
    } = config;

    // Minimal shape used by your logs and Mastra inspector panes.
    return {
        // Mastra inspector helpers (used in your index.ts logs)
        getModelId: () => model,
        getProvider: () => "ollama",

        // Optional metadata if you want to inspect later
        getConfig: () => ({
            model,
            baseURL,
            temperature,
            maxTokens,
            topP,
            topK,
            frequencyPenalty,
            presencePenalty,
        }),
    };
}
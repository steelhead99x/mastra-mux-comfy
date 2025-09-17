import { OllamaProvider } from '../models/ollama-provider';

export async function checkOllamaHealth(baseUrl?: string): Promise<{
    isHealthy: boolean;
    models: string[];
    error?: string;
}> {
    try {
        const provider = new OllamaProvider(baseUrl);
        const isHealthy = await provider.checkHealth();

        if (isHealthy) {
            const models = await provider.listModels();
            return {
                isHealthy: true,
                models: models.map(m => m.name)
            };
        } else {
            return {
                isHealthy: false,
                models: [],
                error: "Ollama server is not responding"
            };
        }
    } catch (error) {
        return {
            isHealthy: false,
            models: [],
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

export async function ensureModelExists(modelName: string, baseUrl?: string): Promise<boolean> {
    try {
        const provider = new OllamaProvider(baseUrl);
        const models = await provider.listModels();
        return models.some(m => m.name === modelName);
    } catch (error) {
        console.error(`Error checking if model ${modelName} exists:`, error);
        return false;
    }
}
import { OllamaProvider } from '../models/ollama-provider';

export interface OllamaHealthStatus {
    healthy: boolean;
    model?: string;
    error?: string;
    models: string[];
}

export async function checkOllamaHealth(provider: OllamaProvider, model: string): Promise<OllamaHealthStatus> {
    try {
        // Fix: Use healthCheck instead of checkHealth
        const healthResult = await provider.healthCheck(model);
        const models = await provider.listModels();
        
        return {
            healthy: healthResult.healthy,
            model,
            error: healthResult.error,
            // Fix: Access name property correctly
            models: models.map(m => m.name)
        };
    } catch (error) {
        return {
            healthy: false,
            model,
            error: error instanceof Error ? error.message : String(error),
            models: []
        };
    }
}

export async function ensureModelExists(provider: OllamaProvider, modelName: string): Promise<boolean> {
    try {
        const models = await provider.listModels();
        // Fix: Access name property correctly
        const exists = models.some(m => m.name === modelName);
        
        if (!exists) {
            console.log(`Model ${modelName} not found. Attempting to pull...`);
            const pulled = await provider.pullModel(modelName);
            if (!pulled) {
                console.error(`Failed to pull model ${modelName}`);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error checking/pulling model:', error);
        return false;
    }
}
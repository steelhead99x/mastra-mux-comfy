import { OllamaProvider } from "../models/ollama-provider";
import type { OllamaHealthResponse } from "../models/ollama-provider";

export interface OllamaHealthStatus {
    healthy: boolean;
    model: string;
    error?: string;
    models: string[];
}

export async function checkOllamaHealth(provider: OllamaProvider, model: string): Promise<OllamaHealthStatus> {
    try {
        // Fix: Use healthCheck without parameters
        const healthResult: OllamaHealthResponse = await provider.healthCheck();
        const models = await provider.listModels();

        return {
            // Fix: Check if status is 'healthy'
            healthy: healthResult.status === 'healthy',
            model,
            // Fix: No error property in healthResult, only set if unhealthy
            error: healthResult.status !== 'healthy' ? 'Health check failed' : undefined,
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

export async function ensureModel(provider: OllamaProvider, modelName: string): Promise<boolean> {
    try {
        // Check if model exists
        const models = await provider.listModels();
        const modelExists = models.some(m => m.name === modelName);

        if (!modelExists) {
            console.log(`Model ${modelName} not found, attempting to pull...`);
            // Fix: Use pull method instead of pullModel
            await provider.pull(modelName);
            console.log(`Successfully pulled model: ${modelName}`);
        }

        return true;
    } catch (error) {
        console.error(`Failed to ensure model ${modelName}:`, error);
        return false;
    }
}
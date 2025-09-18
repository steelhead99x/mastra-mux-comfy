
import dotenv from "dotenv";
import path from "path";
import { generateText } from "ai";
import { OllamaProvider } from "../models/ollama-provider";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { MastraLanguageModel } from "@mastra/core/dist/llm/model/shared.types";

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

export function createOllamaModel(config: OllamaModelConfig): MastraLanguageModel {
    const {
        model,
        baseURL = "http://localhost:11434",
        temperature = 0.7,
        maxTokens = 2048,
        topP,
        topK,
        frequencyPenalty,
        presencePenalty,
    } = config;

    const provider = createOpenAICompatible({
        baseURL: `${baseURL}/v1`,
        name: "ollama",
        apiKey: "ollama", // Ollama doesn't require a real API key
    });

    // Note: per-request settings (temperature, maxTokens, etc.) can be passed
    // in generateText/streamText calls. Provider-level defaults are not set here.
    return provider.chatModel(model);
}

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testDirectOllama() {
    console.log("🔄 Trying direct Ollama approach...");

    const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const modelName = process.env.OLLAMA_MODEL || "llama3.2:3b";

    const provider = new OllamaProvider(baseURL);

    try {
        const result = await provider.generate("Say hello in exactly 3 words.", modelName);
        console.log("✅ Direct approach successful!");
        console.log("Response:", result.text);
        return result;
    } catch (error: any) {
        console.error("❌ Direct approach failed:", error.message);
        throw error;
    }
}

async function testAISDKOllama() {
    console.log("🔄 Trying AI SDK approach...");

    const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const modelName = process.env.OLLAMA_MODEL || "llama3.2:3b";

    try {
        const model = createOllamaModel({
            model: modelName,
            baseURL: baseURL,
            temperature: 0.1,
            maxTokens: 50,
        });

        const response = await generateText({
            model: model,
            prompt: "Say hello in exactly 3 words.",
        });

        console.log("✅ AI SDK approach successful!");
        console.log("Response:", response.text);
        console.log("Usage:", response.usage);
        return response;
    } catch (error: any) {
        console.error("❌ AI SDK approach failed:", error.message);
        throw error;
    }
}

async function fixedOllamaTest() {
    console.log("🤖 Fixed Ollama Test - Multiple Approaches");
    console.log("==========================================");

    let success = false;

    try {
        console.log("1. Testing Ollama connection...");
        const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

        // Test health endpoint
        const healthResponse = await fetch(`${baseURL}/api/version`);
        if (!healthResponse.ok) {
            throw new Error(`Ollama health check failed: ${healthResponse.status}`);
        }
        const versionData = await healthResponse.json();
        console.log(`✅ Ollama is running (version: ${versionData.version || 'unknown'})`);

        // List available models first
        console.log("2. Checking available models...");
        const modelsResponse = await fetch(`${baseURL}/api/tags`);
        if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            const availableModels = modelsData.models?.map((m: any) => m.name) || [];
            console.log("Available models:", availableModels);

            if (availableModels.length === 0) {
                console.log("⚠️ No models found. You may need to pull a model first:");
                console.log("   ollama pull llama3.2:3b");
                process.exit(1);
            }
        }

        console.log("3. Testing generation approaches...");

        // Try direct approach first
        try {
            await Promise.race([
                testDirectOllama(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Direct approach timeout after 20 seconds')), 20000)
                )
            ]);
            success = true;
        } catch (error: any) {
            console.error("❌ Direct approach failed:", error.message);
        }

        // Try AI SDK approach
        try {
            await Promise.race([
                testAISDKOllama(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('AI SDK timeout after 20 seconds')), 20000)
                )
            ]);
            success = true;
        } catch (error: any) {
            console.error("❌ AI SDK approach failed:", error.message);

            if (error.message.includes('UnsupportedModelVersionError')) {
                console.log("💡 This is a known issue with AI SDK 5 and current Ollama versions");
                console.log("💡 The direct approach above should work for your use case");
            }

            if (error.message.includes('timeout')) {
                console.log("💡 Model responses can take time, especially for large models");
            }
        }

        console.log("\n4. Test complete!");

    } catch (error: any) {
        console.error("❌ Test setup failed:", error);

        if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
            console.log("💡 Connection issues. Check:");
            console.log(`- Ollama is running on: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
            console.log("- Start Ollama with: 'ollama serve'");
        }
    }

    process.exit(success ? 0 : 1);
}

// Run the test
fixedOllamaTest().catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
});
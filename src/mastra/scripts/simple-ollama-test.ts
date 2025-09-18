import { generateText } from "ai";
import { createOllamaModel, DirectOllamaModel } from "../models/ollama-model";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testDirectOllama() {
    console.log("🔄 Trying direct Ollama approach...");

    const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const modelName = process.env.OLLAMA_MODEL || "llama3.2:3b";

    const directModel = new DirectOllamaModel({
        model: modelName,
        baseURL: baseURL,
        temperature: 0.1,
        maxTokens: 50,
    });

    const result = await directModel.generate("Say hello in exactly 3 words.");
    console.log("✅ Direct approach successful!");
    console.log("Response:", result.text);
    console.log("Usage:", result.usage);
    return result;
}

async function testAISDKOllama() {
    console.log("🔄 Trying AI SDK approach...");

    const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const modelName = process.env.OLLAMA_MODEL || "llama3.2:3b";

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
}

async function fixedOllamaTest() {
    console.log("🤖 Fixed Ollama Test - Multiple Approaches");
    console.log("==========================================");

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
                return;
            }
        }

        console.log("3. Testing generation approaches...");

        // Try direct approach first
        try {
            await testDirectOllama();
        } catch (error) {
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
        } catch (error) {
            console.error("❌ AI SDK approach failed:", error.message);

            if (error.message.includes('UnsupportedModelVersionError')) {
                console.log("💡 This is a known issue with AI SDK 5 and current Ollama versions");
                console.log("💡 The direct approach above should work for your use case");
            }
        }

    } catch (error: any) {
        console.error("❌ Test setup failed:", error);

        if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
            console.log("💡 Connection issues. Check:");
            console.log(`- Ollama is running on: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
            console.log("- Start Ollama with: 'ollama serve'");
        }
    }
}

// Run the test
fixedOllamaTest().catch(console.error);
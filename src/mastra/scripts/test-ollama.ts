import "dotenv/config";
import { OllamaProvider } from "../models/ollama-provider";
import { checkOllamaHealth } from "../utils/ollama-health";

async function testOllamaConnection() {
    console.log("🧪 Testing Ollama Connection");
    console.log("============================");

    const baseUrl = process.env.OLLAMA_BASE_URL || "http://192.168.88.16:11434";
    const model = process.env.OLLAMA_MODEL || "gpt-oss:20b";

    console.log(`📡 Testing connection to: ${baseUrl}`);
    console.log(`🧠 Using model: ${model}`);

    try {
        // Health check
        console.log("\n1. Checking server health...");
        const health = await checkOllamaHealth(baseUrl);

        if (!health.isHealthy) {
            console.error("❌ Ollama server is not healthy:", health.error);
            return;
        }

        console.log("✅ Server is healthy");
        console.log("📋 Available models:", health.models.join(", "));

        // Test generation
        console.log("\n2. Testing text generation...");
        const provider = new OllamaProvider(baseUrl);

        const response = await provider.generate("Hello! Can you help me with video processing?", model);
        console.log("✅ Generation successful");
        console.log("Response:", response.text.substring(0, 200) + "...");

        // Test chat
        console.log("\n3. Testing chat functionality...");
        const chatResponse = await provider.chat([
            { role: "system", content: "You are a helpful video processing assistant." },
            { role: "user", content: "What video formats do you support?" }
        ], model);

        console.log("✅ Chat successful");
        console.log("Response:", chatResponse.text.substring(0, 200) + "...");

    } catch (error) {
        console.error("❌ Error testing Ollama:", error);
        console.error("\nTroubleshooting tips:");
        console.error("1. Ensure Ollama is running: systemctl status ollama");
        console.error("2. Check if model exists: ollama list");
        console.error(`3. Pull model if needed: ollama pull ${model}`);
        console.error("4. Test manually: curl http://192.168.88.16:11434/api/tags");
    }
}

testOllamaConnection().then(() => {
    console.log("\n🏁 Ollama test completed");
    process.exit(0);
}).catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
});
// TypeScript
import "dotenv/config";
import { ollamaGenerateText, ollamaStreamText } from "../models/ollama-vnext";

async function run() {
    const prompt = "Explain what Mux is in 2 sentences.";

    console.log("=== vNext Non-Streaming ===");
    console.log((await ollamaGenerateText(prompt, { temperature: 0.2 })).text);

    console.log("\n=== vNext Streaming ===");
    const streamResult = await ollamaStreamText("List three video streaming concepts:");
    
    // Fix: Access the textStream property from the result
    for await (const chunk of streamResult.textStream) {
        process.stdout.write(chunk);
    }
    process.stdout.write("\n\n✅ Done\n");
}

run().catch((err) => {
    console.error("Demo failed:", err);
    process.exit(1);
});
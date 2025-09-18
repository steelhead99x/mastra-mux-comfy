// TypeScript
import "dotenv/config";
import { ollamaGenerateText, ollamaStreamText } from "../models/ollama-vnext";

async function run() {
    const prompt = "Explain what Mux is in 2 sentences.";

    console.log("=== vNext Non-Streaming ===");
    const text = await ollamaGenerateText(prompt, { temperature: 0.2 });
    console.log(text);

    console.log("\n=== vNext Streaming ===");
    const stream = await ollamaStreamText("List three video streaming concepts:");
    for await (const chunk of stream) {
        process.stdout.write(chunk);
    }
    process.stdout.write("\n\n✅ Done\n");
}

run().catch((err) => {
    console.error("Demo failed:", err);
    process.exit(1);
});
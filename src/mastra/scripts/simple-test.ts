import dotenv from "dotenv";
import { Agent } from "@mastra/core";
import { muxMcpClient } from "../mcp/mux-client";
import { createOllamaModel } from "../models/ollama-model";

dotenv.config();

async function simpleTest() {
    console.log("🧪 Simple Agent Test");
    console.log("====================");

    try {
        // Create agent directly
        const agent = new Agent({
            name: "testAgent",
            instructions: "You are a simple test agent. Use tools to answer questions.",
            model: createOllamaModel({
                model: process.env.OLLAMA_MODEL || "llama3.2:3b",
                baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            }),
            tools: async () => {
                return await muxMcpClient.getTools();
            },
        });

        // Test tools
        console.log("1. Getting tools...");
        const tools = await agent.getTools({});
        console.log(`✅ Got ${Object.keys(tools).length} tools`);

        // Test simple generation
        console.log("2. Testing generation...");
        const result = await agent.generateVNext("List video assets with a limit of 2");
        console.log("✅ Response:");
        console.log(result.text);

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Run directly
simpleTest().catch(console.error);
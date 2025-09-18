import dotenv from "dotenv";
import { Agent } from "@mastra/core";
import { muxMcpClient } from "../mcp/mux-client";
import { createOllamaModel } from "../models/ollama-model";

dotenv.config();

async function explicitToolTest() {
    console.log("🎯 Explicit Tool Test");
    console.log("=====================");

    try {
        // First, let's see what tools we actually have
        console.log("1. Getting actual tool names...");
        const tools = await muxMcpClient.getTools();
        const toolNames = Object.keys(tools);

        console.log(`✅ Found ${toolNames.length} tools`);
        console.log("Video asset tools:", toolNames.filter(name => name.includes('video_assets')));
        console.log("List tools:", toolNames.filter(name => name.includes('list')).slice(0, 10));

        // Create agent with very specific instructions
        const agent = new Agent({
            name: "explicitAgent",
            instructions: `You are a video asset assistant. 

IMPORTANT: You must use ONLY these exact tool names:
- list_video_assets (to list video assets)
- retrieve_video_assets (to get specific asset details)

NEVER use tool names like "list_data_video_assets" - that tool does not exist.

When asked to list video assets, use the "list_video_assets" tool with appropriate parameters.`,

            model: createOllamaModel({
                model: process.env.OLLAMA_MODEL || "llama3.2:3b",
                baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                temperature: 0.1, // Lower temperature for more deterministic behavior
            }),

            tools: async () => tools,
        });

        console.log("\n2. Testing with explicit instructions...");
        const result = await agent.generateVNext(`Please use the "list_video_assets" tool to show me 2 video assets. Use exactly that tool name: list_video_assets`);

        console.log("✅ Response:");
        console.log(result.text);

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

explicitToolTest().catch(console.error);
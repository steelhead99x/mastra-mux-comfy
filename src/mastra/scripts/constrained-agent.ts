import dotenv from "dotenv";
import { Agent } from "@mastra/core";
import { muxMcpClient } from "../mcp/mux-client";
import { createOllamaModel } from "../models/ollama-model";

dotenv.config();

async function constrainedAgentTest() {
    console.log("🔒 Constrained Agent Test");
    console.log("=========================");

    try {
        // Get all tools but filter to only the ones we want
        const allTools = await muxMcpClient.getTools();

        // Create a filtered set of tools with only the ones we trust
        const allowedToolNames = [
            'list_video_assets',
            'retrieve_video_assets',
            'list_data_video_views',
            'list_data_errors'
        ];

        const filteredTools: Record<string, any> = {};
        allowedToolNames.forEach(toolName => {
            if (allTools[toolName]) {
                filteredTools[toolName] = allTools[toolName];
            }
        });

        console.log(`Allowed tools: ${Object.keys(filteredTools).join(', ')}`);

        const agent = new Agent({
            name: "constrainedAgent",
            instructions: `You are a video asset manager. You have access to these specific tools:

${Object.keys(filteredTools).map(name => `- ${name}`).join('\n')}

Use ONLY these tools. Never try to use any other tool names.`,

            model: createOllamaModel({
                model: process.env.OLLAMA_MODEL || "llama3.2:3b",
                baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                temperature: 0.1,
            }),

            tools: async () => filteredTools,
        });

        console.log("\nTesting constrained agent...");
        const result = await agent.generateVNext("List 2 video assets");

        console.log("✅ Response:");
        console.log(result.text);

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

constrainedAgentTest().catch(console.error);
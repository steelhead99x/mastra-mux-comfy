import { Agent } from "@mastra/core";
import { muxMcpClient } from "../mcp/mux-client";
import { createOllamaModel } from "../models/ollama-model";
import dotenv from "dotenv";

dotenv.config();

export class BasicAgent {
    private agent: Agent;

    constructor() {
        this.agent = new Agent({
            name: "basicMuxAgent",
            instructions: `You are a basic AI assistant with access to Mux video tools. Use the available tools to answer questions about video assets.`,

            model: createOllamaModel({
                model: process.env.OLLAMA_MODEL || "llama3.2:3b",
                baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                temperature: 0.7,
                maxTokens: 1024,
            }),

            tools: async () => {
                try {
                    return await muxMcpClient.getTools();
                } catch (error) {
                    console.warn("Failed to get tools:", error);
                    return {};
                }
            },
        });
    }

    async ask(question: string) {
        return await this.agent.generateVNext(question);
    }

    async listTools() {
        const tools = await muxMcpClient.getTools();
        return Object.keys(tools);
    }
}

export default BasicAgent;
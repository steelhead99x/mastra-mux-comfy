// TypeScript
import { Agent } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { ollamaModel } from "../models/ollama-vnext";
import { muxMcpClient } from "../mcp/mux-client";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

console.log("Creating interactive agent...");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

// Create Ollama provider for embeddings
const ollamaProvider = createOpenAICompatible({
  name: "ollama",
  baseURL: OLLAMA_BASE_URL,
});

// Create memory for the agent to store conversation context
const agentMemory = new Memory({
  storage: new LibSQLStore({
    url: "file:./agent-memory.db", // Local SQLite file for memory storage
  }),
  vector: new LibSQLVector({
    connectionUrl: "file:./agent-memory.db", // Use the same database for vector storage
  }),
  embedder: ollamaProvider.textEmbeddingModel("gemma:300m"), // Use Ollama's gemma embedding model
  options: {
    workingMemory: {
      enabled: true,
    },
    semanticRecall: {
      topK: 3,
      messageRange: 2,
      scope: 'thread',
    },
  },
});

/**
 * Proper Mastra Agent instance for the dev UI.
 * This will appear in the Agents section of the dev server.
 */
export const interactiveAgent = new Agent({
  name: "interactive",
  instructions: "Interactive terminal agent using Ollama (gpt-oss:20b). You have memory of our conversation history. It can call Mux MCP tools (up to 10 summarized on startup). Ask about listing/searching assets, statuses, and reports. Avoid repeating yourself by referencing previous messages in our conversation.",
  model: ollamaModel,
  memory: agentMemory,
  tools: async () => {
    try {
      console.log("Loading tools for interactive agent...");
      const tools = await muxMcpClient.getTools();
      console.log(`Loaded ${Object.keys(tools).length} tools for interactive agent`);
      return tools;
    } catch (err) {
      console.error("[interactiveAgent] Failed to load MCP tools:", err);
      return {};
    }
  },
});

console.log("Interactive agent created successfully:", interactiveAgent.name);

/**
 * Interactive agent runner function for the terminal interface
 */
export async function runInteractiveAgent(): Promise<void> {
  console.log("🤖 Starting interactive agent session...");
  
  try {
    // Initialize the MCP client and tools
    console.log("🔧 Loading MCP tools...");
    const tools = await muxMcpClient.getTools();
    console.log(`✅ Loaded ${Object.keys(tools).length} tools: ${Object.keys(tools).join(', ')}`);
    
    // You can add interactive terminal logic here
    // For now, we'll just log that the agent is ready
    console.log("🚀 Interactive agent is ready! Agent name:", interactiveAgent.name);
    console.log("💡 Agent instructions:", interactiveAgent.instructions);
    
    // Keep the process alive for the interactive session
    console.log("📝 Agent session running. Press Ctrl+C to exit.");
    
    // Simple keep-alive loop
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error("❌ Failed to start interactive agent:", error);
    throw error;
  }
}
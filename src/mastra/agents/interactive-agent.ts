// TypeScript
import { Agent } from "@mastra/core";
import { ollamaModel } from "../models/ollama-vnext";
import { muxMcpClient } from "../mcp/mux-client";

console.log("Creating interactive agent...");

/**
 * Proper Mastra Agent instance for the dev UI.
 * This will appear in the Agents section of the dev server.
 */
export const interactiveAgent = new Agent({
  name: "interactive",
  instructions: "Interactive terminal agent using Ollama (gpt-oss:20b). It can call Mux MCP tools (up to 10 summarized on startup). Ask about listing/searching assets, statuses, and reports.",
  model: ollamaModel,
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
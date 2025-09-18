import { Mastra } from "@mastra/core";
import { interactiveAgent } from "./agents/interactive-agent";
import { muxMcpClient } from "./mcp/mux-client";

// Create the main Mastra instance
export const mastra = new Mastra({
    name: "mastra-mux-comfyui-workflow",
    version: "1.1.0",
    agents: {
        interactive: interactiveAgent,
    },
    tools: async () => {
        try {
            console.log("🔧 Loading MCP tools for Mastra instance...");
            const tools = await muxMcpClient.getTools();
            console.log(`✅ Loaded ${Object.keys(tools).length} tools:`, Object.keys(tools));
            return tools;
        } catch (error) {
            console.error("❌ Failed to load MCP tools:", error);
            return {};
        }
    },
});

// Keep your existing bootstrap function for the interactive agent
async function bootstrapInteractiveAgent() {
    try {
        console.log("🚀 Starting Interactive Terminal Agent...");
        const { runInteractiveAgent } = await import("./agents/interactive-agent");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start terminal agent:", err);
    }
}

// Export for use
export { bootstrapInteractiveAgent };

// If running directly, start the interactive agent
if (import.meta.url === `file://${process.argv[1]}`) {
    bootstrapInteractiveAgent();
}

import { Mastra, Agent } from "@mastra/core";
import { interactiveAgent } from "./agents/interactive-agent";
import { interactiveAgent as interactiveDataAgent } from "./agents/interactive-agent-errors";
import { interactiveAgent as interactiveAnalyticsAgent } from "./agents/interactive-agent-analytics";
import { anthropicDynamicAgent } from "./agents/anthropic-dynamic-agent";
import { model as lmstudioModel, lmstudioMemory } from "./models/lmstudio";
import { muxMcpClient } from "./mcp/mux-client";

console.log("🚀 Initializing Mastra with multi-model agents...");

// Define an LM Studio MCP Agent so it shows up in mastra dev
const lmstudioMcpAgent = new Agent({
    name: "lmstudio-mcp",
    instructions: `You are an AI assistant running on LM Studio and have access to Mux MCP tools.
- Use tools to discover endpoints, fetch schemas, and invoke Mux APIs.
- Leverage memory to recall prior context and retrieved knowledge.
- Be concise and explain your steps when using tools.
- If a tool is unavailable, suggest checking environment configuration.`,
    model: lmstudioModel,
    memory: lmstudioMemory,
    tools: async () => {
        try {
            return await muxMcpClient.getTools();
        } catch (err) {
            console.error("[lmstudio-mcp] Failed to load MCP tools:", err);
            return {};
        }
    },
});

// Register agents so they appear in mastra dev
const agentsConfig = {
    "ollama-mux-interactive": interactiveAgent,
    "ollama-mux-interactive-errors": interactiveDataAgent,
    "ollama-mux-interactive-analytics": interactiveAnalyticsAgent,
    "anthropic-dynamic": anthropicDynamicAgent,
    "lmstudio-mcp": lmstudioMcpAgent, // Memory-enabled LM Studio agent
};

export const mastra = new Mastra({
    agents: agentsConfig,
});

console.log("✅ Mastra initialized successfully");
console.log(`   Agents available: ${Object.keys(agentsConfig).length}`);
console.log(`   Agent names: ${Object.keys(agentsConfig).join(", ")}`);

// Optional bootstrap helpers (do NOT run them automatically)
async function bootstrapInteractiveAgent() {
    try {
        const { runInteractiveAgent } = await import("./agents/interactive-agent");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start terminal agent:", err);
    }
}

async function bootstrapInteractiveAnalyticsAgent() {
    try {
        const { runInteractiveAgent } = await import("./agents/interactive-agent-analytics");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start analytics agent:", err);
    }
}

async function bootstrapInteractiveDataAgent() {
    try {
        const { runInteractiveAgent } = await import("./agents/interactive-agent-errors");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start data agent:", err);
    }
}

async function bootstrapAnthropicAgent() {
    try {
        const { runAnthropicDynamicAgent } = await import("./agents/anthropic-dynamic-agent");
        await runAnthropicDynamicAgent();
    } catch (err) {
        console.error("Failed to start Anthropic agent:", err);
    }
}

async function bootstrapLmStudioMcpCli() {
    try {
        // This imports the interactive CLI file that runs a readline loop.
        await import("./agents/lmstudio-mcp-agent");
    } catch (err) {
        console.error("Failed to start LM Studio MCP CLI:", err);
    }
}

// Export bootstraps if you need to run them via scripts elsewhere
export {
    bootstrapInteractiveAgent,
    bootstrapInteractiveAnalyticsAgent,
    bootstrapInteractiveDataAgent,
    bootstrapAnthropicAgent,
    bootstrapLmStudioMcpCli,
};

// Note: No CLI switch or top-level awaits here.
// mastra dev should import this file safely and show all agents.
// TypeScript
import "dotenv/config";
import { Mastra, Agent } from "@mastra/core";

console.log("Loading index.ts...");

// Minimal telemetry config
const telemetryConfig = {
    enabled: process.env.MASTRA_TELEMETRY !== "false",
    serviceName: process.env.MASTRA_SERVICE_NAME || "mastra-mux-workflow",
} as any;

// Create agent directly in the Mastra config
const interactiveAgent = new Agent({
    name: "interactive",
    instructions: "Interactive terminal agent using Ollama (gpt-oss:20b). It can call Mux MCP tools.",
    model: {
        provider: "ollama",
        name: "gpt-oss:20b",
        toolChoice: "auto"
    },
    tools: {}
});

console.log("Agent created:", interactiveAgent.name);

export const mastra = new Mastra({
    telemetry: telemetryConfig,
    agents: {
        interactive: interactiveAgent
    }
});

console.log("Mastra instance created with agents");

// Also export for backwards compatibility
export const agents = {
    interactive: interactiveAgent,
};

// Start terminal agent
async function bootstrapInteractiveAgent() {
    try {
        console.log("🚀 Starting Interactive Agent...");
        const { runInteractiveAgent } = await import("./agents/interactive-ollama-agent");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start interactive agent:", err);
    }
}

setTimeout(() => {
    bootstrapInteractiveAgent();
}, 1000);
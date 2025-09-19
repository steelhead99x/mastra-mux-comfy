import { Mastra } from "@mastra/core";
import { interactiveAgent } from "./agents/interactive-agent";
import { interactiveAgent as interactiveDataAgent } from "./agents/interactive-agent-errors";

import { anthropicDynamicAgent } from "./agents/anthropic-dynamic-agent";

console.log("🚀 Initializing Mastra with multi-model agents...");

// Define agents object for reference
const agentsConfig = {
    'ollama-mux-interactive': interactiveAgent,
    'ollama-mux-interactive-errors': interactiveDataAgent,
    'anthropic-dynamic': anthropicDynamicAgent,
};

// Create the main Mastra instance with both agents
export const mastra = new Mastra({
    agents: agentsConfig,
});

console.log("✅ Mastra initialized successfully");
console.log(`   Agents available: ${Object.keys(agentsConfig).length}`);
console.log(`   Agent names: ${Object.keys(agentsConfig).join(', ')}`);

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

// Keep your existing bootstrap function for the interactive agent
async function bootstrapInteractiveDataAgent() {
    try {
        console.log("🚀 Starting Interactive Data Terminal Agent...");
        const { runInteractiveAgent } = await import("./agents/interactive-agent-errors");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start data terminal agent:", err);
        
        // Add more specific error handling
        if (err instanceof Error) {
            console.error("Error details:", err.message);
            console.error("Stack trace:", err.stack);
        }
        
        // Check if it's a module loading issue
        if (err instanceof Error && err.message.includes("Cannot resolve")) {
            console.error("💡 Hint: Make sure the interactive-agent-errors.ts file exists and exports runInteractiveAgent");
        }
    }
}

// New bootstrap function for the Anthropic dynamic agent
async function bootstrapAnthropicAgent() {
    try {
        console.log("🎬 Starting Anthropic Dynamic Agent...");
        const { runAnthropicDynamicAgent } = await import("./agents/anthropic-dynamic-agent");
        await runAnthropicDynamicAgent();
    } catch (err) {
        console.error("Failed to start Anthropic agent:", err);
    }
}

// Export both bootstrap functions (preserving existing exports)
export { bootstrapInteractiveAgent, bootstrapInteractiveDataAgent, bootstrapAnthropicAgent };

// Enhanced command line interface - preserves original functionality + adds new options
if (import.meta.url === `file://${process.argv[1]}`) {
    const agentChoice = process.argv[2];

    switch (agentChoice) {
        case 'anthropic':
        case 'claude':
            console.log("🎬 Starting Anthropic Dynamic Agent...");
            bootstrapAnthropicAgent();
            break;
        case 'ollama':
        case 'data':
            console.log("🤖 Starting Ollama Interactive Agent...");
            bootstrapInteractiveAgent();
            break;
        case 'interactive':
            console.log("🤖 Starting Ollama Interactive Agent...");
            bootstrapInteractiveDataAgent();
            break;
        default:
            // Default behavior - start the original interactive agent (preserves existing functionality)
            console.log("🤖 Multi-Model Mastra Instance Ready");
            console.log("Available agents:");
            console.log("  • interactive (Ollama gpt-oss:20b) - Default");
            console.log("  • anthropic-dynamic (Claude 3.5 Sonnet) - New");
            console.log("\nTo run a specific agent:");
            console.log("  tsx src/mastra/index.ts anthropic  # New Anthropic agent");
            console.log("  tsx src/mastra/index.ts ollama     # Original interactive agent");
            console.log("\nOr use npm scripts:");
            console.log("  npm run agent:anthropic            # New Anthropic agent");
            console.log("  npm run dev:alt                    # Original interactive agent");
            console.log("  npm run dev                        # Mastra dev UI with both agents");

            // Preserve original default behavior - start interactive agent
            console.log("\n🚀 Starting default Interactive Terminal Agent...");
            bootstrapInteractiveAgent();
            break;
    }
}
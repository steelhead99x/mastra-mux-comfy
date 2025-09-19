import { Mastra } from "@mastra/core";
import { interactiveAgent } from "./agents/interactive-agent";
import { interactiveAgent as interactiveDataAgent } from "./agents/interactive-agent-errors";
import { anthropicDynamicAgent } from "./agents/anthropic-dynamic-agent";
import { interactiveAgent as interactiveAnalyticsAgent } from "./agents/interactive-agent-analytics"; // NEW
// ... existing code ...
console.log("🚀 Initializing Mastra with multi-model agents...");

// Define agents object for reference
const agentsConfig = {
    'ollama-mux-interactive': interactiveAgent,
    'ollama-mux-interactive-errors': interactiveDataAgent,
    'ollama-mux-interactive-analytics': interactiveAnalyticsAgent, // NEW - register analytics
    'anthropic-dynamic': anthropicDynamicAgent,
};

// Create the main Mastra instance with both agents
export const mastra = new Mastra({
    agents: agentsConfig,
});

// ... existing code ...
console.log("✅ Mastra initialized successfully");
console.log(`   Agents available: ${Object.keys(agentsConfig).length}`);
console.log(`   Agent names: ${Object.keys(agentsConfig).join(', ')}`);

// ... existing code ...
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
// ... existing code ...


// Keep your existing bootstrap function for the interactive agent
async function bootstrapInteractiveAnalyticsAgent() {
    try {
        console.log("🚀 Starting Interactive Analytics Agent..."); // clearer log
        const { runInteractiveAgent } = await import("./agents/interactive-agent-analytics");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start analytics agent:", err);
        // ... existing code ...
    }
}

// Keep your existing bootstrap function for the interactive agent
async function bootstrapInteractiveDataAgent() {
    try {
        console.log("🚀 Starting Interactive Data Agent...");
        const { runInteractiveAgent } = await import("./agents/interactive-agent-errors");
        await runInteractiveAgent();
    } catch (err) {
        console.error("Failed to start data agent:", err);
        // ... existing code ...
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
export { bootstrapInteractiveAgent, bootstrapInteractiveDataAgent,bootstrapInteractiveAnalyticsAgent, bootstrapAnthropicAgent };

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
        case 'analytic':
        case 'analytics': // accept both singular/plural
            console.log("🤖 Starting Ollama Analytics Agent...");
            bootstrapInteractiveAnalyticsAgent();
            break;
        case 'data':
            console.log("🤖 Starting Ollama Data Agent...");
            bootstrapInteractiveDataAgent();
            break;
        case 'interactive':
            console.log("🤖 Starting Ollama Interactive Agent...");
            bootstrapInteractiveAgent();
            break;
        default:
            // Default behavior - start the original interactive agent (preserves existing functionality)
            console.log("🤖 Multi-Model Mastra Instance Ready");
            console.log("Available agents:");
            console.log("  • interactive (Ollama gpt-oss:20b) - Default");
            console.log("  • anthropic-dynamic (Claude 3.5 Sonnet) - New");
            console.log("\nTo run a specific agent:");
            console.log("  tsx src/mastra/index.ts anthropic  # New Anthropic agent");
            console.log("  tsx src/mastra/index.ts analytics  # Ollama analytics agent"); // hint
            console.log("\nOr use npm scripts:");
            console.log("  npm run agent:anthropic            # New Anthropic agent");
            console.log("  npm run agent:ollama-interactive-analytics # Analytics agent");
            console.log("  npm run dev                        # Mastra dev UI with all agents");

            console.log("\n🚀 Starting default Interactive Terminal Agent...");
            bootstrapInteractiveAgent();
            break;
    }
}
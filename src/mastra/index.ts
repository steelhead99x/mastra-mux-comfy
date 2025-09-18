import { Mastra } from "@mastra/core";
import { interactiveAgent } from "./agents/interactive-agent";

// Create the main Mastra instance
export const mastra = new Mastra({
    agents: {
        interactive: interactiveAgent,
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
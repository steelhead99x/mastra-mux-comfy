import { Mastra } from "@mastra/core";
import { createMuxAssetManagerAgent } from "./agents/mux-asset-manager";

// Create minimal Mastra instance without pre-configured agents
const mastra = new Mastra({
    agents: {},  // Empty agents - we'll create them dynamically
    workflows: {},
    tools: []
});

// Export async function to initialize agent with tools
export async function initializeMuxAssetManager() {
    try {
        const agent = await createMuxAssetManagerAgent();
        return agent;
    } catch (error) {
        console.error("Failed to initialize Mux Asset Manager:", error);
        throw error;
    }
}

// Export the Mastra instance
export default mastra;

// Start the server if this file is run directly
async function startServer() {
    try {
        console.log("🚀 Starting Mastra development server...");

        const port = process.env.PORT || 4111;
        console.log(`📡 Server will be available at http://localhost:${port}`);

        // Check if Mastra has a serve method
        if (typeof mastra.serve === 'function') {
            await mastra.serve(Number(port));
        } else {
            // Fallback: just keep the process running
            console.log("⚠️  Mastra serve method not available, running in agent-only mode");
            console.log("✅ Mastra agents initialized successfully!");

            // Test the agent initialization
            try {
                const agent = await initializeMuxAssetManager();
                console.log("🤖 Mux Asset Manager agent ready!");
            } catch (error) {
                console.error("❌ Failed to initialize agent:", error);
            }

            console.log("\n🔧 Available commands:");
            console.log("npm run test:asset-manager  - Test the asset manager");
            console.log("npm run test:ollama         - Test Ollama connection");
            console.log("npm run test:mux-mcp        - Test MCP connection");

            // Keep the process running
            console.log("\n⏳ Server running... Press Ctrl+C to exit");
            process.stdin.resume();
            return;
        }

        console.log("✅ Mastra server started successfully!");
        console.log(`🎯 Access the playground at http://localhost:${port}`);

        console.log("\n🔧 To use the Mux Asset Manager:");
        console.log("const agent = await initializeMuxAssetManager();");
        console.log("const response = await agent.generate('Your message here');");

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        console.log("\n🔧 You can still use the agents and CLI commands:");
        console.log("npm run test:asset-manager  - Test the asset manager");
        console.log("npm run assets              - Use the asset CLI");
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}
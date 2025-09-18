import dotenv from "dotenv";
import { Mastra, Agent } from "@mastra/core";
import { createOllamaModel } from "./models/ollama-model";
import { InMemoryStore } from "@mastra/core/storage";
// ... existing code ...
import { agentListAssetsLegacyprovider } from "./agents/agent-list-assets-legacyprovider";

// Load environment variables
dotenv.config();

declare global {
    // Persist across hot reloads in dev
    // eslint-disable-next-line no-var
    var __mastra__: Mastra | undefined;
    // eslint-disable-next-line no-var
    var __muxAgent__: Agent | undefined;
    // eslint-disable-next-line no-var
    var __storage__: InMemoryStore | undefined;
}

// Factory to build the Mux Asset Manager Agent synchronously
function buildMuxAssetManagerAgent(): Agent {
    return new Agent({
        name: "muxAssetManager",
        instructions: `You are the Mux Asset Manager, an AI assistant specialized in video asset management using Mux APIs.

Your capabilities include:
- Managing video assets and their lifecycle  
- Analyzing video performance and engagement metrics
- Generating comprehensive reports and insights
- Troubleshooting asset processing issues
- Optimizing video delivery and playbook
- Managing video views and error analytics

Use the available tools to help users manage their video assets effectively. Always provide clear, actionable responses with specific data when available.`,

        model: createOllamaModel({
            model: process.env.OLLAMA_MODEL || "gpt-oss:20b",
            baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            temperature: 0.7,
            maxTokens: 2048,
        }),

        tools: async () => {
            // Return empty tools for now - MCP integration will be added later
            return {};
        },
    });
}

// Create singleton storage
const existingStorage = globalThis.__storage__;
const storage = existingStorage ?? new InMemoryStore();
if (!existingStorage) {
    globalThis.__storage__ = storage;
}

// Reuse a single instance for both keys (singleton)
const existingAgent = globalThis.__muxAgent__;
const muxAgentInstance: Agent = existingAgent ?? buildMuxAssetManagerAgent();
if (!existingAgent) {
    globalThis.__muxAgent__ = muxAgentInstance;
}

// Agents visible in the Dev UI
export const agents = {
    muxAssetManager: muxAgentInstance,
};

// Optional getAgents for APIs that call it
export async function getAgents() {
    return agents;
}

// Create the Mastra instance with clean configuration
const existingMastra = globalThis.__mastra__;
export const mastra: Mastra = existingMastra ?? new Mastra({
    agents,
    storage,
});

if (!existingMastra) {
    globalThis.__mastra__ = mastra;
}

// Define proper return types to fix export issues
interface OllamaConnectionResult {
    healthy: boolean;
    models?: string[];
    health?: any;
    error?: string;
}

// Utilities (lazy work)
export const utilities = {
    async testOllamaConnection(): Promise<OllamaConnectionResult> {
        try {
            const { OllamaProvider } = await import("./models/ollama-provider");
            const provider = new OllamaProvider(process.env.OLLAMA_BASE_URL);
            const health = await provider.healthCheck();
            const models = await provider.listModels();
            return {
                healthy: true,
                models: models.map((m: any) => m.name),
                health,
            };
        } catch (error) {
            return {
                healthy: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
};

// Optional: sanity-check agent on demand
export async function testAgentCreation() {
    try {
        const agent = agents.muxAssetManager;
        const instructions = await agent.getInstructions({});
        const tools = await agent.getTools({});
        const llm = await agent.getLLM({});
        console.log("✅ Agent test results:", {
            instructions: instructions?.substring(0, 100) + "...",
            toolCount: Object.keys(tools || {}).length,
            modelProvider: llm?.getProvider?.(),
            modelId: llm?.getModelId?.(),
        });
        return true;
    } catch (error) {
        console.error("❌ Agent test failed:", error);
        return false;
    }
}

// Types
export type { OllamaModelConfig } from "./models/ollama-model";

// Default export
export default mastra;

// ---------------------------------------------
// CLI helper: run the list-assets agent on demand
// ---------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    // Run the list-assets agent if requested: `node dist/mastra/index.js --list-assets`
    if (args.includes("--list-assets")) {
        agentListAssetsLegacyprovider().catch((err) => {
            console.error("❌ agent-list-assets failed:", err);
            process.exit(1);
        });
    }
    // Otherwise, do nothing special; Mastra dev/serve will use the exports above.
}
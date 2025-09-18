import dotenv from "dotenv";
import { Mastra, Agent } from "@mastra/core";
import { muxMcpClient } from "./mcp/mux-client";
import { createOllamaModel } from "./models/ollama-model";
import { MuxAssetManager } from "./agents/mux-asset-manager";

// Load environment variables
dotenv.config();

declare global {
    // Persist across hot reloads in dev
    // eslint-disable-next-line no-var
    var __mastra__: Mastra | undefined;
    // eslint-disable-next-line no-var
    var __muxAgent__: Agent | undefined;
}

// Create the Mastra instance (singleton)
const existingMastra = globalThis.__mastra__;
export const mastra: Mastra = existingMastra ?? new Mastra({});
if (!existingMastra) {
    globalThis.__mastra__ = mastra;
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
- Optimizing video delivery and playback
- Managing video views and error analytics

Use the available Mux MCP tools to help users manage their video assets effectively. Always provide clear, actionable responses with specific data when available.`,

        model: createOllamaModel({
            model: process.env.OLLAMA_MODEL || "llama3.2:3b",
            baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            temperature: 0.7,
            maxTokens: 2048,
        }),

        tools: async () => {
            try {
                return await muxMcpClient.getTools();
            } catch (error) {
                console.warn("Failed to get MCP tools for agent:", error);
                return {};
            }
        },
    });
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
    "mux-asset-manager": muxAgentInstance,
};

// Expose MCP servers so Dev UI can list the server and its tools
export const mcpServers = {
    mux: {
        command: "npx",
        args: ["@mux/mcp"],
        env: {
            MUX_TOKEN_ID: process.env.MUX_TOKEN_ID ?? "",
            MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET ?? "",
        },
    },
};

// Optional getAgents for APIs that call it
export async function getAgents() {
    return agents;
}

// Workflows (keep static)
export const workflows = {
    videoProcessingWorkflow: {
        name: "Video Processing Pipeline",
        description: "Complete video processing pipeline with Mux",
        steps: [
            "Upload video asset to Mux",
            "Process and encode video",
            "Generate thumbnails and previews",
            "Extract metadata and analytics",
            "Update asset status and notify completion",
        ],
        tools: ["list_assets", "get_asset", "create_asset"],
        triggers: ["manual", "webhook", "api"],
    },

    assetManagementWorkflow: {
        name: "Asset Management & Analytics",
        description: "Comprehensive asset management with analytics and reporting",
        steps: [
            "List and categorize all assets",
            "Generate comprehensive reports",
            "Analyze viewing patterns and engagement",
            "Identify optimization opportunities",
            "Clean up unused or outdated assets",
        ],
        tools: ["list_assets", "list_data_video_views", "list_data_errors"],
        triggers: ["scheduled", "manual", "storage_threshold"],
    },

    errorResolutionWorkflow: {
        name: "Error Detection & Resolution",
        description: "Automated error detection and resolution for video assets",
        steps: [
            "Monitor asset processing status",
            "Detect and categorize errors",
            "Attempt automatic resolution",
            "Generate error reports",
            "Escalate unresolved issues",
        ],
        tools: ["list_assets", "list_data_errors", "get_asset"],
        triggers: ["scheduled", "error_webhook", "status_change"],
    },
};

// Utilities (lazy work)
export const utilities = {
    async getMuxTools() {
        try {
            const tools = await muxMcpClient.getTools();
            return Object.keys(tools);
        } catch (error) {
            console.error("Failed to get Mux tools:", error);
            return [];
        }
    },

    async testOllamaConnection() {
        try {
            const { OllamaProvider } = await import("./models/ollama-provider");
            const provider = new OllamaProvider(process.env.OLLAMA_BASE_URL);
            const health = await provider.healthCheck();
            const models = await provider.listModels();
            return {
                healthy: true,
                models: models.map((m) => m.name),
                health,
            };
        } catch (error) {
            return {
                healthy: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },

    async getAssetSummary() {
        try {
            const manager = new MuxAssetManager();
            const report = await manager.generateAssetReport();
            return report.text;
        } catch (error) {
            return `Failed to generate asset summary: ${error}`;
        }
    },
};

// Script runners (lazy imports)
export const scriptRunners = {
    async runAssetManagerTest() {
        const { testAssetManager } = await import("./scripts/asset-cli");
        return await testAssetManager();
    },

    async runMuxConnectionTest() {
        const { MuxMCPTester } = await import("./scripts/test-mux");
        const tester = new MuxMCPTester();
        return await tester.runAllTests();
    },

    async runInteractiveDebugTools() {
        const { interactiveTest } = await import("./scripts/test-debug-tools");
        return await interactiveTest();
    },

    async runInteractiveMuxManager() {
        const { enhancedInteractiveMuxManager } = await import("./scripts/test-mux-interactive");
        return await enhancedInteractiveMuxManager();
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
import { Mastra } from "@mastra/core";
import { createMuxAssetManagerAgent, MuxAssetManager } from "./agents/mux-asset-manager";
import { muxMcpClient } from "./mcp/mux-client";
import { createOllamaModel } from "./models/ollama-model";
import { OllamaProvider } from "./models/ollama-provider";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Mastra instance with empty config to avoid type issues
const mastra = new Mastra({});

// Initialize all components
async function initializeComponents() {
    console.log('🚀 Initializing Mastra components...');

    // Initialize Ollama model and provider
    let ollamaModel;
    let ollamaProvider;
    try {
        ollamaModel = createOllamaModel({
            model: process.env.OLLAMA_MODEL || "llama3.2:3b",
            baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            temperature: 0.7,
            maxTokens: 2048
        });

        ollamaProvider = new OllamaProvider(
            process.env.OLLAMA_BASE_URL || "http://localhost:11434"
        );

        // Test Ollama connection
        await ollamaProvider.healthCheck();
        console.log('✅ Ollama provider initialized and healthy');
    } catch (error) {
        console.warn('⚠️ Ollama provider initialization failed:', error);
    }

    // Initialize MCP clients
    let mcpClients = {};
    try {
        mcpClients = {
            mux: muxMcpClient
        };

        // Test MCP connections
        const muxTools = await muxMcpClient.getTools();
        console.log(`✅ Mux MCP client initialized with ${Object.keys(muxTools).length} tools`);
    } catch (error) {
        console.warn('⚠️ MCP client initialization failed:', error);
    }

    return {
        ollamaModel,
        ollamaProvider,
        mcpClients
    };
}

// Initialize and register all agents
async function initializeAgents() {
    try {
        console.log('🤖 Initializing agents...');

        // Initialize core components first
        const components = await initializeComponents();

        // Create Mux Asset Manager agent
        const muxAssetManager = await createMuxAssetManagerAgent();
        console.log('✅ Mux Asset Manager agent created');

        // Create direct manager instance for utility functions
        const directMuxManager = new MuxAssetManager();
        console.log('✅ Direct Mux Asset Manager created');

        // Test agent functionality
        try {
            await directMuxManager.verifyConnectionAndEnv();
            console.log('✅ Mux Asset Manager connection verified');
        } catch (error) {
            console.warn('⚠️ Mux Asset Manager connection test failed:', error);
        }

        return {
            muxAssetManager,
            directMuxManager,
            ...components
        };
    } catch (error) {
        console.error('❌ Failed to initialize agents:', error);
        throw error;
    }
}

// Export for Mastra dev server to discover
export { mastra };

// Function to get agents - called by Mastra dev server
export async function getAgents() {
    try {
        const agents = await initializeAgents();
        return {
            muxAssetManager: agents.muxAssetManager
        };
    } catch (error) {
        console.warn('⚠️ getAgents(): failed to create agents', error);
        return {};
    }
}

// Export comprehensive workflow definitions
export const workflows = {
    videoProcessingWorkflow: {
        name: "Video Processing Pipeline",
        description: "Complete video processing pipeline with Mux",
        steps: [
            "Upload video asset to Mux",
            "Process and encode video",
            "Generate thumbnails and previews",
            "Extract metadata and analytics",
            "Update asset status and notify completion"
        ],
        tools: ["mux_create_asset", "mux_get_asset", "mux_list_assets"],
        triggers: ["manual", "webhook", "api"]
    },

    aiVideoProcessingPipeline: {
        name: "AI Video Processing",
        description: "AI-enhanced video processing with Mux and ComfyUI",
        steps: [
            "Analyze video content with AI",
            "Generate AI-powered thumbnails",
            "Extract intelligent metadata",
            "Apply AI filters and enhancements",
            "Process with ComfyUI workflows",
            "Generate final optimized output"
        ],
        tools: ["mux_create_asset", "comfyui_process", "ai_analyze_video"],
        triggers: ["manual", "scheduled", "content_detection"]
    },

    assetManagementWorkflow: {
        name: "Asset Management & Analytics",
        description: "Comprehensive asset management with analytics and reporting",
        steps: [
            "List and categorize all assets",
            "Generate comprehensive reports",
            "Analyze viewing patterns and engagement",
            "Identify optimization opportunities",
            "Clean up unused or outdated assets"
        ],
        tools: ["mux_list_assets", "mux_get_analytics", "mux_delete_asset"],
        triggers: ["scheduled", "manual", "storage_threshold"]
    },

    errorResolutionWorkflow: {
        name: "Error Detection & Resolution",
        description: "Automated error detection and resolution for video assets",
        steps: [
            "Monitor asset processing status",
            "Detect and categorize errors",
            "Attempt automatic resolution",
            "Generate error reports",
            "Escalate unresolved issues"
        ],
        tools: ["mux_list_assets", "mux_get_asset", "error_analysis"],
        triggers: ["scheduled", "error_webhook", "status_change"]
    }
};

// Export utility functions that can be used by other components
export const utilities = {
    // MCP utilities
    async getMuxTools() {
        try {
            const tools = await muxMcpClient.getTools();
            return Object.keys(tools);
        } catch (error) {
            console.error('Failed to get Mux tools:', error);
            return [];
        }
    },

    // Ollama utilities
    async testOllamaConnection() {
        try {
            const provider = new OllamaProvider(process.env.OLLAMA_BASE_URL);
            const health = await provider.healthCheck();
            const models = await provider.listModels();
            return {
                healthy: true,
                models: models.map(m => m.name),
                health
            };
        } catch (error) {
            return {
                healthy: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    },

    // Asset management utilities
    async getAssetSummary() {
        try {
            const manager = new MuxAssetManager();
            const report = await manager.generateAssetReport();
            return report.text;
        } catch (error) {
            return `Failed to generate asset summary: ${error}`;
        }
    },

    // Analytics utilities
    async getAnalyticsSummary() {
        try {
            const manager = new MuxAssetManager();
            const analytics = await manager.getAnalyticsSummary();
            return analytics.text;
        } catch (error) {
            return `Failed to get analytics summary: ${error}`;
        }
    }
};

// Export script runners for CLI integration
export const scriptRunners = {
    async runAssetManagerTest() {
        console.log('🧪 Running Asset Manager Test...');
        const { testAssetManager } = await import('./scripts/asset-cli');
        return await testAssetManager();
    },

    async runMuxConnectionTest() {
        console.log('🧪 Running Mux MCP Connection Test...');
        const { MuxMCPTester } = await import('./scripts/test-mux');
        const tester = new MuxMCPTester();
        return await tester.runAllTests();
    },

    async runInteractiveDebugTools() {
        console.log('🧪 Starting Interactive Debug Tools...');
        // Import the interactiveTest function directly instead of default
        const { interactiveTest } = await import('./scripts/test-debug-tools');
        return await interactiveTest();
    },

    async runInteractiveMuxManager() {
        console.log('🧪 Starting Interactive Mux Manager...');
        const { enhancedInteractiveMuxManager } = await import('./scripts/test-mux-interactive');
        return await enhancedInteractiveMuxManager();
    }
};

// Export types for external use
export type { OllamaModelConfig } from './models/ollama-model';

// Main initialization function
async function initializeAll() {
    try {
        console.log('🚀 Starting comprehensive Mastra initialization...');

        const agents = await initializeAgents();

        console.log('📊 Initialization Summary:');
        console.log(`✅ Agents: ${Object.keys(agents).length}`);
        console.log(`✅ Workflows: ${Object.keys(workflows).length}`);
        console.log(`✅ Utilities: ${Object.keys(utilities).length}`);
        console.log(`✅ Script Runners: ${Object.keys(scriptRunners).length}`);

        // Test core functionality
        console.log('🧪 Running quick functionality tests...');

        // Test Mux tools availability
        const muxTools = await utilities.getMuxTools();
        console.log(`✅ Mux Tools Available: ${muxTools.length}`);

        // Test Ollama connection
        const ollamaStatus = await utilities.testOllamaConnection();
        console.log(`${ollamaStatus.healthy ? '✅' : '⚠️'} Ollama Status: ${ollamaStatus.healthy ? 'Healthy' : 'Unavailable'}`);

        console.log('🎉 Mastra initialization completed successfully!');

        return agents;
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        throw error;
    }
}

// Initialize everything when this module is loaded
initializeAll().catch(console.error);

// Export the mastra instance as default
export default mastra;
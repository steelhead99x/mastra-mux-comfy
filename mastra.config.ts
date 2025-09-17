import type { MastraConfig } from "@mastra/core";

export default {
    name: "mastra-mux-workflow",
    version: "1.0.0",
    workflows: {
        videoProcessingWorkflow: {
            description: "Complete video processing pipeline with Mux",
            trigger: "manual"
        }
    },
    agents: {
        videoProcessingAgent: {
            description: "AI agent for video processing operations"
        }
    },
    integrations: {
        mux: {
            type: "mcp",
            enabled: true
        }
    }
} satisfies MastraConfig;
import type { MastraConfig } from "@mastra/core";

export default {
    name: "mastra-mux-comfyui-workflow",
    version: "1.1.0",
    workflows: {
        videoProcessingWorkflow: {
            description: "Complete video processing pipeline with Mux",
            trigger: "manual"
        },
        aiVideoProcessingPipeline: {
            description: "AI-enhanced video processing with Mux and ComfyUI",
            trigger: "manual"
        }
    },
    agents: {
        videoProcessingAgent: {
            description: "AI agent for video processing operations"
        },
        aiVideoProcessingAgent: {
            description: "Advanced AI agent with Mux and ComfyUI integration"
        }
    },
    integrations: {
        mux: {
            type: "mcp",
            enabled: true
        },
        comfyui: {
            type: "mcp",
            enabled: true
        }
    }
} satisfies MastraConfig;
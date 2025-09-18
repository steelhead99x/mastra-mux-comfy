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
    // Note: Do not define plain objects under agents here unless they are actual Mastra Agent instances.
    // Leaving agents undefined allows constructing Mastra with this config safely across versions.
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
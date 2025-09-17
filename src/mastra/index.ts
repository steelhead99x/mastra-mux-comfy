import "dotenv/config";
import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { videoProcessingWorkflow } from "./workflows/video-processing";
import { videoProcessingAgent } from "./agents/video-agent";
import { muxMcpClient } from "./mcp/mux-client";

export const mastra = new Mastra({
    workflows: {
        videoProcessingWorkflow
    },
    agents: {
        videoProcessingAgent
    },
    mcpClients: {
        mux: muxMcpClient
    },
    server: {
        host: "0.0.0.0",
        port: parseInt(process.env.PORT || "4111"),
    },
    logger: new PinoLogger({
        name: "Mastra-Mux-Integration",
        level: "info"
    })
});

// Start the server if this file is run directly
if (require.main === module) {
    console.log("🚀 Starting Mastra server with Mux MCP integration...");
    mastra.serve();
}
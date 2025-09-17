import "dotenv/config";
import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { videoProcessingWorkflow } from "./workflows/video-processing";
import { videoProcessingAgent } from "./agents/video-agent";
import { muxMcpClient } from "./mcp/mux-client";
import { checkOllamaHealth, ensureModelExists } from "./utils/ollama-health";

async function initializeServer() {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://192.168.88.16:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "gpt-oss:20b";

  console.log("🔍 Checking Ollama server health...");
  const healthCheck = await checkOllamaHealth(ollamaBaseUrl);
  
  if (!healthCheck.isHealthy) {
    console.error("❌ Ollama server is not healthy:", healthCheck.error);
    console.error("Please ensure Ollama is running at:", ollamaBaseUrl);
    process.exit(1);
  }

  console.log("✅ Ollama server is healthy");
  console.log("📋 Available models:", healthCheck.models.join(", "));

  const modelExists = await ensureModelExists(ollamaModel, ollamaBaseUrl);
  if (!modelExists) {
    console.error(`❌ Model ${ollamaModel} not found on Ollama server`);
    console.error(`Please pull the model: ollama pull ${ollamaModel}`);
    process.exit(1);
  }

  console.log(`✅ Model ${ollamaModel} is available`);

  return new Mastra({
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
      name: "Mastra-Mux-Ollama-Integration",
      level: "info"
    })
  });
}

// Initialize and export mastra instance
export const mastra = await initializeServer();

// Start the server if this file is run directly
if (require.main === module) {
  console.log("🚀 Starting Mastra server with Mux MCP and Ollama integration...");
  console.log(`📡 Using Ollama at: ${process.env.OLLAMA_BASE_URL || "http://192.168.88.16:11434"}`);
  console.log(`🧠 Model: ${process.env.OLLAMA_MODEL || "gpt-oss:20b"}`);
  mastra.serve();
}
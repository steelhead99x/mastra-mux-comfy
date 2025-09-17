import { MCPClient } from "@mastra/mcp";

export const comfyUiMcpClient = new MCPClient({
    id: "comfyui-mcp-client",
    servers: {
        comfyui: {
            command: "python",
            args: ["-m", "comfy_mcp_server", "--transport", "stdio"],
            env: {
                COMFYUI_URL: process.env.COMFYUI_URL || "http://localhost:8188",
                COMFYUI_EXTERNAL_URL: process.env.COMFYUI_EXTERNAL_URL || process.env.COMFYUI_URL || "http://localhost:8188"
            }
        }
    }
});
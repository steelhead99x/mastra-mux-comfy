
import { MCPClient } from "@mastra/mcp";

// Create and configure the Mux MCP client
export const muxMcpClient = new MCPClient({
    id: "mux-mcp-client",
    servers: {
        mux: {
            command: "npx",
            args: ["@mux/mcp"],
            env: {
                MUX_TOKEN_ID: process.env.MUX_TOKEN_ID ?? "",
                MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET ?? "",
            }
        }
    }
});

export default muxMcpClient;
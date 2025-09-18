import dotenv from "dotenv";
dotenv.config();
import { MCPClient } from "@mastra/mcp";

export const muxMcpClient = new MCPClient({
    id: "mux-mcp-client",
    servers: {
        mux: {
            command: "npx",
            // Run the Mux MCP package in stdio server mode (default).
            args: ["-y", "@mux/mcp@latest"],
            env: {
                // Ensure all Mux auth uses Token ID/Secret
                MUX_TOKEN_ID: process.env.MUX_TOKEN_ID!,
                MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET!
            }
        }
    }
});
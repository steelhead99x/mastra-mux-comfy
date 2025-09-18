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
                MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET!,
                // Optional passthroughs to help target the correct environment/base URL
                ...(process.env.MUX_ENVIRONMENT ? { MUX_ENVIRONMENT: process.env.MUX_ENVIRONMENT } : {}),
                ...(process.env.MUX_BASE_URL ? { MUX_BASE_URL: process.env.MUX_BASE_URL } : {}),
                ...(process.env.MUX_DEBUG ? { MUX_DEBUG: process.env.MUX_DEBUG } : {})
            }
        }
    }
});
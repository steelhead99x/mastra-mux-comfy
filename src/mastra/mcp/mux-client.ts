import { MCPClient } from "@mastra/mcp";

declare global {
  // Persist the client across hot reloads
  // eslint-disable-next-line no-var
  var __muxMcpClient__: MCPClient | undefined;
}

// Create and configure a singleton Mux MCP client
const existing = globalThis.__muxMcpClient__;
export const muxMcpClient: MCPClient = existing ?? new MCPClient({
  id: "mux-mcp-client",
  servers: {
    mux: {
      command: "npx",
      args: ["@mux/mcp"],
      env: {
        MUX_TOKEN_ID: process.env.MUX_TOKEN_ID ?? "",
        MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET ?? "",
      },
    },
  },
});

if (!existing) {
  globalThis.__muxMcpClient__ = muxMcpClient;
}

export default muxMcpClient;
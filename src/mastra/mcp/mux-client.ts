import { MCPClient } from "@mastra/mcp";

export const muxMcpClient = new MCPClient({
    id: "mux-mcp-client",
    servers: {
        mux: {
            command: "npx",
            args: ["-y", "@mux/mcp@latest", "--client=openai-agents", "--tools=dynamic"],
            env: {
                MUX_TOKEN_ID: process.env.MUX_TOKEN_ID!,
                MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET!,
                MUX_WEBHOOK_SECRET: process.env.MUX_WEBHOOK_SECRET!,
                MUX_SIGNING_KEY: process.env.MUX_SIGNING_KEY!,
                MUX_PRIVATE_KEY: process.env.MUX_PRIVATE_KEY!,
                MUX_AUTHORIZATION_TOKEN: process.env.MUX_AUTHORIZATION_TOKEN!
            }
        }
    }
});
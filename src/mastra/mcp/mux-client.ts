import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class MuxMCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private connected = false;
    private connecting = false; // Add flag to prevent double connection

    private async ensureConnected(): Promise<void> {
        if (this.connected && this.client) {
            return;
        }

        // Prevent multiple connection attempts
        if (this.connecting) {
            // Wait for the current connection attempt to complete
            while (this.connecting && !this.connected) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.connecting = true;

        try {
            // Verify environment variables are present
            if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
                throw new Error("Missing required environment variables: MUX_TOKEN_ID and MUX_TOKEN_SECRET");
            }

            console.log("🔗 Connecting to Mux MCP server...");
            console.log(`   MUX_TOKEN_ID: ${process.env.MUX_TOKEN_ID.substring(0, 8)}***`);
            console.log(`   MUX_TOKEN_SECRET: ${process.env.MUX_TOKEN_SECRET.substring(0, 8)}***`);

            // Create transport with explicit environment variables
            this.transport = new StdioClientTransport({
                command: "npx",
                args: ["@mux/mcp"],
                env: {
                    ...process.env,  // Pass all current environment variables
                    MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
                    MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
                },
            });

            // Create client
            this.client = new Client(
                {
                    name: "mux-mastra-client",
                    version: "1.0.0",
                },
                {
                    capabilities: {},
                }
            );

            // Connect client to transport (this automatically calls start())
            await this.client.connect(this.transport);

            this.connected = true;
            console.log("✅ Connected to Mux MCP server successfully");

        } catch (error) {
            console.error("❌ Failed to connect to Mux MCP server:", error);
            this.connected = false;
            throw error;
        } finally {
            this.connecting = false;
        }
    }

    async getTools(): Promise<Record<string, any>> {
        await this.ensureConnected();
        
        if (!this.client) {
            throw new Error("Client not connected");
        }

        try {
            const result = await this.client.listTools();
            const tools: Record<string, any> = {};

            if (result?.tools) {
                for (const tool of result.tools) {
                    tools[tool.name] = {
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                        call: async (args: any) => {
                            if (!this.client) {
                                throw new Error("Client not connected");
                            }
                            return await this.client.callTool({
                                name: tool.name,
                                arguments: args || {},
                            });
                        },
                    };
                }
            }

            return tools;
        } catch (error) {
            console.error("❌ Failed to get tools:", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        
        if (this.transport) {
            try {
                await this.transport.close();
            } catch (error) {
                console.warn("Warning during transport close:", error);
            }
            this.transport = null;
        }
        
        this.client = null;
        console.log("🔌 Disconnected from Mux MCP server");
    }

    isConnected(): boolean {
        return this.connected;
    }

    // Method to reset connection state (useful for debugging)
    async reset(): Promise<void> {
        await this.disconnect();
        this.connecting = false;
        await this.ensureConnected();
    }
}

// Create and export a singleton instance
export const muxMcpClient = new MuxMCPClient();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    try {
        await muxMcpClient.disconnect();
    } catch (error) {
        // Ignore errors during shutdown
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    try {
        await muxMcpClient.disconnect();
    } catch (error) {
        // Ignore errors during shutdown
    }
    process.exit(0);
});
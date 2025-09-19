// TypeScript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import dotenv from "dotenv";
import { z } from "zod";
import { createTool } from "@mastra/core/tools";

// Load environment variables
dotenv.config();

class MuxMCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private connected = false;
    private connecting = false;

    private async ensureConnected(): Promise<void> {
        if (this.connected && this.client) {
            return;
        }

        if (this.connecting) {
            while (this.connecting && !this.connected) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        // Validate environment before attempting connection to avoid locally caught throw
        if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
            throw new Error("Missing required environment variables: MUX_TOKEN_ID and MUX_TOKEN_SECRET");
        }

        // Parse MCP args from environment variable
        const mcpArgs = process.env.MUX_MCP_DATA_ARGS
            ? process.env.MUX_MCP_DATA_ARGS.split(',').map(arg => arg.trim())
            : ["@mux/mcp", "client=openai-agents", "--tools=dynamic", "--resource=video.assets"];

        this.connecting = true;

        try {
            console.log("🔗 Connecting to Mux MCP server...");
            console.log(`   MUX_TOKEN_ID: ${process.env.MUX_TOKEN_ID.substring(0, 8)}***`);
            console.log(`   MUX_TOKEN_SECRET: ${process.env.MUX_TOKEN_SECRET.substring(0, 8)}***`);
            console.log(`   MCP Args: ${mcpArgs.join(' ')}`);

            this.transport = new StdioClientTransport({
                command: "npx",
                args: mcpArgs,
                env: {
                    ...process.env,
                    MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
                    MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
                },
            });

            this.client = new Client(
                {
                    name: "mux-mastra-client",
                    version: "1.0.0",
                },
                {
                    capabilities: {},
                }
            );

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

    // Convert MCP tools to proper Mastra tools using createTool
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
                    try {
                        // Create a proper Mastra tool using createTool
                        tools[tool.name] = createTool({
                            id: tool.name,
                            description: tool.description || `Mux MCP tool: ${tool.name}`,
                            inputSchema: this.convertToZodSchema(tool.inputSchema),
                            execute: async ({ context }) => {
                                if (!this.client) {
                                    throw new Error("Client not connected");
                                }

                                console.log(`🔧 Calling MCP tool: ${tool.name} with context:`, context);

                                const result = await this.client.callTool({
                                    name: tool.name,
                                    arguments: context || {},
                                });

                                return result.content;
                            },
                        });
                    } catch (toolError) {
                        console.warn(`Skipping tool ${tool.name} due to error:`, toolError);
                    }
                }
            }

            console.log(`🛠️ Successfully created ${Object.keys(tools).length} Mastra tools from MCP`);
            return tools;
        } catch (error) {
            console.error("❌ Failed to get tools:", error);
            throw error;
        }
    }

    // Convert MCP input schema to Zod schema
    private convertToZodSchema(inputSchema: any): z.ZodSchema {
        if (!inputSchema || typeof inputSchema !== 'object') {
            return z.object({});
        }

        try {
            // Handle JSON Schema to Zod conversion
            if (inputSchema.type === 'object' && inputSchema.properties) {
                const schemaObject: Record<string, z.ZodTypeAny> = {};

                for (const [key, value] of Object.entries(inputSchema.properties)) {
                    const prop = value as any;
                    let zodType: z.ZodTypeAny = z.string();

                    // Convert based on JSON Schema type
                    switch (prop.type) {
                        case 'string':
                            zodType = z.string();
                            break;
                        case 'number':
                        case 'integer':
                            zodType = z.number();
                            break;
                        case 'boolean':
                            zodType = z.boolean();
                            break;
                        case 'array':
                            zodType = z.array(z.any());
                            break;
                        case 'object':
                            zodType = z.object({});
                            break;
                        default:
                            zodType = z.any();
                    }

                    // Add description if available
                    if (prop.description) {
                        zodType = zodType.describe(prop.description);
                    }

                    // Make optional if not required
                    const required = inputSchema.required || [];
                    if (!required.includes(key)) {
                        zodType = zodType.optional();
                    }

                    schemaObject[key] = zodType;
                }

                return z.object(schemaObject);
            }
        } catch (error) {
            console.warn("Failed to convert schema, using fallback:", error);
        }

        // Fallback schema
        return z.object({
            id: z.string().optional().describe("Resource ID"),
            limit: z.number().optional().describe("Number of items to return"),
            offset: z.number().optional().describe("Number of items to skip"),
        });
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
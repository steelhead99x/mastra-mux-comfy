// TypeScript
import { Agent } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { anthropicModel, anthropicGenerateText } from "../models/anthropic-model";
import { muxMcpClient } from "../mcp/mux-client";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import readline from "readline";

console.log("Creating Anthropic dynamic agent...");

// Create embedding provider (using Ollama for embeddings since Anthropic doesn't provide embeddings)
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const ollamaProvider = createOpenAICompatible({
    name: "ollama",
    baseURL: OLLAMA_BASE_URL,
});

// Create memory for the agent to store conversation context
const agentMemory = new Memory({
    storage: new LibSQLStore({
        url: "file:./anthropic-agent-memory.db", // Separate database for Anthropic agent
    }),
    vector: new LibSQLVector({
        connectionUrl: "file:./anthropic-agent-memory.db",
    }),
    embedder: ollamaProvider.textEmbeddingModel("embeddinggemma:300m"), // Use Ollama for embeddings
    options: {
        workingMemory: {
            enabled: true,
        },
        semanticRecall: {
            topK: 8,
            messageRange: 15,
            scope: 'thread',
        },
    },
});

/**
 * Dynamic Anthropic Agent with Mux MCP integration
 * Features:
 * - Claude 3.5 Sonnet model
 * - Dynamic tool loading from Mux MCP
 * - Persistent memory with conversation history
 * - Advanced reasoning capabilities
 */
export const anthropicDynamicAgent = new Agent({
    name: "anthropic-dynamic",
    instructions: `You are an advanced AI assistant powered by Claude 3.5 Sonnet with access to Mux video platform tools via MCP.

Key capabilities:
- Video asset management through Mux MCP tools
- Persistent conversation memory across sessions
- Advanced reasoning and analysis
- Real-time tool discovery and usage

You can help with:
- Listing and searching video assets
- Checking asset processing status
- Analyzing video metadata and reports
- Managing video playback configurations
- Providing detailed insights about video workflows

Be conversational, helpful, and leverage your tools effectively. Reference previous conversations when relevant.`,

    model: anthropicModel,
    memory: agentMemory,

    // Dynamic tool loading from Mux MCP
    tools: async () => {
        try {
            console.log("🔧 Loading Mux MCP tools for Anthropic agent...");
            const tools = await muxMcpClient.getTools();
            console.log(`✅ Loaded ${Object.keys(tools).length} tools for Anthropic agent`);

            // Log available tools for debugging
            if (Object.keys(tools).length > 0) {
                console.log("🛠️ Available tools:", Object.keys(tools).join(', '));
            }

            return tools;
        } catch (err) {
            console.error("[anthropicDynamicAgent] Failed to load MCP tools:", err);
            return {};
        }
    },
});

console.log("✅ Anthropic dynamic agent created successfully:", anthropicDynamicAgent.name);

/**
 * Interactive runner for the Anthropic dynamic agent
 * Provides both agent mode and direct Claude mode
 */
export async function runAnthropicDynamicAgent(): Promise<void> {
    console.log("🚀 Starting Anthropic dynamic agent session...");

    // Validate environment
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error("❌ ANTHROPIC_API_KEY environment variable is required");
        console.log("\n💡 Troubleshooting tips:");
        console.log("   • Check ANTHROPIC_API_KEY environment variable");
        console.log("   • Verify Mux credentials (MUX_TOKEN_ID, MUX_TOKEN_SECRET)");
        console.log("   • Ensure Ollama is running for embeddings");
        return;
    }

    try {
        // Initialize MCP client and load tools
        console.log("🔧 Initializing Mux MCP connection...");
        const tools = await muxMcpClient.getTools();
        console.log(`✅ Connected to Mux MCP with ${Object.keys(tools).length} tools available`);

        if (Object.keys(tools).length > 0) {
            console.log("🛠️ Available Mux tools:", Object.keys(tools).join(', '));
        }

        console.log("🤖 Anthropic dynamic agent is ready!");
        console.log(`   Model: ${process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'}`);
        console.log(`   Memory: Persistent storage enabled`);
        console.log(`   Tools: ${Object.keys(tools).length} Mux MCP tools loaded`);

        // Create readline interface
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n" + "=".repeat(60));
        console.log("🎬 ANTHROPIC DYNAMIC AGENT - MUX MCP INTEGRATION");
        console.log("=".repeat(60));
        console.log("Commands:");
        console.log("  • Type your message to chat with the agent");
        console.log("  • 'direct' - Switch to direct Claude mode");
        console.log("  • 'tools' - List available tools");
        console.log("  • 'status' - Check connection status");
        console.log("  • 'reset' - Reset MCP connection");
        console.log("  • 'exit' - Quit the session");
        console.log("=".repeat(60) + "\n");

        let directMode = false;
        let conversationCount = 0;

        const askQuestion = (): Promise<string> => {
            return new Promise((resolve) => {
                const prompt = directMode ? "🔧 Claude> " : "🎬 Agent> ";
                rl.question(prompt, resolve);
            });
        };

        while (true) {
            try {
                const userInput = await askQuestion();

                // Handle commands
                if (userInput.toLowerCase().trim() === 'exit') {
                    console.log("👋 Goodbye! Anthropic session ended.");
                    break;
                }

                if (userInput.toLowerCase().trim() === 'direct') {
                    directMode = !directMode;
                    const modeMsg = directMode
                        ? '🔧 Switched to direct Claude mode (no memory, no tools)'
                        : '🎬 Switched back to Anthropic Agent mode (with memory & tools)';
                    console.log(modeMsg);
                    continue;
                }

                if (userInput.toLowerCase().trim() === 'tools') {
                    const currentTools = await muxMcpClient.getTools();
                    console.log(`\n🛠️ Available tools (${Object.keys(currentTools).length}):`);
                    Object.keys(currentTools).forEach((toolName, index) => {
                        console.log(`   ${index + 1}. ${toolName}`);
                    });
                    console.log("");
                    continue;
                }

                if (userInput.toLowerCase().trim() === 'status') {
                    const connected = muxMcpClient.isConnected();
                    const currentTools = await muxMcpClient.getTools();
                    console.log(`\n📊 Connection Status:`);
                    console.log(`   MCP Connected: ${connected ? '✅' : '❌'}`);
                    console.log(`   Tools Available: ${Object.keys(currentTools).length}`);
                    console.log(`   Conversations: ${conversationCount}`);
                    console.log(`   Mode: ${directMode ? 'Direct Claude' : 'Agent with Memory'}`);
                    console.log("");
                    continue;
                }

                if (userInput.toLowerCase().trim() === 'reset') {
                    console.log("🔄 Resetting MCP connection...");
                    await muxMcpClient.reset();
                    const newTools = await muxMcpClient.getTools();
                    console.log(`✅ Reset complete. ${Object.keys(newTools).length} tools loaded.`);
                    continue;
                }

                if (!userInput.trim()) continue;

                conversationCount++;
                console.log(`\n[${new Date().toLocaleTimeString()}] Processing request ${conversationCount}...`);

                if (directMode) {
                    // Direct Claude mode without tools or memory
                    console.log("🔧 Using direct Claude mode...");

                    const result = await anthropicGenerateText(userInput, {
                        temperature: 0.1,
                        maxTokens: 4096,
                        system: "You are Claude, an AI assistant created by Anthropic. Be helpful, harmless, and honest."
                    });

                    console.log("\n📝 Claude Response:");
                    console.log(result.text);

                } else {
                    // Full agent mode with tools and memory
                    console.log("🎬 Using Anthropic Agent with tools and memory...");

                    const response = await anthropicDynamicAgent.generateVNext(
                        [{ role: "user", content: userInput }],
                        {
                            temperature: 0.1,
                            maxTokens: 4096,
                        }
                    );

                    console.log("\n📝 Agent Response:");
                    console.log(response.text);

                    // Show tool usage if any
                    if (Array.isArray(response.toolCalls) && response.toolCalls.length > 0) {
                        console.log(`\n🛠️ Tools Used (${response.toolCalls.length}):`);
                        response.toolCalls.forEach((call, index) => {
                            console.log(`   ${index + 1}. ${call.toolName}`);
                            if (call.args && Object.keys(call.args).length > 0) {
                                console.log(`      Args:`, JSON.stringify(call.args, null, 2));
                            }
                        });
                    }
                }

                console.log("\n" + "-".repeat(40));

            } catch (error) {
                console.error("\n❌ Error processing request:", error);
                console.log("💡 Try 'status' to check connection or 'reset' to reconnect.");
                console.log("-".repeat(40));
            }
        }

        rl.close();

    } catch (error) {
        console.error("❌ Failed to start Anthropic dynamic agent:", error);
        console.log("\n💡 Troubleshooting tips:");
        console.log("   • Check ANTHROPIC_API_KEY environment variable");
        console.log("   • Verify Mux credentials (MUX_TOKEN_ID, MUX_TOKEN_SECRET)");
        console.log("   • Ensure Ollama is running for embeddings");
    }
}

/**
 * Utility function to test tool conversion for direct Claude usage
 */
export async function convertMastraToolsForClaude() {
    try {
        const mastraTools = await muxMcpClient.getTools();
        const claudeTools: Record<string, any> = {};

        for (const [toolName, mastraTool] of Object.entries(mastraTools)) {
            if (mastraTool && typeof mastraTool.execute === 'function') {
                claudeTools[toolName] = {
                    description: mastraTool.description || `Mux tool: ${toolName}`,
                    parameters: mastraTool.inputSchema || {},
                    execute: async (args: any) => {
                        console.log(`🔧 Executing ${toolName} with:`, args);
                        return await mastraTool.execute({ context: args });
                    }
                };
            }
        }

        return claudeTools;
    } catch (error) {
        console.error("Failed to convert tools for Claude:", error);
        return {};
    }
}

/**
 * Test direct Claude with Mux tools integration
 */
export async function testDirectClaudeWithMuxTools(prompt: string) {
    console.log("🧪 Testing direct Claude with Mux tools...");

    try {
        const tools = await convertMastraToolsForClaude();

        const result = await anthropicGenerateText(prompt, {
            temperature: 0.1,
            maxTokens: 4096,
            tools: Object.keys(tools).length > 0 ? tools : undefined,
            toolChoice: "auto",
            maxSteps: 3,
            system: "You are Claude with access to Mux video platform tools. Use them to help with video-related tasks."
        });

        return {
            response: result.text,
            toolCalls: result.toolCalls,
            toolResults: result.toolResults,
            usage: result.usage
        };

    } catch (error) {
        console.error("❌ Direct Claude test failed:", error);
        throw error;
    }
}

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAnthropicDynamicAgent().catch(console.error);
}
// TypeScript
import { Agent } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { ollamaModel, ollamaGenerateText, ollamaChat } from "../models/ollama-vnext";
import { muxMcpClient } from "../mcp/mux-client-data";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import readline from "readline";

console.log("Creating interactive agent...");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "embeddinggemma:300m";

// Create Ollama provider for embeddings
const ollamaProvider = createOpenAICompatible({
    name: "ollama",
    baseURL: OLLAMA_BASE_URL,
});

// Create memory for the agent to store conversation context
const agentMemory = new Memory({
    storage: new LibSQLStore({
        url: "file:./agent-memory.db", // Local SQLite file for memory storage
    }),
    vector: new LibSQLVector({
        connectionUrl: "file:./agent-memory.db", // Use the same database for vector storage
    }),
    embedder: ollamaProvider.textEmbeddingModel(EMBEDDING_MODEL), // Use configurable embedding model
    options: {
        workingMemory: {
            enabled: true,
        },
        semanticRecall: {
            topK: 6,
            messageRange: 10,
            scope: 'thread',
        },
    },
});

/**
 * Proper Mastra Agent instance for the dev UI.
 * This will appear in the Agents section of the dev server.
 */
export const interactiveAgent = new Agent({
    name: "ollama-mux-interactive-analytics", // Changed from "ollama-mux-interactive"
    instructions: "Interactive terminal agent using Ollama (gpt-oss:20b). You have memory of our conversation history. It can call Mux MCP tools (up to 10 summarized on startup). Ask about listing/searching assets, statuses, and reports. Avoid repeating yourself by referencing previous messages in our conversation.",
    model: ollamaModel,
    memory: agentMemory,
    tools: async () => {
        try {
            console.log("Loading tools for interactive agent...");
            const tools = await muxMcpClient.getTools();
            console.log(`Loaded ${Object.keys(tools).length} tools for interactive agent`);
            return tools;
        } catch (err) {
            console.error("[interactiveAgent] Failed to load MCP tools:", err);
            return {};
        }
    },
});

console.log("Interactive agent created successfully:", interactiveAgent.name);

/**
 * Enhanced interactive agent runner with proper tool integration
 * This function demonstrates both Mastra Agent usage and direct ollama-vnext usage
 */
export async function runInteractiveAgent(): Promise<void> {
    console.log("🤖 Starting interactive agent session...");

    try {
        // Initialize the MCP client and tools
        console.log("🔧 Loading MCP tools...");
        const tools = await muxMcpClient.getTools();
        console.log(`✅ Loaded ${Object.keys(tools).length} tools: ${Object.keys(tools).join(', ')}`);

        console.log("🚀 Interactive agent is ready! Agent name:", interactiveAgent.name);
        console.log("💡 Agent instructions:", interactiveAgent.instructions);

        // Create readline interface for terminal interaction
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n📝 Interactive agent session started. Type 'exit' to quit, 'direct' for direct ollama-vnext mode, or chat normally.");
        console.log("🎯 In direct mode, you can test tool calling with enhanced ollama-vnext functions.\n");

        let directMode = false;

        const askQuestion = (): Promise<string> => {
            return new Promise((resolve) => {
                const prompt = directMode ? "🔧 Direct> " : "🤖 Agent> ";
                rl.question(prompt, resolve);
            });
        };

        while (true) {
            try {
                const userInput = await askQuestion();

                if (userInput.toLowerCase().trim() === 'exit') {
                    console.log("👋 Goodbye!");
                    break;
                }

                if (userInput.toLowerCase().trim() === 'direct') {
                    directMode = !directMode;
                    console.log(`${directMode ? '🔧 Switched to direct ollama-vnext mode' : '🤖 Switched back to Mastra Agent mode'}`);
                    continue;
                }

                if (!userInput.trim()) continue;

                if (directMode) {
                    // Direct ollama-vnext mode with tools - enhanced settings to reduce repetition
                    console.log("🔧 Processing with direct ollama-vnext...");

                    // Convert Mastra tools to AI SDK format for direct usage
                    const aiSdkTools: Record<string, any> = {};

                    for (const [toolName, mastraTool] of Object.entries(tools)) {
                        if (mastraTool && typeof mastraTool.execute === 'function') {
                            // Convert Mastra tool to AI SDK tool format with correct context wrapping
                            aiSdkTools[toolName] = {
                                description: mastraTool.description || `Tool: ${toolName}`,
                                parameters: mastraTool.inputSchema || {},
                                execute: async (args: any) => {
                                    // FIXED: Wrap arguments in context for Mastra tool execution
                                    return await mastraTool.execute({ context: args });
                                }
                            };
                        }
                    }

                    const result = await ollamaGenerateText(userInput, {
                        temperature: 0.3, // Lower temperature to reduce repetition
                        topP: 0.85, // Slightly more focused sampling
                        repeatPenalty: 1.15, // Higher repeat penalty to avoid repetition
                        frequencyPenalty: 0.2, // Penalize frequent tokens
                        presencePenalty: 0.15, // Encourage topic diversity
                        maxTokens: 6144, // Reasonable limit for gpt-oss:20b to avoid rambling
                        tools: Object.keys(aiSdkTools).length > 0 ? aiSdkTools : undefined,
                        toolChoice: Object.keys(aiSdkTools).length > 0 ? "auto" : "none",
                        maxSteps: 3,
                        stop: ["Human:", "User:", "Assistant:", "\n\nUser", "\n\nHuman"] // Stop sequences to prevent role confusion
                    });

                    console.log("📝 Response:", result.text);

                    if (result.toolCalls && result.toolCalls.length > 0) {
                        console.log("🛠️  Tool calls made:", result.toolCalls.length);
                        result.toolCalls.forEach((call, index) => {
                            console.log(`   ${index + 1}. ${call.toolName}:`, call.args);
                        });
                    }

                    if (result.toolResults && result.toolResults.length > 0) {
                        console.log("📊 Tool results:");
                        result.toolResults.forEach((result, index) => {
                            console.log(`   ${index + 1}.`, result);
                        });
                    }

                } else {
                    // Regular Mastra Agent mode - use only supported parameters
                    console.log("🤖 Processing with Mastra Agent...");

                    const response = await interactiveAgent.generate(
                        [{ role: "user", content: userInput }],
                        {
                            temperature: 0.3, // Lower temperature to reduce repetition
                            // Note: Mastra Agent doesn't support the enhanced parameters directly
                            // Those are only available in direct ollama-vnext calls
                        }
                    );

                    console.log("📝 Response:", response.text);

                    // Log any tool usage if available
                    if (response.toolCalls && response.toolCalls.length > 0) {
                        console.log("🛠️  Tools used:", response.toolCalls.map(call => call.toolName).join(", "));
                    }
                }

            } catch (error) {
                console.error("❌ Error processing message:", error);
            }
        }

        rl.close();

    } catch (error) {
        console.error("❌ Failed to start interactive agent:", error);
        throw error;
    }
}

/**
 * Utility function to demonstrate tool conversion between Mastra and AI SDK formats
 * This helps when you want to use Mastra tools with direct ollama-vnext calls
 */
export async function convertMastraToolsForOllama() {
    try {
        const mastraTools = await muxMcpClient.getTools();
        const aiSdkTools: Record<string, any> = {};

        for (const [toolName, mastraTool] of Object.entries(mastraTools)) {
            if (mastraTool && typeof mastraTool.execute === 'function') {
                aiSdkTools[toolName] = {
                    description: mastraTool.description || `Tool: ${toolName}`,
                    parameters: mastraTool.inputSchema || {},
                    execute: async (args: any) => {
                        // FIXED: Wrap Mastra tool execution with correct context parameter
                        return await mastraTool.execute({ context: args });
                    }
                };
            }
        }

        return aiSdkTools;
    } catch (error) {
        console.error("Failed to convert Mastra tools:", error);
        return {};
    }
}

/**
 * Example function showing how to use ollama-vnext directly with Mux tools
 * This demonstrates the enhanced tool support while keeping Mastra compatibility
 */
export async function testDirectOllamaWithTools(prompt: string) {
    console.log("🧪 Testing direct ollama-vnext with Mux tools...");

    try {
        const tools = await convertMastraToolsForOllama();

        const result = await ollamaChat([
            { role: "user", content: prompt }
        ], {
            temperature: 0.3, // Lower temperature for more focused responses
            topP: 0.85,
            repeatPenalty: 1.15, // Higher repeat penalty to reduce repetition
            frequencyPenalty: 0.2, // Penalize frequently used tokens
            presencePenalty: 0.15, // Encourage topic diversity
            maxTokens: 6144, // Good balance for gpt-oss:20b
            tools: Object.keys(tools).length > 0 ? tools : undefined,
            toolChoice: "auto",
            maxSteps: 3,
            stop: ["Human:", "User:", "Assistant:", "\n\nUser", "\n\nHuman"]
        });

        return {
            response: result.text,
            toolCalls: result.toolCalls,
            toolResults: result.toolResults,
            usage: result.usage
        };

    } catch (error) {
        console.error("❌ Direct ollama test failed:", error);
        throw error;
    }
}
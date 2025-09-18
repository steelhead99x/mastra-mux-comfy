import { MuxAssetManager } from "../agents/mux-asset-manager";
import dotenv from "dotenv";
import readline from "readline";
import { pathToFileURL } from "node:url";

dotenv.config();

// In your debug files
const DEBUG_LEVEL = process.env.DEBUG_LEVEL || 'minimal';

// Add debug flag
let DEBUG = process.env.DEBUG === 'true' || process.argv.includes('--debug');

function debugLog(label: string, data: any) {
    if (DEBUG) {
        console.log(`\n🔧 DEBUG - ${label}:`);
        console.log('─'.repeat(40));
        
        if (DEBUG_LEVEL === 'minimal') {
            // Show only essential info
            const essential = extractEssentialDebugInfo(data);
            console.log(JSON.stringify(essential, null, 2));
        } else {
            // Show full data (cleaned)
            const cleanData = cleanDebugData(data);
            console.log(JSON.stringify(cleanData, null, 2));
        }
        
        console.log('─'.repeat(40));
    }
}

function extractEssentialDebugInfo(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    return {
        type: typeof data,
        hasText: !!data.text,
        textLength: data.text?.length || 0,
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0,
        usage: data.usage,
        finishReason: data.finishReason,
        // Skip context, raw data, and long text content
    };
}

function cleanDebugData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const cleaned = { ...data };
    
    // Remove large context arrays
    if (cleaned.raw && cleaned.raw.context) {
        cleaned.raw = { ...cleaned.raw };
        cleaned.raw.context = `[Hidden: ${cleaned.raw.context.length} context tokens]`;
    }
    
    // Truncate long text responses
    if (cleaned.text && typeof cleaned.text === 'string' && cleaned.text.length > 300) {
        cleaned.text = cleaned.text.substring(0, 300) + '... [truncated]';
    }
    
    if (cleaned.response && typeof cleaned.response === 'string' && cleaned.response.length > 300) {
        cleaned.response = cleaned.response.substring(0, 300) + '... [truncated]';
    }
    
    // Clean nested objects
    Object.keys(cleaned).forEach(key => {
        if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
            cleaned[key] = cleanDebugData(cleaned[key]);
        }
    });
    
    return cleaned;
}

async function interactiveTest() {
    console.log("🎬 Interactive Mux Asset Manager");
    console.log("===============================");

    // Debug: Test Ollama connection first
    if (DEBUG) {
        console.log("🔧 Testing Ollama connection...");
        try {
            const { OllamaProvider } = await import("../models/ollama-provider");
            const ollama = new OllamaProvider(process.env.OLLAMA_BASE_URL);

            debugLog("Ollama config", {
                baseUrl: process.env.OLLAMA_BASE_URL,
                model: process.env.OLLAMA_MODEL
            });

            // Fix: Use healthCheck instead of checkHealth
            const health = await ollama.healthCheck();
            debugLog("Ollama health check", health);

            // Fix: Use correct return type for listModels
            const models = await ollama.listModels();
            debugLog("Available models", models.map(m => m.name));

            // Test basic generation
            console.log("🧪 Testing basic Ollama generation...");
            const testResponse = await ollama.generate(
                "Say 'Hello, I am working!' in exactly those words.",
                process.env.OLLAMA_MODEL || "gpt-oss:20b"
            );
            debugLog("Basic Ollama test", testResponse);

            if (!testResponse.text || testResponse.text.trim() === '') {
                console.log("⚠️  Ollama is returning empty responses - this is the root issue!");
            }

        } catch (error) {
            console.log("❌ Ollama test failed:", error);
            debugLog("Ollama error details", error);
        }
    }

    // Debug: Test agent initialization
    debugLog("Initializing MuxAssetManager", "Starting...");
    let assetManager;
    try {
        assetManager = new MuxAssetManager();
        debugLog("MuxAssetManager initialized", "Success");
    } catch (error) {
        debugLog("MuxAssetManager initialization failed", error);
        console.error("❌ Failed to initialize asset manager:", error);
        return;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (DEBUG) {
        console.log("🔧 DEBUG MODE ENABLED - Raw tool outputs will be shown");
    }
    console.log("Available commands:");
    console.log("1. recent - Get recent assets");
    console.log("2. list - List all assets");
    console.log("3. search <query> - Search assets");
    console.log("4. report - Generate asset report");
    console.log("5. status <status> - Get assets by status");
    console.log("6. debug - Toggle debug mode");
    console.log("7. test - Test agent directly");
    console.log("8. ollama - Test Ollama directly");
    console.log("9. exit - Exit\n");

    const askQuestion = (question: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(question, resolve);
        });
    };

    while (true) {
        try {
            const input = await askQuestion("Enter command: ");
            const [command, ...args] = input.trim().split(' ');

            switch (command.toLowerCase()) {
                case 'ollama':
                    console.log("\n🧪 Testing Ollama directly...");
                    try {
                        const { OllamaProvider } = await import("../models/ollama-provider");
                        const ollama = new OllamaProvider(process.env.OLLAMA_BASE_URL);

                        // Test with a simple prompt
                        console.log("Testing simple prompt...");
                        const simpleTest = await ollama.generate(
                            "Count from 1 to 3. Just write: 1, 2, 3",
                            process.env.OLLAMA_MODEL || "gpt-oss:20b"
                        );
                        debugLog("Simple counting test", simpleTest);

                        // Test with a more complex prompt
                        console.log("Testing complex prompt...");
                        const complexTest = await ollama.generate(
                            "You are a helpful assistant. Please analyze this request: List video assets from a media library. Respond with a clear action plan.",
                            process.env.OLLAMA_MODEL || "gpt-oss:20b"
                        );
                        debugLog("Complex prompt test", complexTest);

                        // Test chat format
                        console.log("Testing chat format...");
                        const chatTest = await ollama.chat([
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: "Say hello in one sentence." }
                        ], process.env.OLLAMA_MODEL || "gpt-oss:20b");
                        debugLog("Chat format test", chatTest);

                        // Test if model is actually loaded
                        console.log("Checking if model is loaded...");
                        try {
                            const { Ollama } = await import("ollama");
                            const client = new Ollama({ host: process.env.OLLAMA_BASE_URL });
                            const showResult = await client.show({ model: process.env.OLLAMA_MODEL || "gpt-oss:20b" });
                            debugLog("Model info", {
                                modelfile: showResult.modelfile?.substring(0, 200) + "...",
                                parameters: showResult.parameters,
                                template: showResult.template
                            });
                        } catch (showError) {
                            console.log("⚠️  Could not get model info:", showError instanceof Error ? showError.message : String(showError));
                            // Try to list available models
                            try {
                                const { Ollama } = await import("ollama");
                                const client = new Ollama({ host: process.env.OLLAMA_BASE_URL });
                                const listResult = await client.list();
                                console.log("Available models:", listResult.models.map(m => m.name));
                            } catch (listError) {
                                console.log("❌ Could not list models:", listError instanceof Error ? listError.message : String(listError));
                            }
                        }

                    } catch (error) {
                        console.error("❌ Direct Ollama test failed:", error);
                        debugLog("Direct Ollama error", error);
                    }
                    break;

                case 'recent':
                    console.log("\n🔍 Getting recent assets...");
                    debugLog("Calling getRecentAssets()", "Starting method call");

                    const startTime = Date.now();
                    const recent = await assetManager.getRecentAssets();
                    const endTime = Date.now();

                    debugLog("Method execution time", `${endTime - startTime}ms`);
                    debugLog("Raw Response Object", recent);

                    // Debug: Show individual properties with more detail
                    if (DEBUG) {
                        console.log("\n🔧 DEBUG - Response Analysis:");
                        console.log(`- Type: ${typeof recent}`);
                        console.log(`- Constructor: ${recent?.constructor?.name || 'N/A'}`);
                        console.log(`- Keys: ${Object.keys(recent || {}).join(', ')}`);
                        console.log(`- text: "${recent.text}" (type: ${typeof recent.text}, length: ${recent.text?.length || 0})`);
                        console.log(`- toolCalls: ${recent.toolCalls?.length || 0} calls (type: ${typeof recent.toolCalls})`);
                        console.log(`- toolResults: ${recent.toolResults?.length || 0} results (type: ${typeof recent.toolResults})`);
                        console.log(`- finishReason: "${recent.finishReason}"`);
                        console.log(`- usage: ${JSON.stringify(recent.usage)}`);

                        if (recent.toolCalls && recent.toolCalls.length > 0) {
                            console.log("\n🔧 DEBUG - Tool Calls:");
                            recent.toolCalls.forEach((call, index) => {
                                console.log(`\nCall ${index + 1}:`);
                                debugLog(`Tool Call ${index + 1}`, call);
                            });
                        }

                        if (recent.toolResults && recent.toolResults.length > 0) {
                            console.log("\n🔧 DEBUG - Tool Results:");
                            recent.toolResults.forEach((result, index) => {
                                console.log(`\nTool ${index + 1}:`);
                                console.log(`- toolName: ${result.toolName}`);
                                console.log(`- args: ${JSON.stringify(result.args, null, 2)}`);
                                console.log(`- result type: ${typeof result.result}`);
                                if (typeof result.result === 'string') {
                                    console.log(`- result preview: "${result.result.substring(0, 200)}${result.result.length > 200 ? '...' : ''}"`);
                                } else {
                                    debugLog(`Tool Result ${index + 1}`, result.result);
                                }
                            });
                        }
                    }

                    console.log("\n📋 Response:");
                    if (recent.text) {
                        console.log(recent.text);
                    } else {
                        console.log("⚠️  Empty response received");
                    }
                    break;

                case 'list':
                    console.log("\n🔍 Listing all assets...");
                    debugLog("Calling listAllAssets()", { limit: 5 });

                    const all = await assetManager.listAllAssets({ limit: 5 });
                    debugLog("Raw Response Object", all);

                    console.log("\n📋 Response:");
                    console.log(all.text || "⚠️  Empty response received");
                    break;

                case 'search':
                    if (args.length === 0) {
                        console.log("❌ Please provide a search query");
                        break;
                    }
                    const query = args.join(' ');
                    console.log(`\n🔍 Searching for: ${query}`);
                    debugLog("Calling searchAssets()", { query });

                    const search = await assetManager.searchAssets(query);
                    debugLog("Raw Response Object", search);

                    console.log("\n📋 Response:");
                    console.log(search.text || "⚠️  Empty response received");
                    break;

                case 'report':
                    console.log("\n🔍 Generating asset report...");
                    debugLog("Calling generateAssetReport()", "Starting method call");

                    const report = await assetManager.generateAssetReport();
                    debugLog("Raw Response Object", report);

                    console.log("\n📋 Response:");
                    console.log(report.text || "⚠️  Empty response received");
                    break;

                case 'status':
                    if (args.length === 0 || !['ready', 'preparing', 'errored', 'waiting'].includes(args[0])) {
                        console.log("❌ Please provide a valid status: ready, preparing, errored, waiting");
                        break;
                    }
                    console.log(`\n🔍 Getting ${args[0]} assets...`);
                    debugLog("Calling getAssetsByStatus()", { status: args[0] });

                    const status = await assetManager.getAssetsByStatus(args[0] as any);
                    debugLog("Raw Response Object", status);

                    console.log("\n📋 Response:");
                    console.log(status.text || "⚠️  Empty response received");
                    break;

                case 'test':
                    console.log("\n🧪 Testing agent directly...");

                    // Test if the agent has tools available
                    debugLog("Agent object", {
                        type: typeof assetManager,
                        constructor: assetManager.constructor.name,
                        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(assetManager))
                    });

                    // Try to access agent internals if possible
                    try {
                        const agentKeys = Object.keys(assetManager);
                        debugLog("Agent instance keys", agentKeys);

                        // Check if there's an underlying agent or client
                        if ((assetManager as any).agent) {
                            debugLog("Underlying agent", typeof (assetManager as any).agent);
                        }
                        if ((assetManager as any).client) {
                            debugLog("Underlying client", typeof (assetManager as any).client);
                        }
                        if ((assetManager as any).directManager) {
                            debugLog("Direct manager", typeof (assetManager as any).directManager);
                        }
                    } catch (error) {
                        debugLog("Failed to inspect agent internals", error);
                    }
                    break;

                case 'debug':
                    DEBUG = !DEBUG;
                    console.log(`🔧 Debug mode ${DEBUG ? 'enabled' : 'disabled'}`);
                    break;

                case 'exit':
                    console.log("👋 Goodbye!");
                    rl.close();
                    process.exit(0);
                    break;

                default:
                    console.log("❌ Unknown command. Try: recent, list, search, report, status, debug, test, ollama, exit");
                    break;
            }

            console.log("\n" + "─".repeat(50) + "\n");
        } catch (error) {
            console.error("❌ Error:", error);

            // Fix error message access
            if (typeof error === 'object' && error !== null) {
                console.log(`- Error details:`);
                console.log(`- Error type: ${error.constructor?.name || 'Unknown'}`);
                console.log(`- Error message: ${(error as any).message || 'No message'}`);
                if ((error as any).code) console.log(`- Error code: ${(error as any).code}`);
                if ((error as any).errno) console.log(`- Error errno: ${(error as any).errno}`);
            }
        }
    }
}

// Export the interactiveTest function so it can be imported by other modules
export { interactiveTest };

// Fix the direct-run check
const isDirectRun = (() => {
    const entry = process.argv?.[1] ? pathToFileURL(process.argv[1]).href : '';
    return import.meta?.url === entry;
})();

if (isDirectRun) {
    interactiveTest().catch((error) => {
        console.error("❌ Fatal error:", error);
        if (DEBUG) {
            debugLog("Fatal Error Details", error);
        }
    });
}
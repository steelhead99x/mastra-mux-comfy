import { MuxAssetManager } from "../agents/mux-asset-manager";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

async function interactiveMuxManager() {
    console.log("🎬 Interactive Mux Asset Manager");
    console.log("===============================");

    let assetManager;
    try {
        assetManager = new MuxAssetManager();
        console.log("✅ Asset manager initialized successfully\n");
    } catch (error) {
        console.error("❌ Failed to initialize asset manager:", error);
        return;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("Available commands:");
    console.log("1. recent [hours] - Get recent assets (default: 24 hours)");
    console.log("2. list [limit] - List all assets (default: show all)");
    console.log("3. search <query> - Search assets");
    console.log("4. report - Generate comprehensive asset report");
    console.log("5. status <status> - Get assets by status (ready/preparing/errored/waiting)");
    console.log("6. tools - Show available Mux tools");
    console.log("7. help - Show this help message");
    console.log("8. exit - Exit the application\n");

    const askQuestion = (question: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(question, resolve);
        });
    };

    while (true) {
        try {
            const input = await askQuestion("🎯 Enter command: ");
            const [command, ...args] = input.trim().split(' ');

            switch (command.toLowerCase()) {
                case 'recent':
                    const hours = args[0] ? parseInt(args[0]) : 24;
                    console.log(`\n🔍 Getting assets from last ${hours} hours...`);
                    const recent = await assetManager.getRecentAssets(hours);
                    console.log("\n📋 Result:");
                    console.log(recent.text);
                    break;

                case 'list':
                    const limit = args[0] ? parseInt(args[0]) : undefined;
                    console.log(`\n🔍 Listing${limit ? ` ${limit}` : ' all'} assets...`);
                    const all = await assetManager.listAllAssets({ limit });
                    console.log("\n📋 Result:");
                    console.log(all.text);
                    break;

                case 'search':
                    if (args.length === 0) {
                        console.log("❌ Please provide a search query");
                        console.log("   Usage: search <query>");
                        break;
                    }
                    const query = args.join(' ');
                    console.log(`\n🔍 Searching for: "${query}"`);
                    const search = await assetManager.searchAssets(query);
                    console.log("\n📋 Result:");
                    console.log(search.text);
                    break;

                case 'report':
                    console.log("\n🔍 Generating comprehensive asset report...");
                    const report = await assetManager.generateAssetReport();
                    console.log("\n📊 Asset Report:");
                    console.log("=" + "=".repeat(50));
                    console.log(report.text);
                    console.log("=" + "=".repeat(50));
                    break;

                case 'status':
                    if (args.length === 0 || !['ready', 'preparing', 'errored', 'waiting'].includes(args[0])) {
                        console.log("❌ Please provide a valid status");
                        console.log("   Valid statuses: ready, preparing, errored, waiting");
                        console.log("   Usage: status <status>");
                        break;
                    }
                    console.log(`\n🔍 Getting ${args[0]} assets...`);
                    const status = await assetManager.getAssetsByStatus(args[0] as any);
                    console.log("\n📋 Result:");
                    console.log(status.text);
                    break;

                case 'tools':
                    console.log("\n🛠️  Available Mux tools:");
                    await assetManager.debugTools();
                    break;

                case 'help':
                    console.log("\n📖 Available Commands:");
                    console.log("─".repeat(50));
                    console.log("recent [hours]    - Get recent assets (default: 24h)");
                    console.log("list [limit]      - List all assets");
                    console.log("search <query>    - Search for specific assets");
                    console.log("report           - Generate detailed asset report");
                    console.log("status <status>  - Filter by status (ready/preparing/errored/waiting)");
                    console.log("tools            - Show available Mux MCP tools");
                    console.log("help             - Show this help message");
                    console.log("exit             - Exit the application");
                    console.log("\nExamples:");
                    console.log("  recent 48        - Get assets from last 48 hours");
                    console.log("  list 10          - Show first 10 assets");
                    console.log("  search video     - Search for assets containing 'video'");
                    console.log("  status ready     - Show only ready assets");
                    break;

                case 'exit':
                case 'quit':
                case 'q':
                    console.log("👋 Goodbye!");
                    rl.close();
                    return;

                default:
                    if (command.trim() === '') {
                        break; // Just pressed enter, continue
                    }
                    console.log(`❌ Unknown command: "${command}"`);
                    console.log("💡 Type 'help' to see available commands");
                    break;
            }

            console.log("\n" + "─".repeat(50));
        } catch (error: any) {
            console.error(`❌ Error executing command: ${error?.message || error}`);
            console.log("💡 Type 'help' for available commands or 'exit' to quit");
        }
    }
}

// Enhanced version with better UX
async function enhancedInteractiveMuxManager() {
    console.log("🎬 Enhanced Mux Asset Manager");
    console.log("============================");

    const assetManager = new MuxAssetManager();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Display welcome message and quick stats
    console.log("🚀 Initializing and getting overview...");
    try {
        const quickList = await assetManager.listAllAssets({ limit: 5 });
        console.log("📊 Quick Overview:");
        console.log(quickList.text);
    } catch (error) {
        console.log("⚠️  Could not load initial overview");
    }

    console.log("\n🎯 Interactive Commands Available:");
    console.log("Type a command and press Enter. Type 'help' for detailed usage.\n");

    const commands = {
        recent: {
            desc: "Get recent assets",
            usage: "recent [hours]",
            example: "recent 48"
        },
        list: {
            desc: "List all assets",
            usage: "list [limit]",
            example: "list 20"
        },
        search: {
            desc: "Search assets",
            usage: "search <query>",
            example: "search meeting"
        },
        report: {
            desc: "Generate full report",
            usage: "report",
            example: "report"
        },
        status: {
            desc: "Filter by status",
            usage: "status <status>",
            example: "status ready"
        }
    };

    const askQuestion = (question: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(question, resolve);
        });
    };

    while (true) {
        try {
            const input = await askQuestion("🎬 mux> ");
            const [command, ...args] = input.trim().split(' ');

            if (!command) continue;

            const startTime = Date.now();

            switch (command.toLowerCase()) {
                case 'recent':
                    const hours = args[0] ? parseInt(args[0]) : 24;
                    const recent = await assetManager.getRecentAssets(hours);
                    console.log(`\n🕒 Assets from last ${hours} hours:`);
                    console.log(recent.text);
                    break;

                case 'list':
                    const limit = args[0] ? parseInt(args[0]) : undefined;
                    const all = await assetManager.listAllAssets({ limit });
                    console.log(`\n📋 Asset List${limit ? ` (showing ${limit})` : ''}:`);
                    console.log(all.text);
                    break;

                case 'search':
                    if (!args.length) {
                        console.log("❌ Search query required. Usage: search <query>");
                        break;
                    }
                    const query = args.join(' ');
                    const search = await assetManager.searchAssets(query);
                    console.log(`\n🔍 Search results for "${query}":`);
                    console.log(search.text);
                    break;

                case 'report':
                    console.log("\n📊 Generating comprehensive report...");
                    const report = await assetManager.generateAssetReport();
                    console.log(report.text);
                    break;

                case 'status':
                    const validStatuses = ['ready', 'preparing', 'errored', 'waiting'];
                    if (!args[0] || !validStatuses.includes(args[0])) {
                        console.log(`❌ Valid statuses: ${validStatuses.join(', ')}`);
                        break;
                    }
                    const status = await assetManager.getAssetsByStatus(args[0] as any);
                    console.log(`\n📌 Assets with status "${args[0]}":`);
                    console.log(status.text);
                    break;

                case 'tools':
                    console.log("\n🛠️  Available tools:");
                    await assetManager.debugTools();
                    break;

                case 'quick':
                    console.log("\n⚡ Quick Commands:");
                    Object.entries(commands).forEach(([cmd, info]) => {
                        console.log(`  ${cmd.padEnd(8)} - ${info.desc} (${info.example})`);
                    });
                    break;

                case 'help':
                    console.log("\n📖 Detailed Help:");
                    console.log("─".repeat(60));
                    Object.entries(commands).forEach(([cmd, info]) => {
                        console.log(`${cmd.toUpperCase().padEnd(8)} ${info.usage.padEnd(20)} ${info.desc}`);
                        console.log(`${''.padEnd(8)} Example: ${info.example}\n`);
                    });
                    console.log("Other commands: tools, quick, help, exit");
                    break;

                case 'exit':
                case 'quit':
                case 'q':
                    console.log("👋 Thank you for using Mux Asset Manager!");
                    rl.close();
                    return;

                default:
                    console.log(`❓ Unknown command: "${command}"`);
                    console.log("💡 Type 'quick' for common commands or 'help' for detailed usage");
                    break;
            }

            const duration = Date.now() - startTime;
            console.log(`\n⏱️  Completed in ${duration}ms`);
            console.log("─".repeat(50));

        } catch (error: any) {
            console.error(`❌ Error: ${error?.message || error}`);
            console.log("💡 Type 'help' for usage or 'exit' to quit");
        }
    }
}

if (require.main === module) {
    const mode = process.argv[2] || 'enhanced';

    if (mode === 'basic') {
        interactiveMuxManager().catch(console.error);
    } else {
        enhancedInteractiveMuxManager().catch(console.error);
    }
}

export { interactiveMuxManager, enhancedInteractiveMuxManager };
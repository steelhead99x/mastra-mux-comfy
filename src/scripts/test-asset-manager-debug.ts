import { MuxAssetManager } from "../mastra/agents/mux-asset-manager";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

async function interactiveTest() {
    const assetManager = new MuxAssetManager();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("🎬 Interactive Mux Asset Manager");
    console.log("===============================");
    console.log("Available commands:");
    console.log("1. recent - Get recent assets");
    console.log("2. list - List all assets");
    console.log("3. search <query> - Search assets");
    console.log("4. report - Generate asset report");
    console.log("5. status <status> - Get assets by status");
    console.log("6. exit - Exit\n");

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
                case 'recent':
                    console.log("\n🔍 Getting recent assets...");
                    const recent = await assetManager.getRecentAssets();
                    console.log("\n📋 Response:");
                    console.log(recent.text);
                    break;

                case 'list':
                    console.log("\n🔍 Listing all assets...");
                    const all = await assetManager.listAllAssets({ limit: 5 });
                    console.log("\n📋 Response:");
                    console.log(all.text);
                    break;

                case 'search':
                    if (args.length === 0) {
                        console.log("❌ Please provide a search query");
                        break;
                    }
                    console.log(`\n🔍 Searching for: ${args.join(' ')}`);
                    const search = await assetManager.searchAssets(args.join(' '));
                    console.log("\n📋 Response:");
                    console.log(search.text);
                    break;

                case 'report':
                    console.log("\n🔍 Generating asset report...");
                    const report = await assetManager.generateAssetReport();
                    console.log("\n📋 Response:");
                    console.log(report.text);
                    break;

                case 'status':
                    if (args.length === 0 || !['ready', 'preparing', 'errored', 'waiting'].includes(args[0])) {
                        console.log("❌ Please provide a valid status: ready, preparing, errored, waiting");
                        break;
                    }
                    console.log(`\n🔍 Getting ${args[0]} assets...`);
                    const status = await assetManager.getAssetsByStatus(args[0] as any);
                    console.log("\n📋 Response:");
                    console.log(status.text);
                    break;

                case 'exit':
                    console.log("👋 Goodbye!");
                    rl.close();
                    process.exit(0);
                    break;

                default:
                    console.log("❌ Unknown command. Try: recent, list, search, report, status, exit");
                    break;
            }

            console.log("\n" + "─".repeat(50) + "\n");
        } catch (error) {
            console.error("❌ Error:", error);
        }
    }
}

if (require.main === module) {
    interactiveTest().catch(console.error);
}
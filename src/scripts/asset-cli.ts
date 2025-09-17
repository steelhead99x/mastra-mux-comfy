#!/usr/bin/env node

import { MuxAssetManager } from "../mastra/agents/mux-asset-manager";
import dotenv from "dotenv";

dotenv.config();

async function runCLI() {
    const args = process.argv.slice(2);
    const command = args[0];
    const params = args.slice(1);

    console.log("🎬 Mux Asset Manager CLI");
    console.log("========================\n");

    // Initialize the asset manager
    const assetManager = new MuxAssetManager();

    try {
        switch (command) {
            case 'list':
            case 'all':
                console.log("📋 Listing all assets...");
                const allAssets = await assetManager.listAllAssets({
                    includeDetails: params.includes('--detailed'),
                    limit: params.includes('--limit') ? parseInt(params[params.indexOf('--limit') + 1]) : undefined
                });
                console.log(allAssets.text);
                break;

            case 'recent':
                const hours = params[0] ? parseInt(params[0]) : 24;
                console.log(`📅 Getting assets from last ${hours} hours...`);
                const recentAssets = await assetManager.getRecentAssets(hours);
                console.log(recentAssets.text);
                break;

            case 'status':
                const status = params[0] as 'ready' | 'preparing' | 'errored' | 'waiting';
                if (!status || !['ready', 'preparing', 'errored', 'waiting'].includes(status)) {
                    console.log("❌ Valid status required: ready, preparing, errored, waiting");
                    process.exit(1);
                }
                console.log(`🔍 Getting assets with status: ${status}...`);
                const statusAssets = await assetManager.getAssetsByStatus(status);
                console.log(statusAssets.text);
                break;

            case 'details':
            case 'info':
                const assetId = params[0];
                if (!assetId) {
                    console.log("❌ Asset ID required");
                    process.exit(1);
                }
                console.log(`🎯 Getting details for asset: ${assetId}...`);
                const assetDetails = await assetManager.getAssetDetails(assetId);
                console.log(assetDetails.text);
                break;

            case 'search':
                const query = params.join(' ');
                if (!query) {
                    console.log("❌ Search query required");
                    process.exit(1);
                }
                console.log(`🔍 Searching for: ${query}...`);
                const searchResults = await assetManager.searchAssets(query);
                console.log(searchResults.text);
                break;

            case 'report':
                console.log("📊 Generating comprehensive asset report...");
                const report = await assetManager.generateAssetReport();
                console.log(report.text);
                break;

            case 'date':
                const startDate = params[0];
                const endDate = params[1];
                if (!startDate || !endDate) {
                    console.log("❌ Start and end dates required (YYYY-MM-DD format)");
                    process.exit(1);
                }
                console.log(`📅 Getting assets between ${startDate} and ${endDate}...`);
                const dateAssets = await assetManager.getAssetsByDateRange(startDate, endDate);
                console.log(dateAssets.text);
                break;

            case 'help':
            default:
                console.log("Available commands:");
                console.log("  list [--detailed] [--limit N]  - List all assets");
                console.log("  recent [hours]                 - Get recent assets (default 24h)");
                console.log("  status <ready|preparing|errored|waiting> - Get assets by status");
                console.log("  details <asset-id>             - Get detailed asset info");
                console.log("  search <query>                 - Search assets");
                console.log("  report                         - Generate comprehensive report");
                console.log("  date <start> <end>             - Get assets by date range");
                console.log("  help                           - Show this help");
                console.log("\nExamples:");
                console.log("  npm run assets recent 48");
                console.log("  npm run assets status ready");
                console.log("  npm run assets details abc123...");
                console.log("  npm run assets search 'my video'");
                break;
        }

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    runCLI().then(() => {
        console.log("\n✅ Command completed successfully!");
        process.exit(0);
    });
}
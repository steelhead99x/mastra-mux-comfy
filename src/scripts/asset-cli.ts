
import { MuxAssetManager, createMuxAssetManagerAgent } from "../mastra/agents/mux-asset-manager";
import dotenv from "dotenv";

dotenv.config();

async function testAssetManager() {
    console.log("🎬 Testing Mux Asset Manager Agent");
    console.log("==================================\n");

    const assetManager = new MuxAssetManager();

    try {
        // Test 1: List recent assets (last 24 hours)
        console.log("📋 Test 1: Getting assets from last 24 hours...");
        console.log("-".repeat(50));

        const recentAssets = await assetManager.getRecentAssets(24);

        // Display the actual response
        console.log("🤖 AI Response:");
        console.log("=" + "=".repeat(50));
        console.log(recentAssets.text);
        console.log("=" + "=".repeat(50));
        console.log("\n");

        // Test 2: List all assets
        console.log("📋 Test 2: Listing all assets...");
        console.log("-".repeat(50));

        const allAssets = await assetManager.listAllAssets({ limit: 5, includeDetails: true });
        console.log("🤖 All Assets Response:");
        console.log("=" + "=".repeat(50));
        console.log(allAssets.text);
        console.log("=" + "=".repeat(50));
        console.log("\n");

        // Test 3: Generate asset report
        console.log("📋 Test 3: Generating asset report...");
        console.log("-".repeat(50));

        const report = await assetManager.generateAssetReport();
        console.log("🤖 Asset Report:");
        console.log("=" + "=".repeat(50));
        console.log(report.text);
        console.log("=" + "=".repeat(50));
        console.log("\n");

    } catch (error) {
        console.error("❌ Error testing asset manager:", error);
    }
}

async function directAgentInteraction() {
    console.log("🎯 Direct Agent Interaction Example");
    console.log("===================================\n");

    try {
        const agent = await createMuxAssetManagerAgent();
        const response = await agent.generate(`
      Please help me understand my Mux video asset collection. I need:
      
      1. A complete list of all my assets
      2. Analysis of which assets are ready vs still processing
      3. Identification of any problematic assets
      4. Recommendations for managing my video library
      
      Use your Mux MCP tools to gather this information and provide actionable insights.
    `);

        console.log("🤖 Agent Response:");
        console.log("=" + "=".repeat(50));
        console.log(response.text);
        console.log("=" + "=".repeat(50));

    } catch (error) {
        console.error("❌ Direct agent interaction failed:", error);
    }
}

// Enhanced test with more visibility
async function detailedAssetTest() {
    console.log("🔍 Detailed Asset Manager Testing");
    console.log("=================================\n");

    const assetManager = new MuxAssetManager();

    const tests = [
        {
            name: "Recent Assets (24h)",
            action: () => assetManager.getRecentAssets(24)
        },
        {
            name: "Search Assets",
            action: () => assetManager.searchAssets("video")
        },
        {
            name: "Assets by Status (Ready)",
            action: () => assetManager.getAssetsByStatus('ready')
        },
        {
            name: "All Assets (Limited)",
            action: () => assetManager.listAllAssets({ limit: 10, includeDetails: false })
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🧪 Running: ${test.name}`);
            console.log("─".repeat(60));

            const startTime = Date.now();
            const result = await test.action();
            const duration = Date.now() - startTime;

            console.log(`⏱️  Duration: ${duration}ms`);
            console.log(`📝 Response Length: ${result.text.length} characters`);
            console.log("\n📋 Response Content:");
            console.log("┌" + "─".repeat(58) + "┐");

            // Split response into lines and display with borders
            const lines = result.text.split('\n');
            lines.forEach(line => {
                if (line.length > 56) {
                    // Word wrap long lines
                    const wrapped = line.match(/.{1,56}(\s|$)/g) || [line];
                    wrapped.forEach(wrappedLine => {
                        console.log(`│ ${wrappedLine.padEnd(56)} │`);
                    });
                } else {
                    console.log(`│ ${line.padEnd(56)} │`);
                }
            });

            console.log("└" + "─".repeat(58) + "┘");

        } catch (error) {
            console.error(`❌ Test "${test.name}" failed:`, error);
        }
    }
}

if (require.main === module) {
    const testMode = process.argv[2] || 'basic';

    if (testMode === 'detailed') {
        detailedAssetTest()
            .then(() => {
                console.log("\n✅ Detailed asset testing completed!");
                process.exit(0);
            })
            .catch((error) => {
                console.error("\n💥 Detailed testing failed:", error);
                process.exit(1);
            });
    } else {
        testAssetManager()
            .then(() => {
                console.log("\n✅ Asset manager testing completed!");
                process.exit(0);
            })
            .catch((error) => {
                console.error("\n💥 Asset manager testing failed:", error);
                process.exit(1);
            });
    }
}

export { testAssetManager, directAgentInteraction, detailedAssetTest };
import { MuxAssetManager, createMuxAssetManagerAgent } from "../agents/mux-asset-manager";
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
        console.log(recentAssets.text);
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

if (require.main === module) {
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

export { testAssetManager, directAgentInteraction };
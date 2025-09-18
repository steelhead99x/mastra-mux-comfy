import dotenv from "dotenv";
import { muxMcpClient } from "../mcp/mux-client";

dotenv.config();

async function toolNameTest() {
    console.log("🔍 Tool Name Investigation");
    console.log("==========================");

    try {
        const tools = await muxMcpClient.getTools();
        const toolNames = Object.keys(tools);

        console.log(`Total tools: ${toolNames.length}`);

        // Show video related tools
        console.log("\nVideo Asset Tools:");
        const videoAssetTools = toolNames.filter(name => name.includes('video') && name.includes('asset'));
        videoAssetTools.forEach(name => console.log(`  - ${name}`));

        // Show list tools
        console.log("\nList Tools:");
        const listTools = toolNames.filter(name => name.startsWith('list_'));
        listTools.slice(0, 15).forEach(name => console.log(`  - ${name}`));

        // Test the specific tool that should work
        console.log("\n🧪 Testing list_video_assets tool directly:");
        const listVideoAssetsTool = tools['list_video_assets'];

        if (listVideoAssetsTool) {
            console.log("✅ list_video_assets tool found");
            console.log("Description:", listVideoAssetsTool.description);

            try {
                const result = await listVideoAssetsTool.call({ limit: 2 });
                console.log("✅ Direct tool call successful");
                console.log("Result type:", typeof result);
                if (result && result.content && result.content[0]) {
                    console.log("Preview:", JSON.stringify(result.content[0]).substring(0, 200) + "...");
                }
            } catch (error) {
                console.log("❌ Direct tool call failed:", error);
            }
        } else {
            console.log("❌ list_video_assets tool not found");
        }

    } catch (error) {
        console.error("❌ Investigation failed:", error);
    }
}

toolNameTest().catch(console.error);
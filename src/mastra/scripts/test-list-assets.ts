import dotenv from "dotenv";
import path from "path";
import { muxMcpClient } from "../mcp/mux-client";

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function simpleListAssetsTest() {
    console.log("📼 Simple List Assets Test");
    console.log("==========================");

    // 1) Check credentials
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
        console.log("❌ Missing MUX credentials.");
        console.log("Ensure .env has:");
        console.log("MUX_TOKEN_ID=...");
        console.log("MUX_TOKEN_SECRET=...");
        process.exit(1);
    }

    let success = false;

    try {
        // 2) Get tools
        const tools = await muxMcpClient.getTools();
        const toolNames = Object.keys(tools);
        console.log(`✅ Connected - ${toolNames.length} tools available`);

        // 3) Find list_assets
        const listToolName = toolNames.find((n) => n.includes("list_video_asset"));
        if (!listToolName) {
            console.log("⚠️ No list_assets tool found.");
            console.log("Available tools:", toolNames.join(", "));
        } else {
            console.log(`🔧 Using tool: ${listToolName}`);
            const tool = tools[listToolName];

            // 4) Call tool
            const result = await tool.call({ limit: 3 }); // fetch a few for preview
            console.log("✅ Tool executed successfully");
            console.log("Result type:", typeof result);

            if (result?.content && Array.isArray(result.content)) {
                const preview = result.content.slice(0, 3);
                console.log("Preview:", JSON.stringify(preview, null, 2));
            } else {
                console.log("Raw result:", JSON.stringify(result, null, 2));
            }
            success = true;
        }
    } catch (err: any) {
        console.error("❌ Test failed:", err.message || err);
        if (String(err.message || "").toLowerCase().includes("unauthorized")) {
            console.log("🔑 Check your MUX credentials and permissions.");
        }
    } finally {
        // 5) Clean disconnect
        try {
            await muxMcpClient.disconnect();
        } catch {
            // ignore close errors
        }
        process.exit(success ? 0 : 1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    simpleListAssetsTest().catch((e) => {
        console.error("❌ Unexpected error:", e);
        process.exit(1);
    });
}

export { simpleListAssetsTest };
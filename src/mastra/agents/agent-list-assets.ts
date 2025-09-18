import dotenv from "dotenv";
import path from "path";
import { muxMcpClient } from "../mcp/mux-client";

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function agentListAssets() {
    console.log("🤖 Agent: List Mux Assets");
    console.log("=========================");

    // Debug environment loading
    console.log("Debug: Current working directory:", process.cwd());
    console.log("Debug: Looking for .env at:", path.resolve(process.cwd(), ".env"));

    // 1) Check environment variables
    console.log("\n1. Checking environment variables...");
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    console.log(`   MUX_TOKEN_ID: ${tokenId ? "✅ Set (" + tokenId.substring(0, 8) + "...)" : "❌ Not found"}`);
    console.log(`   MUX_TOKEN_SECRET: ${tokenSecret ? "✅ Set (" + tokenSecret.substring(0, 8) + "...)" : "❌ Not found"}`);

    if (!tokenId || !tokenSecret) {
        console.log("\n❌ Missing authentication credentials!");
        console.log("Please ensure your .env file contains:");
        console.log("MUX_TOKEN_ID=your_token_id");
        console.log("MUX_TOKEN_SECRET=your_token_secret");
        console.log("\nMake sure the .env file is in the project root directory.");
        process.exit(1);
    }

    // 2) Test MCP connection and list assets
    console.log("\n2. Connecting to MCP and listing assets...");
    let success = false;

    try {
        const tools = await muxMcpClient.getTools();
        const toolNames = Object.keys(tools);
        console.log(`   ✅ Connected successfully - ${toolNames.length} tools available`);

        // 3) Find list_assets tool
        console.log("\n3. Finding 'list_assets' tool...");
        const listToolName = toolNames.find((name) => name.includes("list_video_assets"));

        if (!listToolName) {
            console.log("   ⚠️  No list_assets tool found");
            console.log("   Available tools:", toolNames.join(", "));
        } else {
            console.log(`   Using tool: ${listToolName}`);
            const tool = tools[listToolName];

            try {
                // 4) Call the tool
                const result = await tool.call({ limit: 5 }); // adjust limit as needed
                console.log("   ✅ Tool execution successful!");
                console.log("   Result type:", typeof result);

                // 5) Print preview
                if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
                    const preview = result.content.slice(0, 5);
                    console.log("   Assets preview:", JSON.stringify(preview, null, 2));
                } else {
                    console.log("   No assets found or unexpected result shape");
                    console.log("   Raw result:", JSON.stringify(result, null, 2));
                }

                success = true;
            } catch (toolError: any) {
                console.log("   ❌ Tool execution failed:", toolError?.message || toolError);
                const msg = String(toolError?.message || "").toLowerCase();
                if (msg.includes("authentication") || msg.includes("unauthorized")) {
                    console.log("   🔑 This appears to be an authentication issue");
                    console.log("   Please verify your Mux API credentials are correct and have the necessary permissions");
                }
            }
        }
    } catch (error: any) {
        console.log(`   ❌ Connection failed: ${error?.message || error}`);
    }

    console.log("\n4. Agent run complete");

    // Clean exit
    try {
        await muxMcpClient.disconnect();
    } catch {
        // Ignore close errors
    }

    process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    agentListAssets().catch((error) => {
        console.error("❌ Agent failed:", error);
        process.exit(1);
    });
}

export { agentListAssets };
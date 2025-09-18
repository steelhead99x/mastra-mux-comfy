import dotenv from "dotenv";
import path from "path";
import { muxMcpClient } from "../mcp/mux-client";

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testMuxAuthentication() {
    console.log("🔐 Testing Mux MCP Authentication");
    console.log("=================================");

    // Debug environment loading
    console.log("Debug: Current working directory:", process.cwd());
    console.log("Debug: Looking for .env at:", path.resolve(process.cwd(), '.env'));

    // Check environment variables
    console.log("\n1. Checking environment variables...");
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    console.log(`   MUX_TOKEN_ID: ${tokenId ? '✅ Set (' + tokenId.substring(0, 8) + '...)' : '❌ Not found'}`);
    console.log(`   MUX_TOKEN_SECRET: ${tokenSecret ? '✅ Set (' + tokenSecret.substring(0, 8) + '...)' : '❌ Not found'}`);

    if (!tokenId || !tokenSecret) {
        console.log("\n❌ Missing authentication credentials!");
        console.log("Please ensure your .env file contains:");
        console.log("MUX_TOKEN_ID=your_token_id");
        console.log("MUX_TOKEN_SECRET=your_token_secret");
        console.log("\nMake sure the .env file is in the project root directory.");
        process.exit(1);
    }

    // Test MCP connection
    console.log("\n2. Testing MCP connection...");
    let success = false;

    try {
        const tools = await muxMcpClient.getTools();
        console.log(`   ✅ Connected successfully - ${Object.keys(tools).length} tools available`);

        // Test a simple tool call
        console.log("\n3. Testing tool execution...");
        const toolNames = Object.keys(tools);
        const listTool = toolNames.find(name => name.includes('list_data_annotations'));

        if (listTool) {
            console.log(`   Testing tool: ${listTool}`);
            const tool = tools[listTool];

            try {
                const result = await tool.call({ limit: 1 });
                console.log("   ✅ Tool execution successful!");
                console.log("   Result type:", typeof result);

                if (result && result.content && result.content[0]) {
                    console.log("   Result preview:", JSON.stringify(result.content[0], null, 2).substring(0, 200) + "...");
                }
                success = true;

            } catch (toolError: any) {
                console.log("   ❌ Tool execution failed:", toolError.message);
                if (toolError.message.includes('authentication') || toolError.message.includes('unauthorized')) {
                    console.log("   🔑 This appears to be an authentication issue");
                    console.log("   Please verify your Mux API credentials are correct and have the necessary permissions");
                }
            }
        } else {
            console.log("   ⚠️  No list_data_annotations tool found for testing");
            console.log("   Available tools:", toolNames.join(', '));
        }

    } catch (error: any) {
        console.log(`   ❌ Connection failed: ${error.message}`);
    }

    console.log("\n4. Authentication test complete");

    // Clean exit
    try {
        await muxMcpClient.disconnect?.();
    } catch {
        // Ignore close errors
    }

    process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testMuxAuthentication().catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
}

export { testMuxAuthentication };
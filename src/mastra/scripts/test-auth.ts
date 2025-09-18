import dotenv from "dotenv";
import { muxMcpClient } from "../mcp/mux-client";

dotenv.config();

async function testMuxAuthentication() {
    console.log("🔐 Testing Mux MCP Authentication");
    console.log("=================================");

    // Check environment variables
    console.log("1. Checking environment variables...");
    const hasTokenId = !!process.env.MUX_TOKEN_ID;
    const hasTokenSecret = !!process.env.MUX_TOKEN_SECRET;

    console.log(`   MUX_TOKEN_ID: ${hasTokenId ? '✅' : '❌'}`);
    console.log(`   MUX_TOKEN_SECRET: ${hasTokenSecret ? '✅' : '❌'}`);

    if (!hasTokenId || !hasTokenSecret) {
        console.log("\n❌ Missing authentication credentials!");
        console.log("Please ensure your .env file contains:");
        console.log("MUX_TOKEN_ID=your_token_id");
        console.log("MUX_TOKEN_SECRET=your_token_secret");
        return;
    }

    // Test MCP connection
    console.log("\n2. Testing MCP connection...");
    try {
        const tools = await muxMcpClient.getTools();
        console.log(`   ✅ Connected successfully - ${Object.keys(tools).length} tools available`);

        // Test a simple tool call
        console.log("\n3. Testing tool execution...");
        const toolNames = Object.keys(tools);
        const listTool = toolNames.find(name => name.includes('list_assets'));

        if (listTool) {
            console.log(`   Testing tool: ${listTool}`);
            const tool = tools[listTool];

            try {
                const result = await tool.call({ limit: 1 }); // Just get 1 asset to test
                console.log("   ✅ Tool execution successful!");
                console.log("   Result type:", typeof result);

                if (result && result.content && result.content[0]) {
                    console.log("   Result preview:", JSON.stringify(result.content[0], null, 2).substring(0, 200) + "...");
                }

            } catch (toolError: any) {
                console.log("   ❌ Tool execution failed:", toolError.message);
                if (toolError.message.includes('authentication') || toolError.message.includes('unauthorized')) {
                    console.log("   🔑 This appears to be an authentication issue");
                    console.log("   Please verify your Mux API credentials are correct and have the necessary permissions");
                }
            }
        } else {
            console.log("   ⚠️  No list_assets tool found for testing");
        }

    } catch (error: any) {
        console.log(`   ❌ Connection failed: ${error.message}`);
    }

    console.log("\n4. Authentication test complete");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testMuxAuthentication().catch(console.error);
}

export { testMuxAuthentication };
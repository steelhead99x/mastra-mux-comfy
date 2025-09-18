import dotenv from "dotenv";
import { muxMcpClient } from "../mcp/mux-client";

dotenv.config();

async function testSimpleConnection() {
    console.log("🔧 Simple MCP Connection Test");
    console.log("=============================");

    try {
        // Test 1: Get tools
        console.log("1. Getting tools...");
        const tools = await muxMcpClient.getTools();
        const toolNames = Object.keys(tools);
        console.log(`   ✅ Success: Got ${toolNames.length} tools`);

        // Test 2: Show first few tools
        console.log("\n2. First 5 tools:");
        toolNames.slice(0, 5).forEach((name, index) => {
            console.log(`   ${index + 1}. ${name}`);
        });

        // Test 3: Try a simple tool call
        console.log("\n3. Testing a tool call...");
        const listAssetsTool = toolNames.find(name => name === 'list_video_assets');

        if (listAssetsTool) {
            console.log(`   Testing: ${listAssetsTool}`);
            const tool = tools[listAssetsTool];

            try {
                // Call with minimal parameters
                const result = await tool.call({ limit: 1 });
                console.log("   ✅ Tool call successful!");
                console.log("   Result type:", typeof result);

                // Check if we have content
                if (result && result.content) {
                    console.log("   📋 Has content:", Array.isArray(result.content));
                    if (Array.isArray(result.content) && result.content.length > 0) {
                        console.log("   📊 Content items:", result.content.length);

                        // Show the first result if it's text
                        const firstItem = result.content[0];
                        if (firstItem && firstItem.type === 'text') {
                            const preview = firstItem.text.substring(0, 200);
                            console.log("   📝 Preview:", preview + (firstItem.text.length > 200 ? "..." : ""));
                        }
                    }
                } else {
                    console.log("   ⚠️  No content in result");
                }

            } catch (toolError: any) {
                console.log("   ❌ Tool call failed:", toolError.message);

                // Check if it's an auth error
                if (toolError.message && (
                    toolError.message.includes('authentication') ||
                    toolError.message.includes('unauthorized') ||
                    toolError.message.includes('token')
                )) {
                    console.log("   🔑 This appears to be an authentication issue");
                }
            }
        } else {
            console.log("   ⚠️  list_video_assets tool not found");
            console.log("   Available tools with 'list' in name:");
            toolNames.filter(name => name.includes('list')).slice(0, 5).forEach(name => {
                console.log(`     - ${name}`);
            });
        }

        console.log("\n🎉 Connection test completed!");

    } catch (error: any) {
        console.log("❌ Connection test failed:", error.message);

        if (error.message.includes('already started')) {
            console.log("💡 Try restarting your terminal and running the test again");
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSimpleConnection()
        .then(() => {
            console.log("\n✅ Test completed");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Test failed:", error);
            process.exit(1);
        });
}

export { testSimpleConnection };
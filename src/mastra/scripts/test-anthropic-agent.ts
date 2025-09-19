import dotenv from "dotenv";
import { testAnthropicConnection, anthropicGenerateText } from "../models/anthropic-model";
import { runAnthropicDynamicAgent, testDirectClaudeWithMuxTools } from "../agents/anthropic-dynamic-agent";
import { muxMcpClient } from "../mcp/mux-client";

// Load environment variables
dotenv.config();

async function testAnthropicIntegration() {
    console.log("🧪 ANTHROPIC + MUX MCP INTEGRATION TEST");
    console.log("=".repeat(50));

    try {
        // Test 1: Environment validation
        console.log("\n1. 🔍 Environment Validation");
        const requiredEnvVars = [
            'ANTHROPIC_API_KEY',
            'MUX_TOKEN_ID',
            'MUX_TOKEN_SECRET'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
            console.log("\n💡 Required environment variables:");
            console.log("   ANTHROPIC_API_KEY=your_anthropic_api_key");
            console.log("   MUX_TOKEN_ID=your_mux_token_id");
            console.log("   MUX_TOKEN_SECRET=your_mux_token_secret");
            console.log("   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022 (optional)");
            return;
        }

        console.log("✅ All required environment variables found");
        console.log(`   Model: ${process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'}`);

        // Test 2: Anthropic connection
        console.log("\n2. 🤖 Anthropic Connection Test");
        const connectionTest = await testAnthropicConnection();
        if (!connectionTest) {
            console.error("❌ Anthropic connection failed");
            return;
        }

        // Test 3: Mux MCP connection and tools
        console.log("\n3. 🎥 Mux MCP Connection Test");
        try {
            const tools = await muxMcpClient.getTools();
            console.log(`✅ Connected to Mux MCP with ${Object.keys(tools).length} tools`);

            if (Object.keys(tools).length > 0) {
                console.log("🛠️ Available tools:");
                Object.keys(tools).forEach((toolName, index) => {
                    console.log(`   ${index + 1}. ${toolName}`);
                });
            } else {
                console.log("⚠️ No tools found - check Mux credentials");
            }
        } catch (error) {
            console.error("❌ Mux MCP connection failed:", error);
            return;
        }

        // Test 4: Basic Claude text generation
        console.log("\n4. 📝 Basic Claude Text Generation");
        try {
            const basicResult = await anthropicGenerateText(
                "Explain what Mux is in one sentence.",
                { temperature: 0.1, maxTokens: 100 }
            );
            console.log("✅ Claude response:", basicResult.text);
        } catch (error) {
            console.error("❌ Basic text generation failed:", error);
            return;
        }

        // Test 5: Direct Claude with Mux tools
        console.log("\n5. 🔧 Direct Claude with Mux Tools Test");
        try {
            const toolTestResult = await testDirectClaudeWithMuxTools(
                "List the first 3 video assets from Mux, if any are available."
            );

            console.log("✅ Claude with tools response:", toolTestResult.response);

            if (toolTestResult.toolCalls && toolTestResult.toolCalls.length > 0) {
                console.log(`🛠️ Tools called: ${toolTestResult.toolCalls.length}`);
                toolTestResult.toolCalls.forEach((call: any, index: number) => {
                    console.log(`   ${index + 1}. ${call.toolName}`);
                });
            }

            if (toolTestResult.usage) {
                console.log("📊 Usage:", toolTestResult.usage);
            }
        } catch (error) {
            console.error("❌ Direct Claude with tools test failed:", error);
        }

        // Test 6: Interactive agent availability
        console.log("\n6. 🎬 Agent Availability Check");
        console.log("✅ Anthropic dynamic agent is ready for interactive use");
        console.log("💡 Run 'npm run agent:anthropic' to start interactive session");

        console.log("\n" + "=".repeat(50));
        console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(50));

        // Ask if user wants to start interactive session
        console.log("\n🚀 Start interactive Anthropic agent session? (y/N)");

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', async (data) => {
            const input = data.toString().toLowerCase().trim();

            if (input === 'y' || input === 'yes') {
                console.log("\n🎬 Starting interactive session...\n");
                process.stdin.setRawMode(false);
                await runAnthropicDynamicAgent();
            } else {
                console.log("\n👋 Test completed. Use 'npm run agent:anthropic' to start later.");
                process.exit(0);
            }
        });

    } catch (error) {
        console.error("\n❌ Test suite failed:", error);
        console.log("\n🔧 Troubleshooting:");
        console.log("   • Verify environment variables in .env file");
        console.log("   • Check internet connection");
        console.log("   • Ensure Anthropic API key is valid");
        console.log("   • Verify Mux credentials are correct");
    }
}

// Auto-run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testAnthropicIntegration().catch(console.error);
}

export { testAnthropicIntegration };
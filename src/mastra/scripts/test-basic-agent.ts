import dotenv from "dotenv";
import BasicAgent from "../agents/basic-agent";

dotenv.config();

async function testBasicAgent() {
    console.log("🤖 Testing Basic Agent");
    console.log("======================");

    try {
        // Create agent
        console.log("1. Creating basic agent...");
        const agent = new BasicAgent();
        console.log("✅ Agent created");

        // List available tools
        console.log("\n2. Getting available tools...");
        const tools = await agent.listTools();
        console.log(`✅ Agent has access to ${tools.length} tools`);
        console.log("First 5 tools:", tools.slice(0, 5).join(', '));

        // Simple question
        console.log("\n3. Asking simple question...");
        const response = await agent.ask("List 2 video assets");
        console.log("✅ Agent responded:");
        console.log(response.text);

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testBasicAgent().catch(console.error);
}

export { testBasicAgent };
import "dotenv/config";
import { mastra } from "../mastra";

async function testVideoAgent() {
    console.log("🤖 Testing Mastra Video Processing Agent");
    console.log("========================================");

    try {
        const agent = mastra.getAgent("videoProcessingAgent");

        // Test different scenarios
        const testScenarios = [
            {
                name: "Video Processing Request",
                prompt: "I need to process a video from this URL: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4. Please create a Mux asset with the title 'Big Buck Bunny Demo' and generate streaming URLs."
            },
            {
                name: "Video Information Query",
                prompt: "What video formats and resolutions does Mux support? How long does processing typically take?"
            },
            {
                name: "Streaming URL Generation",
                prompt: "I have a Mux asset ID 'abc123'. Can you help me generate HLS and DASH streaming URLs for it?"
            }
        ];

        for (const scenario of testScenarios) {
            console.log(`\n🎯 Testing: ${scenario.name}`);
            console.log("-".repeat(50));

            const response = await agent.generate(scenario.prompt);

            console.log("Agent Response:");
            console.log(response.text);

            if (response.toolCalls && response.toolCalls.length > 0) {
                console.log("\n🔧 Tools Used:");
                response.toolCalls.forEach((call, index) => {
                    console.log(`${index + 1}. ${call.toolName}`);
                    console.log(`   Arguments:`, JSON.stringify(call.args, null, 2));
                });
            }

            console.log("\n" + "=".repeat(60));
        }

    } catch (error) {
        console.error("💥 Error testing agent:", error);
    }
}

// Run the test
testVideoAgent().then(() => {
    console.log("\n🏁 Agent test completed");
    process.exit(0);
}).catch((error) => {
    console.error("💥 Agent test failed:", error);
    process.exit(1);
});
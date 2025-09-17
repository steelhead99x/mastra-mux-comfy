import { videoProcessingAgent } from "../mastra/agents/video-agent";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function agentGetRecentAssets() {
    try {
        console.log("🤖 Using video processing agent to fetch recent assets...");

        const prompt = `
    Please help me retrieve all video assets from my Mux production account that were created in the last 24 hours.
    
    For each asset found, please provide:
    - Asset ID
    - Status (waiting, preparing, ready, errored)
    - Created timestamp
    - Duration (if available)
    - Resolution and aspect ratio (if available)
    - Playback IDs and their policies
    - Any error messages (if status is errored)
    - Metadata like title or external_id (if available)
    
    Please use the appropriate Mux API tools to list the assets and filter them by creation date.
    `;

        const response = await videoProcessingAgent.generate(prompt);

        console.log("📋 Agent Response:");
        console.log("=" + "=".repeat(50));
        console.log(response.text);
        console.log("=" + "=".repeat(50));

        return response;

    } catch (error) {
        console.error("❌ Error using video agent:", error);
        throw error;
    }
}

// Run the script
if (require.main === module) {
    agentGetRecentAssets()
        .then(() => {
            console.log("\n✅ Agent request completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Agent request failed:", error);
            process.exit(1);
        });
}

export { agentGetRecentAssets };
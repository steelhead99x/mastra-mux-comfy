import "dotenv/config";
import { mastra } from "../mastra";

async function testVideoWorkflow() {
    console.log("🎬 Testing Mastra Video Processing Workflow");
    console.log("==========================================");

    try {
        const workflow = mastra.getWorkflow("videoProcessingWorkflow");
        const run = await workflow.createRunAsync();

        console.log("📹 Starting video processing...");

        // Example video URLs (replace with actual URLs)
        const testVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

        const result = await run.start({
            inputData: {
                videoUrl: testVideoUrl,
                title: "Big Buck Bunny Test Video",
                creatorId: "test-creator-123",
                externalId: "workflow-test-001",
                playbackPolicy: "public",
                generateSubtitles: true,
                testMode: true, // Free test mode
                skipValidation: false,
                maxPollingAttempts: 30,
                pollingIntervalMs: 5000
            }
        });

        console.log("\n📊 Workflow Results:");
        console.log("Status:", result.status);

        if (result.status === "success") {
            const output = result.result;
            console.log("✅ Asset ID:", output.assetId);
            console.log("🎯 Processing Status:", output.status);
            console.log("⏱️  Duration:", output.duration ? `${output.duration}s` : "Unknown");
            console.log("📐 Aspect Ratio:", output.aspectRatio || "Unknown");
            console.log("📺 Max Resolution:", output.maxStoredResolution || "Unknown");
            console.log("🎮 Playback ID:", output.playbackId || "Not available");
            console.log("🔗 HLS URL:", output.hlsUrl || "Not available");
            console.log("🖼️  Thumbnail:", output.thumbnailUrl || "Not available");
            console.log("⏳ Processing Time:", output.processingTimeMs ? `${output.processingTimeMs}ms` : "Unknown");
            console.log("🔄 Polling Attempts:", output.attempts || "Unknown");
        } else if (result.status === "failed") {
            console.error("❌ Workflow failed:", result.error);
        } else if (result.status === "suspended") {
            console.log("⏸️  Workflow suspended at steps:", result.suspended);
        }

    } catch (error) {
        console.error("💥 Error running workflow:", error);
    }
}

// Run the test
testVideoWorkflow().then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
}).catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
});
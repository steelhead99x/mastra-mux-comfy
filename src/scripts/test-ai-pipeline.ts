import "dotenv/config";
import { mastra } from "../mastra";

async function testAiVideoPipeline() {
    console.log("🎬🤖 Testing AI Video Processing Pipeline");
    console.log("=========================================");

    try {
        const workflow = mastra.getWorkflow("aiVideoProcessingPipeline");
        const run = await workflow.createRunAsync();

        console.log("📹 Starting AI-enhanced video processing...");

        const result = await run.start({
            inputData: {
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                title: "Big Buck Bunny - AI Enhanced",
                generateSubtitles: true,
                thumbnailStyle: "cinematic",
                enhanceVideo: true,
                enhancementType: "upscale",
                targetResolution: "1080p",
                testMode: true
            }
        });

        console.log("\n📊 AI Pipeline Results:");
        console.log("Status:", result.status);

        if (result.status === "success") {
            const output = result.result;
            console.log("✅ Original Asset ID:", output.originalAssetId);
            console.log("🚀 Enhanced Asset ID:", output.enhancedAssetId || "Not enhanced");
            console.log("🔗 Streaming URL:", output.hlsUrl || "Not available");
            console.log("🖼️  AI Thumbnail:", output.thumbnailUrl);
            console.log("⏱️  Thumbnail Generation:", `${output.processingDetails.thumbnailGenerationTime}s`);
            console.log("🎯 Enhancement Status:", output.processingDetails.enhancementStatus || "Not enhanced");
        } else if (result.status === "failed") {
            console.error("❌ AI Pipeline failed:", result.error);
        }

    } catch (error) {
        console.error("💥 Error running AI pipeline:", error);
    }
}

testAiVideoPipeline().then(() => {
    console.log("\n🏁 AI Pipeline test completed");
    process.exit(0);
}).catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
});
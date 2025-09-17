import { Workflow, Step } from "@mastra/core";
import { z } from "zod";

// Input schema for the workflow
const videoProcessingInputSchema = z.object({
    videoUrl: z.string().url("Must be a valid URL"),
    title: z.string().min(1, "Title is required"),
    creatorId: z.string().min(1, "Creator ID is required"),
    externalId: z.string().optional(),
    playbackPolicy: z.enum(["public", "private"]).default("public"),
    generateSubtitles: z.boolean().default(false),
    testMode: z.boolean().default(true),
    skipValidation: z.boolean().default(false),
    maxPollingAttempts: z.number().min(1).max(100).default(30),
    pollingIntervalMs: z.number().min(1000).max(30000).default(5000)
});

// Output schema for the workflow
const videoProcessingOutputSchema = z.object({
    assetId: z.string(),
    status: z.string(),
    duration: z.number().optional(),
    aspectRatio: z.string().optional(),
    maxStoredResolution: z.string().optional(),
    playbackId: z.string().optional(),
    hlsUrl: z.string().optional(),
    dashUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    processingTimeMs: z.number().optional(),
    attempts: z.number().optional(),
    createdAt: z.string().optional(),
    uploadId: z.string().optional()
});

export const videoProcessingWorkflow = new Workflow({
    name: "videoProcessingWorkflow",
    description: "Complete video processing pipeline with Mux",
    inputSchema: videoProcessingInputSchema,
    outputSchema: videoProcessingOutputSchema,
    execute: async ({ input, context }) => {
        console.log("🎬 Starting video processing workflow...");

        try {
            // Access Mux MCP client from context
            const muxClient = context.mcpClients?.mux;
            if (!muxClient) {
                throw new Error('Mux MCP client not available');
            }

            // Step 1: Validate video URL (if not skipped)
            if (!input.skipValidation) {
                console.log("📋 Step 1: Validating video URL...");
                try {
                    const url = new URL(input.videoUrl);
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        throw new Error('URL must use HTTP or HTTPS protocol');
                    }
                } catch (error) {
                    throw new Error(`Invalid video URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // Step 2: Create Mux asset
            console.log("🎯 Step 2: Creating Mux asset...");
            const createAssetResult = await muxClient.callTool('create_asset', {
                input: [{
                    url: input.videoUrl
                }],
                playback_policy: [input.playbackPolicy],
                test: input.testMode,
                external_id: input.externalId,
                metadata: {
                    title: input.title,
                    creator_id: input.creatorId
                }
            });

            if (!createAssetResult.content?.[0]?.asset?.id) {
                throw new Error('Failed to create Mux asset');
            }

            const asset = createAssetResult.content[0].asset;
            const assetId = asset.id;

            // Step 3: Monitor processing
            console.log("⏳ Step 3: Monitoring processing status...");
            const startTime = Date.now();
            let attempts = 0;
            let finalAsset = asset;

            while (attempts < input.maxPollingAttempts) {
                attempts++;

                // Get current asset status
                const assetResult = await muxClient.callTool('get_asset', {
                    asset_id: assetId
                });

                if (!assetResult.content?.[0]?.asset) {
                    throw new Error('Asset not found');
                }

                finalAsset = assetResult.content[0].asset;
                const status = finalAsset.status;

                console.log(`🔄 Polling attempt ${attempts}: Asset status is "${status}"`);

                if (status === 'ready') {
                    break;
                }

                if (status === 'errored') {
                    throw new Error(`Asset processing failed: ${finalAsset.error_message || 'Unknown error'}`);
                }

                // Wait before next attempt
                if (attempts < input.maxPollingAttempts) {
                    await new Promise(resolve => setTimeout(resolve, input.pollingIntervalMs));
                }
            }

            // Step 4: Generate playback URLs (if asset is ready)
            let playbackId: string | undefined;
            let hlsUrl: string | undefined;
            let dashUrl: string | undefined;
            let thumbnailUrl: string | undefined;

            if (finalAsset.status === 'ready') {
                console.log("🎮 Step 4: Generating playback URLs...");

                const playbackIds = finalAsset.playback_ids || [];

                if (playbackIds.length === 0) {
                    // Create a playback ID if none exists
                    const createPlaybackIdResult = await muxClient.callTool('create_asset_playback_id', {
                        asset_id: assetId,
                        policy: input.playbackPolicy
                    });

                    if (createPlaybackIdResult.content?.[0]?.playback_id) {
                        playbackIds.push(createPlaybackIdResult.content[0].playback_id);
                    }
                }

                if (playbackIds.length > 0) {
                    playbackId = playbackIds[0].id;
                    hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
                    dashUrl = `https://stream.mux.com/${playbackId}.mpd`;
                    thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
                }
            }

            // Return final results
            const result = {
                assetId: assetId,
                status: finalAsset.status,
                duration: finalAsset.duration,
                aspectRatio: finalAsset.aspect_ratio,
                maxStoredResolution: finalAsset.max_stored_resolution,
                playbackId: playbackId,
                hlsUrl: hlsUrl,
                dashUrl: dashUrl,
                thumbnailUrl: thumbnailUrl,
                processingTimeMs: Date.now() - startTime,
                attempts: attempts,
                createdAt: finalAsset.created_at,
                uploadId: finalAsset.upload_id
            };

            console.log("✅ Video processing workflow completed!");
            return result;

        } catch (error) {
            console.error("❌ Workflow failed:", error);
            throw error;
        }
    }
});
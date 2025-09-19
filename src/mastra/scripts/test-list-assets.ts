import dotenv from "dotenv";
import path from "path";
import { muxMcpClient } from "../mcp/mux-client";

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface AssetMetadata {
    id: string;
    upload_id?: string;
    status: string;
    duration?: number;
    created_at: string;
    [key: string]: any; // Allow for other properties
}

async function simpleListAssetsTest() {
    console.log("📼 Simple List Assets Test");
    console.log("==========================");

    // 1) Check credentials
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
        console.log("❌ Missing MUX credentials.");
        console.log("Ensure .env has:");
        console.log("MUX_TOKEN_ID=...");
        console.log("MUX_TOKEN_SECRET=...");
        process.exit(1);
    }

    let success = false;

    try {
        // 2) Get MCP meta-tools
        const tools = await muxMcpClient.getTools();
        const toolNames = Object.keys(tools);
        console.log(`✅ Connected - ${toolNames.length} tools available`);
        console.log("Available tools:", toolNames.join(", "));

        // 3) Use list_api_endpoints to find video assets endpoint
        if (tools.list_api_endpoints) {
            console.log("🔍 Discovering video asset endpoints...");

            // Use .execute() for Mastra tools, not .call()
            const endpointsResult = await tools.list_api_endpoints.execute({
                context: { search_query: "video_asset" }
            });

            console.log("📋 Video asset endpoints found:");
            console.log(JSON.stringify(endpointsResult, null, 2));

            // 4) Look for list_video_assets endpoint
            let foundListAssets = false;
            if (endpointsResult?.tools && Array.isArray(endpointsResult.tools)) {
                const endpoints = endpointsResult.tools;
                const listAssetsEndpoint = endpoints.find(ep =>
                    ep.name === "list_video_assets" ||
                    (ep.name && ep.name.includes("list") && ep.name.includes("asset"))
                );

                if (listAssetsEndpoint) {
                    console.log(`✅ Found endpoint: ${listAssetsEndpoint.name}`);

                    // 5) Get the schema for the endpoint
                    if (tools.get_api_endpoint_schema) {
                        console.log("📝 Getting endpoint schema...");
                        const schemaResult = await tools.get_api_endpoint_schema.execute({
                            context: { endpoint: listAssetsEndpoint.name }
                        });

                        console.log("Schema:", JSON.stringify(schemaResult, null, 2));

                        // 6) Now invoke the actual endpoint
                        if (tools.invoke_api_endpoint) {
                            console.log("🚀 Invoking list_video_assets endpoint...");
                            const assetsResult = await tools.invoke_api_endpoint.execute({
                                context: {
                                    endpoint_name: listAssetsEndpoint.name,
                                    args: { limit: 3 }
                                }
                            });

                            console.log("✅ Assets retrieved successfully!");
                            console.log("Result type:", typeof assetsResult);
                            console.log("Assets result:", JSON.stringify(assetsResult, null, 2));

                            // 7) Extract and analyze assets
                            let assets: AssetMetadata[] = [];
                            if (assetsResult?.data && Array.isArray(assetsResult.data)) {
                                assets = assetsResult.data;
                            } else if (Array.isArray(assetsResult)) {
                                assets = assetsResult;
                            }

                            if (assets.length > 0) {
                                console.log(`📋 Found ${assets.length} assets (preview)`);

                                // Show structure info
                                console.log("\n📝 Asset Structure Analysis:");
                                const sampleAsset = assets[0];
                                console.log("Available fields:", Object.keys(sampleAsset));

                                if (sampleAsset.upload_id) {
                                    console.log("✅ upload_id field found");
                                } else {
                                    console.log("⚠️ No upload_id field in assets");
                                }

                                // Show sample asset
                                console.log("\n📋 Sample Asset:");
                                console.log(JSON.stringify(sampleAsset, null, 2));
                            }

                            foundListAssets = true;
                            success = true;
                        }
                    }
                }
            }

            if (!foundListAssets) {
                console.log("⚠️ Could not find list_video_assets endpoint");
                console.log("Available endpoints:", endpointsResult);
            }
        } else {
            console.log("❌ list_api_endpoints tool not available");
        }

    } catch (err: any) {
        console.error("❌ Test failed:", err.message || err);
        if (String(err.message || "").toLowerCase().includes("unauthorized")) {
            console.log("🔑 Check your MUX credentials and permissions.");
        }
        console.error("Full error:", err);
    } finally {
        // 5) Clean disconnect
        try {
            await muxMcpClient.disconnect();
        } catch {
            // ignore close errors
        }
        process.exit(success ? 0 : 1);
    }
}

async function getAllAssets() {
    console.log("📼 Getting All Mux Assets");
    console.log("=========================");

    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
        console.log("❌ Missing MUX credentials.");
        console.log("Ensure .env has:");
        console.log("MUX_TOKEN_ID=...");
        console.log("MUX_TOKEN_SECRET=...");
        process.exit(1);
    }

    const allAssets: AssetMetadata[] = [];
    let hasMore = true;
    let cursor: string | undefined;
    let page = 1;

    try {
        const tools = await muxMcpClient.getTools();
        console.log(`✅ Connected - ${Object.keys(tools).length} MCP meta-tools available`);

        // Use the meta-tools approach for pagination
        while (hasMore && page <= 10) { // Safety limit
            console.log(`📄 Fetching page ${page}...`);

            const params: any = { limit: 100 };
            if (cursor) {
                params.cursor = cursor;
            }

            // Use execute() for Mastra tools instead of call()
            const result = await tools.invoke_api_endpoint.execute({
                context: {
                    endpoint_name: "list_video_assets",
                    args: params
                }
            });

            // Handle different response structures dynamically
            let assets: AssetMetadata[] = [];
            let nextCursor: string | undefined;

            if (result?.data && Array.isArray(result.data)) {
                assets = result.data;
                nextCursor = result.next_cursor;
            } else if (Array.isArray(result)) {
                assets = result;
            } else {
                console.log("Unexpected response structure:", typeof result);
                console.log("Raw result:", JSON.stringify(result, null, 2));
                break;
            }

            if (assets.length > 0) {
                allAssets.push(...assets);
                console.log(`✅ Page ${page}: Found ${assets.length} assets (Total: ${allAssets.length})`);

                // Check for more pages
                if (nextCursor) {
                    cursor = nextCursor;
                    page++;
                } else if (assets.length === 100) {
                    // Try page-based pagination
                    page++;
                } else {
                    hasMore = false;
                }
            } else {
                console.log("No more assets found");
                hasMore = false;
            }

            // Rate limiting delay
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`\n📊 Final Results: ${allAssets.length} total assets`);

        if (allAssets.length > 0) {
            // Analyze the structure
            const sampleAsset = allAssets[0];
            console.log("\n📝 Asset Fields Available:");
            console.log(Object.keys(sampleAsset));

            // Extract upload_ids if they exist
            const uploadIds = allAssets
                .map(asset => asset.upload_id)
                .filter(id => id !== undefined && id !== null);

            console.log(`📋 Upload IDs found: ${uploadIds.length}`);

            // Extract all asset IDs
            const assetIds = allAssets
                .map(asset => asset.id)
                .filter(id => id !== undefined && id !== null);

            console.log(`🆔 Asset IDs found: ${assetIds.length}`);

            // Output as JSON arrays as requested
            if (uploadIds.length > 0) {
                console.log("\n📝 Upload IDs JSON Array:");
                console.log(JSON.stringify(uploadIds, null, 2));
            }

            console.log("\n🆔 Asset IDs JSON Array:");
            console.log(JSON.stringify(assetIds, null, 2));

            // Show sample asset for reference
            console.log("\n📋 Sample Asset:");
            console.log(JSON.stringify(allAssets[0], null, 2));
        }

        return {
            totalAssets: allAssets.length,
            uploadIds: allAssets.map(asset => asset.upload_id).filter(Boolean),
            assetIds: allAssets.map(asset => asset.id).filter(Boolean),
            allAssets
        };

    } catch (err: any) {
        console.error("❌ Failed to get assets:", err.message || err);
        if (String(err.message || "").toLowerCase().includes("unauthorized")) {
            console.log("🔑 Check your MUX credentials and permissions.");
        }
        console.error("Full error:", err);
        throw err;
    } finally {
        try {
            await muxMcpClient.disconnect();
        } catch {
            // ignore close errors
        }
    }
}

// Command line argument parsing
const args = process.argv.slice(2);
const command = args[0];

if (import.meta.url === `file://${process.argv[1]}`) {
    if (command === "all" || command === "--all") {
        getAllAssets().catch((e) => {
            console.error("❌ Unexpected error:", e);
            process.exit(1);
        });
    } else {
        simpleListAssetsTest().catch((e) => {
            console.error("❌ Unexpected error:", e);
            process.exit(1);
        });
    }
}

export { simpleListAssetsTest, getAllAssets };
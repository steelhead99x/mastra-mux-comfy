import 'dotenv/config';
import { generateText } from 'ai';
import { model, MODEL_NAME, LMSTUDIO_BASE_URL } from '../models/lmstudio';

async function main() {
    console.log('Testing LM Studio provider...');
    console.log(`Base URL: ${LMSTUDIO_BASE_URL}`);
    console.log(`Model: ${MODEL_NAME}`);

    try {
        const { text, usage } = await generateText({
            model: model,
            prompt: 'In one concise sentence, explain how mux video services can be beneficial.',
        });

        console.log('\nResponse:\n', text);
        if (usage) {
            console.log('\nToken usage:', usage);
        }
        console.log('\nSuccess: LM Studio call completed.');
    } catch (err) {
        console.error('\nError calling LM Studio:', err);
        process.exit(1);
    }

    // After LLM test, run the advanced Mux MCP test
    await advancedMuxMcpListAssetsTest();
}

main();

// Advanced test: use MCP tools to discover and invoke Mux list assets API
// Replace direct MCPClient usage with the shared muxMcpClient wrapper
import { muxMcpClient } from '../mcp/mux-client';

type AssetMetadata = {
  id?: string;
  upload_id?: string;
  [key: string]: unknown;
};

async function advancedMuxMcpListAssetsTest() {
  console.log('\n==============================');
  console.log('📼 Advanced Mux MCP Assets Test');
  console.log('==============================');

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.log('❌ Missing MUX credentials.');
    console.log('Ensure .env has:');
    console.log('MUX_TOKEN_ID=...');
    console.log('MUX_TOKEN_SECRET=...');
    return; // Do not exit the whole script; skip advanced test instead
  }

  let success = false;

  try {
    // Use the shared muxMcpClient which manages connection, args, and schema conversion
    const tools = await muxMcpClient.getTools();
    const toolNames = Object.keys(tools);
    console.log(`✅ Connected - ${toolNames.length} tools available`);
    console.log('Available tools:', toolNames.join(', '));

    // Discover list-assets endpoint
    let endpointName: string | undefined;

    if (tools.list_api_endpoints) {
      console.log('🔍 Discovering asset endpoints...');
      const endpointsResult = await tools.list_api_endpoints.execute({
        context: { search_query: 'video.assets' },
      });

      // Normalize possible shapes:
      // - { tools: [...] }
      // - Array<{ name?: string }>
      // - Array<{ type: 'text', text: '{ "tools": [...] }' }>
      let candidates: Array<{ name?: string }> = [];

      if (Array.isArray((endpointsResult as any)?.tools)) {
        candidates = (endpointsResult as any).tools;
      } else if (Array.isArray(endpointsResult)) {
        // If array of text chunks, try to parse JSON
        const textChunk = (endpointsResult as any[]).find(
          (c: any) => c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string'
        );
        if (textChunk?.text) {
          try {
            const parsed = JSON.parse(textChunk.text);
            if (Array.isArray(parsed?.tools)) {
              candidates = parsed.tools;
            }
          } catch {
            // fall back to treating array as candidates if shaped that way
            candidates = (endpointsResult as any[]).filter(
              (c: any) => c && typeof c.name === 'string'
            );
          }
        } else {
          candidates = (endpointsResult as any[]).filter(
            (c: any) => c && typeof c.name === 'string'
          );
        }
      }

      // Prefer explicit list endpoints, else fall back to retrieve_video_assets
      const preferredList = [
        'list_video_assets',
        'list_assets_api',
        'list_assets',
        'list_mux_assets',
      ];

      endpointName =
        candidates
          .map((c) => c?.name)
          .find((n) => n && preferredList.includes(n)) ||
        candidates
          .map((c) => c?.name)
          .find((n) => n && n.includes('list') && n.includes('asset')) ||
        candidates
          .map((c) => c?.name)
          .find((n) => n === 'retrieve_video_assets');

      if (!endpointName) {
        console.log('⚠️ Could not find a relevant assets endpoint from discovery.');
        console.log('Endpoints result:', JSON.stringify(endpointsResult, null, 2));
        return;
      }

      console.log(`✅ Selected endpoint: ${endpointName}`);
    } else {
      // If discovery tool is unavailable, try common names directly
      const fallbacks = ['list_video_assets', 'list_assets_api', 'retrieve_video_assets'];
      endpointName = fallbacks.find((n) => (tools as any)[n]);
      if (!endpointName) {
        console.log('❌ list_api_endpoints tool not available and no known endpoint found.');
        return;
      }
      console.log(`ℹ️ Discovery not available. Trying endpoint: ${endpointName}`);
    }

    // Get endpoint schema if available
    if (tools.get_api_endpoint_schema) {
      console.log('📝 Getting endpoint schema...');
      const schemaResult = await tools.get_api_endpoint_schema.execute({
        context: { endpoint: endpointName },
      });
      console.log('Schema:', JSON.stringify(schemaResult, null, 2));
    }

    if (!tools.invoke_api_endpoint) {
      console.log('❌ invoke_api_endpoint tool not available');
      return;
    }

    // Invoke the endpoint. If it's a list endpoint, use pagination params.
    // If it's retrieve_video_assets, require an asset_id from env.
    console.log('🚀 Invoking assets endpoint...');
    let invokeArgs: Record<string, unknown> = {};
    if (endpointName.includes('list')) {
      invokeArgs = { limit: 5 };
    } else if (endpointName === 'retrieve_video_assets') {
      const assetId =
        process.env.MUX_ASSET_ID ||
        process.env.SAMPLE_ASSET_ID ||
        process.env.MUX_SAMPLE_ASSET_ID;
      if (!assetId) {
        console.log('⚠️ retrieve_video_assets requires an asset ID.');
        console.log('Set one of these env vars: MUX_ASSET_ID, SAMPLE_ASSET_ID, or MUX_SAMPLE_ASSET_ID');
        return;
      }
      // Common param names used by retrieve endpoints
      invokeArgs = { asset_id: assetId, id: assetId };
    } else {
      // Default to limit if unknown
      invokeArgs = { limit: 5 };
    }

    const assetsResult = await tools.invoke_api_endpoint.execute({
      context: {
        endpoint_name: endpointName,
        args: invokeArgs,
      },
    });

    // Normalize result to an array of assets when possible
    let assets: AssetMetadata[] = [];
    let nextCursor: string | undefined;

    // Case A: Proper object shape { data: [...], next_cursor }
    if ((assetsResult as any)?.data && Array.isArray((assetsResult as any).data)) {
      assets = (assetsResult as any).data;
      nextCursor = (assetsResult as any).next_cursor;
    // Case B: Already an array of assets
    } else if (Array.isArray(assetsResult as any) && (assetsResult as any).length > 0 && !(assetsResult as any)[0]?.type) {
      assets = assetsResult as AssetMetadata[];
    // Case C: Content chunks like [{ type: 'text', text: '{ "data": [...] }' }]
    } else if (Array.isArray(assetsResult as any)) {
      const textChunk = (assetsResult as any[]).find(
        (c: any) => c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string'
      );
      if (textChunk?.text) {
        try {
          const parsed = JSON.parse(textChunk.text);
          if (Array.isArray(parsed?.data)) {
            assets = parsed.data as AssetMetadata[];
            if (typeof parsed.next_cursor === 'string') {
              nextCursor = parsed.next_cursor;
            }
          } else if (parsed && typeof parsed === 'object') {
            // Some endpoints may return a single object; wrap it
            assets = [parsed as AssetMetadata];
          }
        } catch (e) {
          console.log('⚠️ Failed to parse text chunk as JSON:', (e as Error).message);
        }
      }
    // Case D: Single object (e.g., retrieve endpoint)
    } else if (assetsResult && typeof assetsResult === 'object' && endpointName === 'retrieve_video_assets') {
      assets = [assetsResult as AssetMetadata];
    } else {
      console.log('Unexpected response structure:', typeof assetsResult);
      console.log('Raw result:', JSON.stringify(assetsResult, null, 2));
      return;
    }

    console.log('✅ Assets retrieved successfully!');
    console.log(`📋 Found ${assets.length} asset${assets.length === 1 ? '' : 's'} (preview)`);

    if (assets.length > 0) {
      const sample = assets[0];
      console.log('\n📝 Asset fields:', Object.keys(sample));
      console.log('\n📋 Sample Asset:');
      console.log(JSON.stringify(sample, null, 2));

      const uploadIds = assets.map((a) => a.upload_id).filter(Boolean) as string[];
      const assetIds = assets.map((a) => a.id).filter(Boolean) as string[];

      console.log(`\n🧮 Upload IDs found: ${uploadIds.length}`);
      console.log(`\n🧮 Asset IDs found: ${assetIds.length}`);

      if (uploadIds.length > 0) {
        console.log('\n📝 Upload IDs JSON Array:');
        console.log(JSON.stringify(uploadIds, null, 2));
      }

      console.log('\n🆔 Asset IDs JSON Array:');
      console.log(JSON.stringify(assetIds, null, 2));
    }

    // If there is a cursor, show that pagination could continue
    if (nextCursor) {
      console.log(`\n🔁 next_cursor present: ${nextCursor}`);
      console.log('You can continue pagination by passing this cursor in args.');
    }

    success = true;
  } catch (err: any) {
    console.error('❌ Advanced Mux MCP test failed:', err?.message || err);
    if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
      console.log('🔑 Check your MUX credentials and permissions.');
    }
    console.error('Full error:', err);
  } finally {
    try {
      await muxMcpClient.disconnect();
    } catch {
      // ignore close errors
    }
    console.log(success ? '✅ Advanced test complete.' : '⚠️ Advanced test finished with issues.');
  }
}

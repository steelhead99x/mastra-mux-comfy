import { muxMcpClient } from "../mcp/mux-client";
import { OllamaProvider } from "../models/ollama-provider";
import { MuxAsset } from "../../types/mux";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Agent } from "@mastra/core/agent";

// Working implementation based on test-mux.ts patterns
class DirectMuxAssetManager {
    private ollamaProvider: OllamaProvider;
    private tools: Record<string, any> = {};
    private toolsLoaded: boolean = false;

    constructor() {
        this.ollamaProvider = new OllamaProvider(
            process.env.OLLAMA_BASE_URL || "http://192.168.88.16:11434"
        );
    }

    private async initializeTools() {
        if (this.toolsLoaded) return;

        try {
            // Use the same pattern as test-mux.ts
            const toolsResult = await muxMcpClient.getTools();

            if (!toolsResult || typeof toolsResult !== 'object') {
                throw new Error("Failed to get tools from MCP client");
            }

            this.tools = toolsResult;
            const toolNames = Object.keys(this.tools);
            console.log(`📚 Loaded ${toolNames.length} Mux MCP tools`);

            if (toolNames.length > 0) {
                console.log(`🔍 Available tools: ${toolNames.slice(0, 5).join(', ')}${toolNames.length > 5 ? '...' : ''}`);

                // Look for asset/video related tools
                const assetTools = toolNames.filter(name =>
                    name.toLowerCase().includes('asset') ||
                    name.toLowerCase().includes('video') ||
                    name.includes('list_') ||
                    name.includes('retrieve_')
                );

                if (assetTools.length > 0) {
                    console.log(`🎯 Found ${assetTools.length} asset-related tools`);
                }
            } else {
                console.log("⚠️  No MCP tools loaded - responses will be simulated");
            }
        } catch (error) {
            console.error("Failed to load MCP tools:", error);
            this.tools = {};
            console.log("⚠️  MCP tools unavailable - responses will be simulated");
        }

        this.toolsLoaded = true;
    }

    private async tryExecuteActualMuxAPI(operation: string, params: any = {}): Promise<any> {
        await this.initializeTools();

        const toolNames = Object.keys(this.tools);

        // Find relevant tools based on operation
        let relevantTool = null;

        if (operation.includes('list') || operation.includes('assets')) {
            relevantTool = toolNames.find(name =>
                name.includes('list_assets') ||
                name.includes('list_video') ||
                name.includes('assets') ||
                name.includes('list')
            );
        } else if (operation.includes('search')) {
            relevantTool = toolNames.find(name =>
                name.includes('search') ||
                name.includes('list_assets') ||
                name.includes('assets')
            );
        }

        if (relevantTool && this.tools[relevantTool]) {
            try {
                console.log(`🔧 Attempting to execute Mux API: ${relevantTool}`);

                const tool = this.tools[relevantTool];
                let result;

                // Try different execution methods (same as test-mux.ts)
                if (typeof tool.call === 'function') {
                    result = await tool.call(params);
                } else if (typeof tool.execute === 'function') {
                    result = await tool.execute(params);
                } else if (typeof tool.run === 'function') {
                    result = await tool.run(params);
                }

                if (result) {
                    console.log("✅ Real Mux API data retrieved successfully");
                    return result;
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.log(`⚠️  Mux API call failed: ${errorMessage.substring(0, 100)}`);

                // If it's an auth error, we know the connection works
                if (errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('403')) {
                    console.log("🔑 API connection working but check credentials");
                }
            }
        }

        return null;
    }

    private async processWithOllamaAndAPI(prompt: string, operation: string): Promise<{ text: string }> {
        // Try to get real data from Mux API first
        const realData = await this.tryExecuteActualMuxAPI(operation);

        const model = process.env.OLLAMA_MODEL || "gpt-oss:20b";

        // Build context with available tools and real data if available
        const toolNames = Object.keys(this.tools);
        const toolsInfo = toolNames.length > 0
            ? toolNames.slice(0, 10).map(name => `- ${name}`).join('\n')
            : "- get_api_endpoint_schema\n- list_api_endpoints\n- invoke_api_endpoint";

        const dataContext = realData ?
            `\nREAL MUX DATA RETRIEVED:\n${JSON.stringify(realData, null, 2)}\n` :
            `\nNote: No real Mux data available. This could be due to:
            1. Invalid or missing Mux API credentials
            2. MCP server connection issues  
            3. API endpoint access restrictions
            
            Providing simulated example data instead.`;

        const systemPrompt = `
You are a Mux Asset Manager with access to the Mux API through MCP tools.

Available MCP tools:
${toolsInfo}
${dataContext}

You can analyze video assets, provide detailed reports, and manage Mux video collections.

${realData ? 'Use the real Mux data provided above to answer the user\'s request.' : 'Since real data is not available, provide a comprehensive example response showing what the system would return with actual Mux assets.'}

User request: ${prompt}
        `;

        try {
            console.log("🤖 Processing with Ollama...");
            const response = await this.ollamaProvider.generate(systemPrompt, model);
            console.log("✅ Ollama response received");
            
            // Log if we're using real vs simulated data
            if (realData) {
                console.log("🎯 Response based on REAL Mux API data");
            } else {
                console.log("⚠️  Response is SIMULATED - check Mux credentials for real data");
            }
            
            return response;
        } catch (error) {
            console.error("❌ Ollama generation error:", error);
            return {
                text: `❌ Error processing request: ${error.message}\n\nNote: Unable to connect to Ollama server. Please check:\n1. Ollama is running\n2. Model is available\n3. Network connectivity`
            };
        }
    }
}

// Updated MuxAssetManager using the working patterns
export class MuxAssetManager {
    private directManager: DirectMuxAssetManager;

    constructor() {
        this.directManager = new DirectMuxAssetManager();
    }

    async listAllAssets(options: {
        limit?: number;
        includeDetails?: boolean;
        filterByStatus?: string;
        filterByDate?: { after?: string; before?: string };
    } = {}) {
        const prompt = `
Please list all video assets from my Mux account with the following requirements:

${options.limit ? `- Limit results to ${options.limit} assets` : '- Show all available assets'}
${options.includeDetails ? '- Include full technical details for each asset' : '- Provide summary information'}
${options.filterByStatus ? `- Only show assets with status: ${options.filterByStatus}` : '- Include assets with all statuses'}
${options.filterByDate?.after ? `- Only show assets created after: ${options.filterByDate.after}` : ''}
${options.filterByDate?.before ? `- Only show assets created before: ${options.filterByDate.before}` : ''}

For each asset, please provide:
1. Asset ID and current status
2. Creation timestamp and last update
3. Duration and technical specifications
4. Playback IDs and access policies
5. Processing errors (if any)
6. Metadata and custom fields

Please organize the results by status and provide a summary at the end.
    `;

        return await this.directManager.processWithOllamaAndAPI(prompt, "list_assets");
    }

    async searchAssets(query: string) {
        const prompt = `
Please search for video assets matching the query: "${query}"

Search criteria should include:
- Asset titles and metadata
- External IDs and custom fields
- Asset IDs (partial matches)
- Creation dates if query contains dates
- Technical specifications if relevant

For matching assets, provide:
- Asset ID and title
- Creation date and status
- Key technical details
- Playback information
- Relevance score/explanation

If no exact matches found, suggest similar assets or alternative search terms.

Use Mux MCP tools to search through all available assets.
    `;

        return await this.directManager.processWithOllamaAndAPI(prompt, "search_assets");
    }

    async getRecentAssets(hours: number = 24) {
        const prompt = `
Please find and analyze all video assets created in the last ${hours} hours.

Provide a comprehensive report including:

1. ASSET INVENTORY:
   - Total count of new assets
   - Status breakdown (ready, preparing, errored, waiting)
   - Size and duration statistics

2. DETAILED ASSET LIST:
   For each asset show:
   - Asset ID and creation time
   - Current processing status
   - Duration and resolution details
   - Playback URLs (if ready)
   - Any error messages or issues

3. ANALYSIS & INSIGHTS:
   - Processing success rate
   - Average processing time
   - Common issues or patterns
   - Recommendations for optimization

4. ACTIONABLE ITEMS:
   - Assets requiring attention
   - Failed uploads to investigate
   - Ready assets for distribution

Please use the available Mux MCP tools to fetch real-time data.
    `;

        return await this.directManager.processWithOllamaAndAPI(prompt, "list_recent_assets");
    }

    async getAssetDetails(assetId: string) {
        const prompt = `
Please retrieve comprehensive details for Mux asset ID: ${assetId}

Include all available information:
- Basic asset properties (ID, status, timestamps)
- Technical specifications (duration, resolution, codec details)
- All playback IDs and their policies
- Track information (video, audio, text tracks)
- Processing history and any errors
- Metadata and custom fields
- Available static renditions
- Analytics and usage data if available

Also provide:
- Streaming URLs for different formats
- Thumbnail and preview URLs
- Recommendations for optimization
- Troubleshooting tips if there are issues

Use the appropriate Mux MCP tools to gather this information.
    `;

        return await this.directManager.processWithOllamaAndAPI(prompt, "get_asset_details");
    }

    async getAssetsByStatus(status: 'ready' | 'preparing' | 'errored' | 'waiting') {
        const prompt = `
Please find all video assets with status "${status}" in my Mux account.

Provide detailed analysis:

1. ASSET COUNT & OVERVIEW:
   - Total number of ${status} assets
   - Percentage of total asset collection
   - Creation date range for these assets

2. DETAILED LISTING:
   For each ${status} asset:
   - Asset ID and creation time
   - Duration and technical specs
   - ${status === 'errored' ? 'Error details and potential solutions' : ''}
   - ${status === 'ready' ? 'Playback URLs and distribution info' : ''}
   - ${status === 'preparing' ? 'Estimated completion time' : ''}

3. RECOMMENDATIONS:
   - ${status === 'errored' ? 'Steps to resolve errors' : ''}
   - ${status === 'ready' ? 'Optimization opportunities' : ''}
   - Best practices for future uploads

Use Mux MCP tools to fetch current data from the API.
    `;

        return await this.directManager.processWithOllamaAndAPI(prompt, "list_assets_by_status");
    }

    async getAssetsByDateRange(startDate: string, endDate: string) {
        const prompt = `
Please retrieve all video assets created between ${startDate} and ${endDate}.

For each asset found, provide:
- Complete asset information
- Processing timeline and current status
- Playback configuration and URLs
- Any issues or recommendations

Group the results by day and provide analytics:
- Total assets created per day
- Status distribution
- Average processing time
- Common patterns or issues

Include actionable insights about the asset collection.
    `;

        return await this.directManager.processWithOllamaAndAPI(prompt, "list_assets_by_date");
    }

    async generateAssetReport() {
        const prompt = `
Please generate a comprehensive report about all video assets in my Mux account.

REPORT SECTIONS:

1. EXECUTIVE SUMMARY:
   - Total asset count
   - Storage usage overview
   - Processing success rate
   - Overall account health

2. ASSET DISTRIBUTION:
   - Assets by status (ready, preparing, errored, waiting)
   - Assets by creation date (last 7 days, 30 days, older)
   - Assets by duration (short <1min, medium 1-10min, long >10min)
   - Assets by resolution tiers

3. PERFORMANCE METRICS:
   - Average processing time
   - Success/failure rates
   - Most common error types
   - Delivery performance stats

4. CONTENT ANALYSIS:
   - Most popular content (by views if available)
   - Content with issues needing attention
   - Unused or underutilized assets

5. RECOMMENDATIONS:
   - Account optimization opportunities
   - Content management best practices
   - Cost optimization suggestions
   - Technical improvements needed

6. ACTION ITEMS:
   - Immediate issues to resolve
   - Assets to review or update
   - Workflow improvements to implement

Use all available Mux MCP tools to gather comprehensive data for this report.
    `;

        return await this.directManager.processWithOllamaAndAPI(prompt, "generate_asset_report");
    }
}

// Export compatible agent factory using OpenAI-compatible provider
export async function createMuxAssetManagerAgent() {
    // Create OpenAI-compatible provider for Ollama
    const ollama = createOpenAICompatible({
        name: 'ollama',
        baseUrl: `${process.env.OLLAMA_BASE_URL || "http://192.168.88.16:11434"}/v1`,
        apiKey: 'not-needed', // Ollama doesn't require API key
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Create and return proper Agent instance
    return new Agent({
        name: "Mux Asset Manager Agent",
        description: "AI agent for managing Mux video assets with MCP tools",
        instructions: "You are a video asset management specialist with access to Mux API tools through MCP.",
        model: ollama(process.env.OLLAMA_MODEL || "gpt-oss:20b"),
        tools: {}
    });
}
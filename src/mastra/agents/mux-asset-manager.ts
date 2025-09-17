import { Agent } from "@mastra/core/agent";
import { muxMcpClient } from "../mcp/mux-client";
import { createOllamaModel } from "../models/ollama-model";
import { MuxAsset } from "../../types/mux";

const ollamaModel = createOllamaModel({
    model: process.env.OLLAMA_MODEL || "gpt-oss:20b",
    baseURL: process.env.OLLAMA_BASE_URL || "http://192.168.88.16:11434",
    temperature: 0.3,
    maxTokens: 4096
});

// Create agent factory function instead of top-level await
async function createMuxAssetManagerAgent() {
    const tools = await muxMcpClient.getTools();

    return new Agent({
        name: "Mux Asset Manager",
        description: "AI agent specialized in managing and retrieving Mux video assets",
        instructions: `
You are a Mux Asset Manager with access to the complete Mux API through MCP tools.

Your primary capabilities:
- List all video assets from Mux account
- Retrieve detailed information about specific assets
- Filter assets by creation date, status, or other criteria
- Analyze asset metadata, playback information, and processing status
- Provide insights about video collection and usage patterns
- Generate detailed reports about asset collections

Available Mux MCP Tools (use dynamically):
- Asset listing and retrieval tools
- Asset creation and management tools  
- Playback ID management tools
- Live stream management tools
- Upload management tools
- Analytics and metrics tools

Key Guidelines:
1. Always use the available MCP tools to fetch real data from Mux
2. When listing assets, provide comprehensive details including:
   - Asset ID and status
   - Creation and update timestamps
   - Duration, resolution, and technical specs
   - Playback IDs and access policies
   - Error information if applicable
   - Metadata like titles and external IDs
3. Filter and organize results in a user-friendly way
4. Handle pagination when dealing with large asset collections
5. Provide actionable insights and recommendations
6. Format responses clearly with proper categorization

Response Format Guidelines:
- Use clear headers and sections
- Include asset counts and summaries
- Show status distributions (ready, preparing, errored)
- Highlight recent additions or changes
- Provide streaming URLs when relevant
- Include troubleshooting tips for errored assets

Always be thorough, accurate, and helpful in managing Mux assets.
`,
        model: ollamaModel as any,
        tools: tools
    });
}

// Utility class for the agent
export class MuxAssetManager {
    private agent: Agent | null = null;

    private async getAgent(): Promise<Agent> {
        if (!this.agent) {
            this.agent = await createMuxAssetManagerAgent();
        }
        return this.agent;
    }

    async listAllAssets(options: {
        limit?: number;
        includeDetails?: boolean;
        filterByStatus?: string;
        filterByDate?: { after?: string; before?: string };
    } = {}) {
        const agent = await this.getAgent();
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

        const response = await agent.generate(prompt);
        return response;
    }

    async getAssetsByDateRange(startDate: string, endDate: string) {
        const agent = await this.getAgent();
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

        const response = await agent.generate(prompt);
        return response;
    }

    async getRecentAssets(hours: number = 24) {
        const agent = await this.getAgent();
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

Please use the Mux MCP tools to fetch real-time data.
    `;

        const response = await agent.generate(prompt);
        return response;
    }

    async getAssetDetails(assetId: string) {
        const agent = await this.getAgent();
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

        const response = await agent.generate(prompt);
        return response;
    }

    async getAssetsByStatus(status: 'ready' | 'preparing' | 'errored' | 'waiting') {
        const agent = await this.getAgent();
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

        const response = await agent.generate(prompt);
        return response;
    }

    async generateAssetReport() {
        const agent = await this.getAgent();
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

        const response = await agent.generate(prompt);
        return response;
    }

    async searchAssets(query: string) {
        const agent = await this.getAgent();
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

        const response = await agent.generate(prompt);
        return response;
    }
}

// Export the agent factory function for use in tests
export { createMuxAssetManagerAgent };
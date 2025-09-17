import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { muxMcpClient } from "../mcp/mux-client";
import { generateStreamingUrlTool, validateVideoUrlTool } from "../tools";

export const videoProcessingAgent = new Agent({
    name: "Video Processing Agent",
    description: "AI agent specialized in video processing and management using Mux",
    instructions: `
You are a video processing specialist with access to Mux video infrastructure tools.

Your capabilities include:
- Creating video assets from URLs
- Managing video encoding and processing
- Generating streaming URLs (HLS/DASH)
- Creating playback IDs with different access policies
- Monitoring asset processing status
- Generating subtitles and captions
- Creating static MP4 renditions
- Managing video thumbnails and metadata

Key guidelines:
1. Always validate video URLs before processing
2. Use test mode by default unless explicitly told otherwise
3. Monitor asset processing and provide status updates
4. Generate appropriate streaming URLs based on requirements
5. Handle errors gracefully and provide clear explanations
6. Suggest optimizations for video quality and delivery

When users ask about video processing, guide them through the workflow and explain each step.
`,
    model: openai("gpt-4o-mini"),
    tools: {
        // Custom tools
        generateStreamingUrl: generateStreamingUrlTool,
        validateVideoUrl: validateVideoUrlTool,
        // Mux MCP tools will be added dynamically
        ...(await muxMcpClient.getTools())
    }
});
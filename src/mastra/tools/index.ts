import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Custom tool for generating streaming URLs
export const generateStreamingUrlTool = createTool({
    id: "generate-streaming-url",
    description: "Generate HLS streaming URL from Mux playback ID",
    inputSchema: z.object({
        playbackId: z.string().describe("Mux playback ID"),
        token: z.string().optional().describe("JWT token for signed playback")
    }),
    outputSchema: z.object({
        hlsUrl: z.string(),
        dashUrl: z.string().optional(),
        thumbnailUrl: z.string()
    }),
    execute: async ({ context: { playbackId, token } }) => {
        const baseUrl = `https://stream.mux.com/${playbackId}`;
        const tokenParam = token ? `?token=${token}` : '';

        return {
            hlsUrl: `${baseUrl}.m3u8${tokenParam}`,
            dashUrl: `${baseUrl}.mpd${tokenParam}`,
            thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`
        };
    }
});

// Tool for validating video URLs
export const validateVideoUrlTool = createTool({
    id: "validate-video-url",
    description: "Validate if a URL points to a valid video file",
    inputSchema: z.object({
        url: z.string().url().describe("Video URL to validate")
    }),
    outputSchema: z.object({
        isValid: z.boolean(),
        contentType: z.string().optional(),
        contentLength: z.number().optional(),
        error: z.string().optional()
    }),
    execute: async ({ context: { url } }) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            const isVideoType = contentType?.startsWith('video/') ||
                contentType?.includes('mp4') ||
                contentType?.includes('mov') ||
                contentType?.includes('avi');

            return {
                isValid: response.ok && !!isVideoType,
                contentType: contentType || undefined,
                contentLength: contentLength ? parseInt(contentLength) : undefined
            };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
});
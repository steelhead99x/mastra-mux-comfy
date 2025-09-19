
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, generateObject } from "ai";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";

if (!ANTHROPIC_API_KEY) {
    console.warn("⚠️ ANTHROPIC_API_KEY not found in environment variables");
}

// Create Anthropic model instance
export const anthropicModel = anthropic(DEFAULT_MODEL);

/**
 * Enhanced text generation with Anthropic Claude
 */
export async function anthropicGenerateText(
    prompt: string,
    options: {
        temperature?: number;
        maxTokens?: number;
        tools?: Record<string, any>;
        toolChoice?: "auto" | "none" | "required" | { type: "tool"; toolName: string };
        maxSteps?: number;
        system?: string;
    } = {}
) {
    const {
        temperature = 0.1,
        maxTokens = 4096,
        tools,
        toolChoice = "auto",
        maxSteps = 5,
        system
    } = options;

    try {
        console.log(`🤖 Generating text with Anthropic (${DEFAULT_MODEL})...`);

        // Build the parameters object, only including supported parameters
        const params: any = {
            model: anthropicModel,
            prompt,
            temperature,
            tools,
            toolChoice,
            maxSteps,
            system,
        };

        // Add maxTokens if it's a supported parameter name, otherwise skip it
        if (maxTokens) {
            params.maxTokens = maxTokens;
        }

        const result = await generateText(params);

        return result;
    } catch (error) {
        console.error("❌ Anthropic generateText error:", error);
        throw error;
    }
}

/**
 * Stream text generation with Anthropic Claude
 */
export async function anthropicStreamText(
    prompt: string,
    options: {
        temperature?: number;
        maxTokens?: number;
        tools?: Record<string, any>;
        toolChoice?: "auto" | "none" | "required" | { type: "tool"; toolName: string };
        maxSteps?: number;
        system?: string;
        onChunk?: (chunk: string) => void;
    } = {}
) {
    const {
        temperature = 0.1,
        maxTokens = 4096,
        tools,
        toolChoice = "auto",
        maxSteps = 5,
        system,
        onChunk
    } = options;

    try {
        console.log(`🤖 Streaming text with Anthropic (${DEFAULT_MODEL})...`);

        const params: any = {
            model: anthropicModel,
            prompt,
            temperature,
            tools,
            toolChoice,
            maxSteps,
            system,
        };

        if (maxTokens) {
            params.maxTokens = maxTokens;
        }

        const result = streamText(params);

        if (onChunk) {
            for await (const chunk of result.textStream) {
                onChunk(chunk);
            }
        }

        return result;
    } catch (error) {
        console.error("❌ Anthropic streamText error:", error);
        throw error;
    }
}

/**
 * Generate structured object with Anthropic Claude
 */
export async function anthropicGenerateObject<T = any>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: {
        temperature?: number;
        maxTokens?: number;
        system?: string;
    } = {}
) {
    const {
        temperature = 0.1,
        maxTokens = 4096,
        system
    } = options;

    try {
        console.log(`🤖 Generating object with Anthropic (${DEFAULT_MODEL})...`);

        const params: any = {
            model: anthropicModel,
            prompt,
            schema,
            temperature,
            system,
        };

        if (maxTokens) {
            params.maxTokens = maxTokens;
        }

        const result = await generateObject(params);

        return result;
    } catch (error) {
        console.error("❌ Anthropic generateObject error:", error);
        throw error;
    }
}

/**
 * Test Anthropic connection and basic functionality
 */
export async function testAnthropicConnection(): Promise<boolean> {
    try {
        console.log("🔍 Testing Anthropic connection...");

        const result = await anthropicGenerateText("Hello! Please respond with 'Connection successful'", {
            temperature: 0,
            maxTokens: 50,
        });

        if (result.text.toLowerCase().includes("successful")) {
            console.log("✅ Anthropic connection test passed");
            return true;
        } else {
            console.log("⚠️ Anthropic responded but with unexpected content:", result.text);
            return false;
        }
    } catch (error) {
        console.error("❌ Anthropic connection test failed:", error);
        return false;
    }
}

export default {
    anthropicModel,
    anthropicGenerateText,
    anthropicStreamText,
    anthropicGenerateObject,
    testAnthropicConnection,
};
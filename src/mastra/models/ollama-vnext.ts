// TypeScript
import { generateText, streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export interface VNextOptions {
    temperature?: number;
    topP?: number;
    tools?: Record<string, any>;
    toolChoice?: "auto" | "none" | "required";
    maxSteps?: number;
    // extend with other controls as needed
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";

// Create a vNext-compatible provider pointed at your Ollama endpoint
const ollama = createOpenAICompatible({
    name: "ollama",
    baseURL: OLLAMA_BASE_URL,
    // headers: {} // add if proxying behind an auth gateway
});

// Build the model; ensures a modelId is present (prevents "modelId: undefined")
export const ollamaModel = ollama(OLLAMA_MODEL);

/**
 * Non-streaming vNext generation with tool support
 * Returns the final text output and tool results
 */
export async function ollamaGenerateText(
    prompt: string,
    options: VNextOptions = {}
): Promise<{
    text: string;
    toolCalls?: any[];
    toolResults?: any[];
    finishReason?: string;
    usage?: any;
}> {
    // Only include supported parameters
    const generateParams: any = {
        model: ollamaModel,
        prompt,
        temperature: options.temperature,
        topP: options.topP,
        maxSteps: options.maxSteps ?? (options.tools ? 5 : undefined),
    };

    // Add tool parameters only if tools are provided
    if (options.tools && Object.keys(options.tools).length > 0) {
        generateParams.tools = options.tools;
        generateParams.toolChoice = options.toolChoice || "auto";
    }

    const result = await generateText(generateParams);

    return {
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        finishReason: result.finishReason,
        usage: result.usage,
    };
}

/**
 * Streaming vNext generation with tool support
 * Returns an async iterable that yields both text chunks and tool call information
 */
export async function ollamaStreamText(
    prompt: string,
    options: VNextOptions = {}
): Promise<{
    textStream: AsyncIterable<string>;
    fullStream: AsyncIterable<any>;
    toolCalls: Promise<any[]>;
    toolResults: Promise<any[]>;
    finishReason: Promise<string>;
    usage: Promise<any>;
}> {
    // Only include supported parameters
    const streamParams: any = {
        model: ollamaModel,
        prompt,
        temperature: options.temperature,
        topP: options.topP,
        maxSteps: options.maxSteps ?? (options.tools ? 5 : undefined),
    };

    // Add tool parameters only if tools are provided
    if (options.tools && Object.keys(options.tools).length > 0) {
        streamParams.tools = options.tools;
        streamParams.toolChoice = options.toolChoice || "auto";
    }

    const result = await streamText(streamParams);

    return {
        textStream: result.textStream,
        fullStream: result.fullStream, // Provides access to tool calls in streaming
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        finishReason: result.finishReason,
        usage: result.usage,
    };
}

/**
 * Helper function to create a tool-enabled conversation
 * This makes it easier to work with tools in a conversational context
 */
export async function ollamaChat(
    messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
    }>,
    options: VNextOptions = {}
): Promise<{
    text: string;
    toolCalls?: any[];
    toolResults?: any[];
    finishReason?: string;
    usage?: any;
}> {
    // Only include supported parameters
    const chatParams: any = {
        model: ollamaModel,
        messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
        })),
        temperature: options.temperature,
        topP: options.topP,
        maxSteps: options.maxSteps ?? (options.tools ? 5 : undefined),
    };

    // Add tool parameters only if tools are provided
    if (options.tools && Object.keys(options.tools).length > 0) {
        chatParams.tools = options.tools;
        chatParams.toolChoice = options.toolChoice || "auto";
    }

    const result = await generateText(chatParams);

    return {
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        finishReason: result.finishReason,
        usage: result.usage,
    };
}

/**
 * Simple helper to convert function to AI SDK tool format
 * Use this when you need to create tools manually
 */
export function createSimpleTool(
    description: string,
    execute: (args: any) => Promise<any> | any
) {
    return {
        description,
        parameters: {},
        execute
    };
}
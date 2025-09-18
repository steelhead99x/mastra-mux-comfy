// TypeScript
import { generateText, streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export interface VNextOptions {
  temperature?: number;
  topP?: number;
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
 * Non-streaming vNext generation
 * Returns the final text output
 */
export async function ollamaGenerateText(
  prompt: string,
  options: VNextOptions = {}
): Promise<string> {
  const { text } = await generateText({
    model: ollamaModel,
    prompt,
    temperature: options.temperature,
    topP: options.topP,
  });

  return text;
}

// ... existing code ...

/**
 * Streaming vNext generation
 * Returns an async iterable of token chunks (string)
 *
 * Example:
 *   for await (const chunk of await ollamaStreamText("Hello")) {
 *     process.stdout.write(chunk);
 *   }
 */
export async function ollamaStreamText(
  prompt: string,
  options: VNextOptions = {}
): Promise<AsyncIterable<string>> {
  const { textStream } = await streamText({
    model: ollamaModel,
    prompt,
    temperature: options.temperature,
    topP: options.topP,
  });

  return textStream;
}
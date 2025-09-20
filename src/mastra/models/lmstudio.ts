import 'dotenv/config';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
    generateText,
    streamText,
    generateObject,
    tool as aiTool,
    type CoreTool,
    type LanguageModelV1,
    type GenerateTextResult,
    type StreamTextResult,
} from 'ai';
import { z } from 'zod';
import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';

// -------- Provider and model base --------

export const LMSTUDIO_BASE_URL =
    process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1';

export const LMSTUDIO_API_KEY = process.env.LMSTUDIO_API_KEY || '';

export const lmstudio = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: LMSTUDIO_BASE_URL,
    apiKey: LMSTUDIO_API_KEY || undefined,
});

// Ensure the model is served in LM Studio
export const MODEL_NAME = process.env.LMSTUDIO_MODEL || 'openai/gpt-oss-20b';

// Preconfigured model reference
export const model = lmstudio(MODEL_NAME);

// -------- Resiliency helpers --------

type RetryOpts = { retries?: number; baseDelayMs?: number };
async function withRetry<T>(fn: () => Promise<T>, opts: RetryOpts = {}): Promise<T> {
    const retries = opts.retries ?? 2;
    const base = opts.baseDelayMs ?? 400;
    let lastErr: unknown;

    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastErr = err;
            const msg = String(err?.message ?? err ?? '');
            const transient = /overload|rate limit|429|408|502|503|timeout|temporar(y|ily)/i.test(msg);
            if (!transient || i === retries) throw err;
            const jitter = Math.floor(Math.random() * 200);
            const delay = Math.round(base * Math.pow(2, i) + jitter);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastErr;
}

// -------- Model creators --------

export function createLmstudioModel(name?: string): LanguageModelV1 {
    return lmstudio(name ?? MODEL_NAME);
}

// -------- Text/stream/structured APIs with safer defaults --------

export async function lmstudioGenerateText(
    prompt: string,
    opts?: {
        model?: LanguageModelV1;
        temperature?: number;
        maxTokens?: number;
        system?: string;
        retry?: RetryOpts;
    }
): Promise<GenerateTextResult> {
    const m = opts?.model ?? model;
    const temperature = opts?.temperature ?? 0.2;
    const maxTokens = opts?.maxTokens ?? 2048;

    return withRetry(
        () =>
            generateText({
                model: m,
                prompt,
                temperature,
                maxTokens,
                system: opts?.system,
            }),
        opts?.retry
    );
}

export async function lmstudioStream(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    opts?: {
        model?: LanguageModelV1;
        temperature?: number;
        maxTokens?: number;
        system?: string;
    }
): Promise<StreamTextResult> {
    const m = opts?.model ?? model;
    const temperature = opts?.temperature ?? 0.2;
    const maxTokens = opts?.maxTokens ?? 2048;

    return streamText({
        model: m,
        messages,
        temperature,
        maxTokens,
        system: opts?.system,
    });
}

export async function lmstudioStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    opts?: {
        model?: LanguageModelV1;
        system?: string;
        temperature?: number;
        maxTokens?: number;
        retry?: RetryOpts;
    }
): Promise<{ object: T; text: string }> {
    const m = opts?.model ?? model;
    const temperature = opts?.temperature ?? 0;
    const maxTokens = opts?.maxTokens ?? 1500;

    return withRetry(
        () =>
            generateObject({
                model: m,
                schema,
                prompt,
                system: opts?.system,
                temperature,
                maxTokens,
            }),
        opts?.retry
    );
}

// -------- Tool support (adapts Mastra tools to AI SDK tools) --------

export function toAiSdkTools(
    mastraTools: Record<
        string,
        {
            inputSchema?: z.ZodTypeAny;
            execute: (args: { context?: Record<string, unknown> }) => Promise<any>;
            description?: string;
        }
    >
): Record<string, CoreTool> {
    const aiTools: Record<string, CoreTool> = {};
    for (const [name, t] of Object.entries(mastraTools || {})) {
        const parameters =
            (t.inputSchema as z.ZodTypeAny) ??
            z.object({}).catchall(z.any()).describe(t.description ?? `Tool ${name}`);

        aiTools[name] = aiTool({
            description: t.description ?? `Mastra tool ${name}`,
            parameters,
            execute: async (args: Record<string, unknown>) => {
                // Mastra tools expect args in `context`
                return t.execute({ context: args ?? {} });
            },
        });
    }
    return aiTools;
}

export async function lmstudioChatWithTools(
    {
        messages,
        tools,
    }: {
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        tools: Record<string, CoreTool>;
    },
    opts?: {
        model?: LanguageModelV1;
        temperature?: number;
        maxTokens?: number;
        system?: string;
        retry?: RetryOpts;
    }
) {
    const m = opts?.model ?? model;
    const temperature = opts?.temperature ?? 0.2;
    const maxTokens = opts?.maxTokens ?? 2048;

    return withRetry(
        () =>
            generateText({
                model: m,
                messages,
                tools,
                temperature,
                maxTokens,
                system: opts?.system,
            }),
        opts?.retry
    );
}

// -------- Memory + Semantic Memory (LibSQL + embeddings) --------

const LMSTUDIO_EMBED_MODEL = process.env.LMSTUDIO_EMBED_MODEL || '';
const LMSTUDIO_MEMORY_DB = process.env.LMSTUDIO_MEMORY_DB || 'file:./agent-memory.db';

const lmstudioEmbedProvider = createOpenAICompatible({
    name: 'lmstudio-embed',
    baseURL: LMSTUDIO_BASE_URL,
    apiKey: LMSTUDIO_API_KEY || undefined,
});

// Fallback to Ollama embeddings if LM Studio is not serving an embedding model
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const ollamaEmbedProvider = createOpenAICompatible({
    name: 'ollama',
    baseURL: OLLAMA_BASE_URL,
});

function resolveEmbedder(embedModelOverride?: string) {
    const desired = embedModelOverride || LMSTUDIO_EMBED_MODEL;
    if (desired) {
        try {
            // Try LM Studio first
            return lmstudioEmbedProvider.textEmbeddingModel(desired);
        } catch {
            // Then try Ollama using the same name
            try {
                return ollamaEmbedProvider.textEmbeddingModel(desired);
            } catch {
                // Fall through to default
            }
        }
    }
    // Default Ollama embedding model; adjust as preferred
    return ollamaEmbedProvider.textEmbeddingModel('embeddinggemma:300m');
}

export type LmstudioMemoryOptions = {
    workingMemory?: {
        enabled?: boolean;
        maxMessages?: number;
    };
    semanticRecall?: {
        enabled?: boolean;
        topK?: number;
        messageRange?: number;
        scope?: 'thread' | 'global';
        similarityThreshold?: number;
        timeDecay?: number;
    };
    dbUrl?: string;
    embedModel?: string;
};

export function createLmstudioMemory(options: LmstudioMemoryOptions = {}): Memory {
    const dbUrl = options.dbUrl || LMSTUDIO_MEMORY_DB;
    const embedder = resolveEmbedder(options.embedModel);

    return new Memory({
        storage: new LibSQLStore({ url: dbUrl }),
        vector: new LibSQLVector({ connectionUrl: dbUrl }),
        embedder,
        options: {
            workingMemory: {
                enabled: options.workingMemory?.enabled ?? true,
                ...(options.workingMemory?.maxMessages
                    ? { maxMessages: options.workingMemory.maxMessages }
                    : {}),
            },
            semanticRecall: {
                enabled: options.semanticRecall?.enabled ?? true,
                topK: options.semanticRecall?.topK ?? 8,
                messageRange: options.semanticRecall?.messageRange ?? 15,
                scope: options.semanticRecall?.scope ?? 'thread',
                ...(options.semanticRecall?.similarityThreshold !== undefined
                    ? { similarityThreshold: options.semanticRecall.similarityThreshold }
                    : {}),
                ...(options.semanticRecall?.timeDecay !== undefined
                    ? { timeDecay: options.semanticRecall.timeDecay }
                    : {}),
            } as any,
        },
    });
}

// A convenient default instance
export const lmstudioMemory = createLmstudioMemory();

/**
 * Helper to construct an Agent with LM Studio model + Memory + optional tools.
 * Provide your Agent constructor from @mastra/core when calling this helper.
 */
export async function createLmstudioAgentWithMemory(opts: {
    AgentCtor: new (config: any) => any;
    name: string;
    instructions: string;
    loadTools?: () => Promise<Record<string, any>>;
    memoryOptions?: LmstudioMemoryOptions;
    modelName?: string;
}) {
    const { AgentCtor, name, instructions, loadTools, memoryOptions, modelName } = opts;

    const mem = createLmstudioMemory(memoryOptions);
    const modelInstance = createLmstudioModel(modelName);
    const tools = loadTools ? await loadTools() : {};

    return new AgentCtor({
        name,
        instructions,
        model: modelInstance,
        memory: mem,
        tools,
    });
}
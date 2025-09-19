import 'dotenv/config';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const LMSTUDIO_BASE_URL =
    process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1';

export const LMSTUDIO_API_KEY = process.env.LMSTUDIO_API_KEY || '';

/**
 * LM Studio provider configured via environment variables.
 * Default base URL: http://localhost:1234/v1
 * API key is optional for local LM Studio unless you enable auth.
 */
export const lmstudio = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: LMSTUDIO_BASE_URL,
    apiKey: LMSTUDIO_API_KEY || undefined,
});

/**
 * Canonical model name as shown in LM Studio.
 * Ensure the model is loaded and served in LM Studio.
 */
//export const MODEL_NAME = 'qwen3/qen3-4b-thinking-2507';
export const MODEL_NAME = 'openai/gpt-oss:20b';

/**
 * Preconfigured model reference for convenience.
 */
export const model = lmstudio(MODEL_NAME);
# Mastra + Mux MCP Workflow

A TypeScript project that integrates Mastra with the Mux Video API via MCP (Model Context Protocol). It provides:
- CLI scripts to validate Mux credentials and list assets (including pagination)
- Optional local LLM testing via LM Studio
- Optional Anthropic agent and test
- A clean structure for extending agents, tools, and workflows

## Features

- MCP-based discovery and invocation of Mux endpoints
- Robust handling of MCP responses (including text-wrapped JSON)
- Scripts for quick validation, asset listing, and pagination
- Optional LM Studio support for local model testing
- Optional Anthropic agent for richer reasoning
- TypeScript-first, ready for extension

## Requirements

- Node.js >= 24
- npm
- Mux credentials (token ID/secret)
- Optional:
  - LM Studio running a served model
  - Anthropic API key

## Quick Start

1) Install dependencies
```
bash
npm install
```
2) Configure environment
```
bash
cp sample.env .env
# Edit .env and set:
# MUX_TOKEN_ID=...
# MUX_TOKEN_SECRET=...
# Optional:
# LMSTUDIO_BASE_URL=http://localhost:1234/v1
# LMSTUDIO_API_KEY=...
# ANTHROPIC_API_KEY=...
```
3) Run dev or build/start
```
bash
npm run dev
# or
npm run build
npm start
```
## Scripts

Mux and MCP
- Validate Mux credentials:
```
bash
npm run test:auth
```
- List assets (single page, discovery + fetch):
```
bash
npm run test:assets
```
- List assets with pagination (safe limit):
```
bash
npm run test:assets:all
```
LM Studio
- Test a local LM Studio model, then exercise MCP tools:
```
bash
npm run test:lmstudio
```
Anthropic and Agents
- Run the Anthropic agent:
```
bash
npm run agent:anthropic
```
- Test Anthropic connectivity:
```
bash
npm run test:anthropic
```
Other utilities
- Demo for alternative LLM setup:
```
bash
npm run test:vnext
```
- Comfy client test (if applicable in your workflow):
```
bash
npm run test:comfyClient
```
## LM Studio

The project includes a simple test that:
- Connects to LM Studio using an OpenAI-compatible endpoint
- Runs a short prompt
- Then uses MCP tools to discover/invoke Mux endpoints

Configure via .env:
- LMSTUDIO_BASE_URL (default: http://localhost:1234/v1)
- LMSTUDIO_API_KEY (only if you enabled auth in LM Studio)

Run:
```
bash
npm run test:lmstudio
```
Tips:
- Ensure LM Studio is serving a model at the configured base URL
- If you change the served model name, update the code’s model constant to match
- If you get connection errors, confirm LM Studio is running and reachable

## Anthropic

An Anthropic-based agent and a test script are provided.

Configure via .env:
- ANTHROPIC_API_KEY
- Optionally set your preferred model via an environment variable if you use a different model name

Run the agent:
```
bash
npm run agent:anthropic
```
Smoke-test Anthropic:
```
bash
npm run test:anthropic
```
## MCP (Model Context Protocol) Notes

This project uses MCP meta-tools exposed by the Mux MCP server, including:
- list_api_endpoints
- get_api_endpoint_schema
- invoke_api_endpoint

The scripts account for different response shapes, including text-wrapped JSON. They:
- Discover endpoints
- Retrieve schemas when available
- Invoke endpoints with appropriate arguments
- Normalize responses for asset IDs and upload IDs

If only a “retrieve” endpoint is available, set an asset ID via one of:
- MUX_ASSET_ID
- SAMPLE_ASSET_ID
- MUX_SAMPLE_ASSET_ID

## Project Structure

- TypeScript sources in src/mastra
- Scripts in src/mastra/scripts
- Providers, models, and MCP client helpers under src/mastra
- Build outputs to dist/

A typical workflow:
- Use test:auth to validate credentials
- Use test:assets for a quick check
- Use test:assets:all to paginate and analyze returned assets
- Optionally use test:lmstudio or test:anthropic to exercise LLM integrations

## Environment Variables

Minimum required for Mux:
- MUX_TOKEN_ID
- MUX_TOKEN_SECRET

Optional:
- LMSTUDIO_BASE_URL (default: http://localhost:1234/v1)
- LMSTUDIO_API_KEY (if enabled in LM Studio)
- ANTHROPIC_API_KEY (for Anthropic agent and test)
- NODE_ENV, PORT (general app settings)
- Advanced MCP/timeout settings, if needed:
  - MUX_CONNECTION_TIMEOUT
  - MUX_MCP_INTERACTIVE_ARGS

Use sample.env as a template:
```
bash
cp sample.env .env
```
## Troubleshooting

- Unauthorized or 401:
  - Verify MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env
  - Re-run npm run test:auth

- No assets or empty arrays:
  - Ensure assets exist in your Mux environment
  - When results are text-wrapped, scripts will parse automatically; if still empty, re-check credentials and environment

- LM Studio connection errors:
  - Ensure LM Studio is running and serving a model
  - Verify LMSTUDIO_BASE_URL and LMSTUDIO_API_KEY (if required)
  - Try the test again: npm run test:lmstudio

- Anthropic errors:
  - Verify ANTHROPIC_API_KEY
  - Test with npm run test:anthropic

- Timeouts or flaky network:
  - Re-run after a short delay
  - Consider adjusting connection timeout via environment if necessary

## License

MIT


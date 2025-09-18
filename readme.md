# Mastra Mux ComfyUI Workflow

A comprehensive video processing solution built with Mastra framework, featuring an interactive AI agent powered by Ollama that can manage Mux video assets through MCP (Model Context Protocol) integration.

## Features

- 🤖 **Interactive AI Agent** - Ollama-powered agent with conversation memory
- 🎥 **Mux Integration** - Full MCP integration for video asset management
- 🧠 **Persistent Memory** - SQLite-based conversation history storage
- 🛠️ **Development Tools** - Comprehensive test scripts and utilities
- 📊 **Dev UI** - Built-in Mastra development interface

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai) installed and running locally
- Mux account with API credentials
- Ollama model: `gpt-oss:20b` (or configure your preferred model)

## Setup

1. **Install dependencies**
```shell script
npm install
```


2. **Configure environment variables**
   Create a `.env` file with:
```
# Mux API credentials
   MUX_TOKEN_ID=your_mux_token_id
   MUX_TOKEN_SECRET=your_mux_token_secret
   
   # Ollama configuration (optional)
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=gpt-oss:20b
```


3. **Pull the Ollama model**
```shell script
ollama pull gpt-oss:20b
```


## Usage

### Development Mode

Start the Mastra development server with the interactive agent:

```shell script
npm run dev
```


This launches the Mastra dev UI at `http://localhost:4111` where you can:
- Chat with the interactive agent
- View agent configuration and tools
- Monitor conversation memory
- Access Mux MCP tools

### Alternative Development Mode

Run the agent directly in terminal mode:

```shell script
npm run dev:alt
```


### Production

Build and run the compiled version:

```shell script
npm run build
npm start
```


## Available Scripts

### Core Scripts

- **`npm run dev`** - Start Mastra development server with full UI
- **`npm run dev:alt`** - Run interactive agent directly in terminal
- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm start`** - Run compiled production version

### Test Scripts

- **`npm run test:auth`** - Test Mux API authentication
- **`npm run test:list`** - Test Mux asset listing functionality
- **`npm run test:vnext`** - Demo Ollama text generation (streaming/non-streaming)
- **`npm run test:comfyClient`** - Test ComfyUI client integration
- **`npm run agent:list`** - Run legacy asset listing agent

## Interactive Agent Capabilities

The interactive agent (`interactive`) features:

- **🧠 Memory** - Remembers conversation history across sessions
- **🎥 Mux Tools** - Access to Mux MCP tools for video asset management
- **🤖 Ollama Model** - Powered by `gpt-oss:20b` via AI SDK
- **📊 Asset Management** - List, search, and manage Mux video assets
- **📈 Status Monitoring** - Check asset processing status and reports

### Example Interactions

Ask the agent questions like:
- "List my recent video assets"
- "Show me assets that are ready for playback"
- "What's the status of asset [ID]?"
- "Search for assets containing 'demo' in the title"

## Architecture

### Core Components

- **`src/mastra/index.ts`** - Main Mastra instance and agent bootstrap
- **`src/mastra/agents/interactive-agent.ts`** - Interactive AI agent with memory
- **`src/mastra/mcp/mux-client.ts`** - Mux MCP client for tool integration
- **`src/mastra/models/ollama-vnext.ts`** - Ollama AI SDK integration

### Configuration

- **`mastra.config.js`** - Project-level Mastra configuration
- **`package.json`** - Dependencies and scripts
- **`.env`** - Environment variables (create from template above)

## Memory System

The agent uses persistent memory storage via SQLite:

- **Storage**: `./agent-memory.db` (auto-created)
- **Features**: Conversation history, context recall, semantic search
- **Provider**: LibSQL for local development

## MCP Integration

Mux tools are dynamically loaded via MCP:

- **Transport**: Stdio transport to `@mux/mcp` server
- **Tools**: Asset listing, status checks, playback management
- **Auth**: Token-based authentication via environment variables

## Development Tips

1. **Monitor Logs** - The agent provides detailed logging for MCP connections and tool loading
2. **Test Scripts** - Use individual test scripts to verify components before running the full agent
3. **Memory Reset** - Delete `agent-memory.db` to clear conversation history
4. **Model Changes** - Modify `OLLAMA_MODEL` in `.env` to use different Ollama models

## Troubleshooting

### Common Issues

- **MCP Connection Failed** - Verify Mux credentials in `.env`
- **Ollama Model Missing** - Run `ollama pull gpt-oss:20b`
- **Port Conflicts** - Mastra dev server uses port 4111 by default
- **Memory Issues** - Check SQLite file permissions for `agent-memory.db`

### Debug Commands

```shell script
# Test Mux authentication
npm run test:auth

# Test Ollama connectivity  
npm run test:vnext

# Verify MCP tool loading
npm run test:list
```


## Contributing

This project demonstrates Mastra's capabilities with real-world video processing workflows. Feel free to extend the agent with additional tools, memory processors, or integrations.
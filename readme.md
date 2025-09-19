# Mux Video Assistant

AI-powered video asset management using Mastra framework with Claude and Ollama models.

## What it does

Chat with AI agents to manage your Mux videos:
- List and search video assets
- Check processing status
- Get upload reports
- Monitor playback readiness

## Quick Start

1. **Install**
```bash
npm install
```


2. **Setup Environment**
Create `.env` file:
```
# Required: Mux credentials
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret

# Required: Anthropic API key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional: Ollama settings
OLLAMA_BASE_URL=http://localhost:11434
```


3. **Install Ollama Models**
```shell script
# Required for memory/embeddings
ollama pull embeddinggemma:300m

# Optional for local Ollama agent
ollama pull gpt-oss:20b
```


## Usage

### Claude Agent (Recommended)
Smart AI with advanced reasoning:
```shell script
npm run agent:anthropic
```


### Ollama Agent
Local privacy-focused AI:
```shell script
npm run dev:alt
```


### Web Interface
Visual UI for both agents:
```shell script
npm run dev
# Visit http://localhost:4111
```


## Example Conversations

**"List my video assets"**
- Shows recent uploads with status

**"Find failed uploads"**
- Filters by processing errors

**"Status of asset abc123"**
- Detailed asset information

**"Videos ready for streaming"**
- Assets with playback URLs

## Commands

| Script | Purpose |
|--------|---------|
| `npm run agent:anthropic` | Claude agent (best) |
| `npm run dev:alt` | Ollama agent (local) |
| `npm run dev` | Web UI (both agents) |
| `npm run test:anthropic` | Test Claude setup |
| `npm run build` | Compile project |

## Troubleshooting

**Claude not working?**
- Check `ANTHROPIC_API_KEY` in `.env`

**No Mux tools loaded?**
- Verify `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET`

**Ollama issues?**
- Run `ollama serve`
- Install: `ollama pull embeddinggemma:300m`

**Memory errors?**
- Delete `.db` files to reset chat history

## Features

- 🤖 **Dual AI Models** - Choose Claude or Ollama
- 🎥 **Mux Integration** - Full video platform access
- 🧠 **Chat Memory** - Remembers conversations
- 🌐 **Web + Terminal** - Multiple interfaces
- 🔧 **Live Tools** - Dynamic Mux API access

Built with [Mastra](https://mastra.ai) framework and [Mux](https://mux.com) video platform.

## Architecture

### Core Components

- `src/mastra/index.ts` - Main application entry point
- `src/mastra/agents/` - AI agent configurations
    - `interactive-agent.ts` - Ollama-powered agent
    - `anthropic-dynamic-agent.ts` - Claude-powered agent
- `src/mastra/models/` - AI model integrations
    - `ollama-vnext.ts` - Ollama model setup
    - `anthropic-model.ts` - Anthropic Claude setup
- `src/mastra/mcp/mux-client.ts` - Mux API integration via MCP

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MUX_TOKEN_ID` | Yes | Mux API token ID |
| `MUX_TOKEN_SECRET` | Yes | Mux API token secret |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic Claude API key |
| `OLLAMA_BASE_URL` | No | Ollama server URL (default: localhost:11434) |
| `ANTHROPIC_MODEL` | No | Claude model version (default: claude-3-5-sonnet-20241022) |
| `OLLAMA_MODEL` | No | Ollama model name (default: gpt-oss:20b) |

*Required for Claude agent functionality

### Memory System

Both agents use persistent SQLite storage:
- `agent-memory.db` - Ollama agent conversations
- `anthropic-agent-memory.db` - Claude agent conversations

Memory features:
- Conversation history retention
- Semantic search across past interactions
- Context-aware responses
- Thread-based organization

### MCP Integration

Model Context Protocol (MCP) enables dynamic tool loading:
- Automatic Mux API tool discovery
- Real-time schema conversion
- Error handling and fallbacks
- Tool execution logging

Available Mux tools (loaded automatically):
- List video assets
- Get asset details
- Check processing status
- Retrieve playback URLs
- Monitor upload progress
- Access error reports

## Development

### Project Structure
```
src/mastra/
├── index.ts              # Main entry point
├── agents/               # AI agent definitions
├── models/               # Model configurations
├── mcp/                  # MCP client integration
├── scripts/              # Test and utility scripts
└── types/                # TypeScript type definitions
```


### Testing

Test individual components:
```shell script
# Test Anthropic integration
npm run test:anthropic

# Test Mux authentication
npm run test:auth

# Test asset listing
npm run test:list

# Test Ollama connectivity
npm run test:vnext
```


### Adding New Models

1. Create model configuration in `src/mastra/models/`
2. Add agent definition in `src/mastra/agents/`
3. Register agent in `src/mastra/index.ts`
4. Add npm script for easy access

### Extending Functionality

- **New Tools**: Extend MCP client for additional APIs
- **Custom Memory**: Add processors in agent configurations
- **UI Components**: Enhance web interface in Mastra dev UI
- **Workflows**: Create automated video processing pipelines

## API Reference

### Agent Methods

```typescript
// Generate response with tools and memory
const response = await agent.generate(
  [{ role: "user", content: "List my videos" }],
  { temperature: 0.1 }
);

// Access conversation history
const memory = agent.memory;

// Get available tools
const tools = await agent.tools();
```


### MCP Client Methods

```typescript
// Get all available tools
const tools = await muxMcpClient.getTools();

// Check connection status
const connected = muxMcpClient.isConnected();

// Reset connection
await muxMcpClient.reset();

// Clean disconnect
await muxMcpClient.disconnect();
```


### Model Functions

```typescript
// Direct Anthropic usage
const result = await anthropicGenerateText(prompt, {
  temperature: 0.1,
  maxTokens: 4096,
  tools: availableTools
});

// Direct Ollama usage
const response = await ollamaGenerateText(prompt, {
  temperature: 0.1,
  tools: availableTools
});
```


## Performance Tips

1. **Memory Management**
    - Adjust `topK` and `messageRange` in agent configs
    - Clear database files to reset memory

2. **Tool Optimization**
    - Tools are cached after first load
    - Use batch operations when possible

3. **Model Selection**
    - Claude: Best reasoning, requires API key
    - Ollama: Local privacy, needs more resources

## Security

- API keys stored in `.env` (never commit)
- Local SQLite databases for memory
- MCP runs as isolated subprocess
- All connections use environment variables

## License

MIT License - See LICENSE file for details.

## Support

- [Mastra Documentation](https://mastra.ai/docs)
- [Mux API Documentation](https://docs.mux.com)
- [Anthropic Claude](https://console.anthropic.com)
- [Ollama](https://ollama.ai)

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

Areas for contribution:
- Additional AI model integrations
- Enhanced Mux tool coverage
- UI/UX improvements
- Performance optimizations
- Documentation updates

---

Built with ❤️ using Mastra framework for AI agent orchestration and Mux for video infrastructure.



# Mastra Mux Asset Manager

An AI-powered video asset management system built with Mastra, Mux MCP integration, and local Ollama models.

## Features

- 🤖 **AI-Powered Agent**: Intelligent asset management with natural language processing
- 🔧 **MCP Integration**: Dynamic tool loading from Mux MCP server
- 📊 **Comprehensive Analytics**: Detailed asset reports and insights
- 🎯 **Smart Discovery**: Advanced filtering and search capabilities
- 💼 **CLI Interface**: Command-line tools for asset management
- 🚀 **Local LLM**: Uses Ollama for private, local AI processing
- 📋 **Real-time Monitoring**: Asset processing status tracking

## Prerequisites

- Node.js 18+
- Mux account with API credentials
- Ollama with local LLM model (e.g., gpt-oss:20b)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mastra-mux-workflow

# Install dependencies
npm install

# Set up environment variables
cp sample.env .env
```

## Configuration

Create a `.env` file in the root directory:

```env
# Mux API Configuration
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret
MUX_SIGNING_KEY=your_signing_key
MUX_PRIVATE_KEY=your_private_key
MUX_AUTHORIZATION_TOKEN=your_auth_token

# Ollama Configuration
OLLAMA_BASE_URL=http://192.168.88.16:11434
OLLAMA_MODEL=gpt-oss:20b

# Server Configuration (optional)
PORT=4111
```

## Quick Start

### 1. Start the Agent System

```bash
npm run dev
```

This initializes the Mastra agents and keeps them ready for use. You'll see:
- ✅ Mastra agents initialized successfully!
- 🤖 Mux Asset Manager agent ready!

### 2. Test Your Setup

```bash
# Test the asset manager agent
npm run test:asset-manager

# Test Ollama connection
npm run test:ollama

# Test Mux MCP connection (requires valid Mux credentials)
npm run test:mux-mcp
```

### 3. Use the Asset Manager CLI

```bash
# Start the asset CLI
npm run assets
```

## 🎬 Asset Management Commands

### Testing Commands

```bash
# Test asset manager with comprehensive analysis
npm run test:asset-manager

# Test Ollama connectivity and model availability
npm run test:ollama

# Test Mux MCP server connection and tools
npm run test:mux-mcp
```

### CLI Features (via npm run assets)

The CLI provides an interactive interface for:

- **Asset Discovery**: List and search through your video assets
- **Status Monitoring**: Check processing status of assets
- **Detailed Reports**: Generate comprehensive asset analytics
- **Smart Filtering**: Filter by status, date, or custom criteria
- **Troubleshooting**: Identify and resolve asset issues

## Available Scripts

```bash
# Core Development
npm run dev              # Start Mastra agent system
npm run build            # Build for production
npm start               # Start production server

# Testing & Validation
npm run test:asset-manager  # Test the asset manager agent
npm run test:ollama         # Test Ollama connection
npm run test:mux-mcp        # Test MCP connection

# Asset Management
npm run assets              # Interactive asset management CLI
```

## Architecture

### Agent-Based System

The system uses Mastra agents that combine:
- **Ollama Local LLM**: Private AI processing without cloud dependencies
- **Mux MCP Tools**: Dynamic access to Mux API through Model Context Protocol
- **Intelligent Analysis**: Natural language processing for asset insights

### Project Structure

```
src/
├── mastra/
│   ├── index.ts                    # Main Mastra instance
│   ├── agents/
│   │   └── mux-asset-manager.ts    # AI agent for asset management
│   ├── mcp/
│   │   ├── mux-client.ts           # Mux MCP client
│   │   └── comfyui-client.ts       # ComfyUI integration
│   ├── models/
│   │   ├── ollama-model.ts         # Ollama model configuration
│   │   └── ollama-provider.ts      # Ollama provider wrapper
│   └── tools/
│       └── index.ts                # Custom tool definitions
├── scripts/
│   ├── asset-cli.ts                # Asset management CLI
│   ├── test-asset-manager.ts       # Agent testing
│   ├── test-mux.ts                 # MCP testing
│   └── test-ollama.ts              # Ollama testing
└── types/
    └── mux.ts                      # TypeScript definitions
```

## Agent Capabilities

### The Mux Asset Manager Agent can:

- **Analyze Asset Collections**: Provide comprehensive reports on your video library
- **Search and Filter**: Find assets using natural language queries
- **Monitor Processing**: Track asset encoding and processing status
- **Generate Insights**: Identify optimization opportunities and issues
- **Provide Recommendations**: Suggest best practices and troubleshooting steps

### Example Interactions

```typescript
const agent = await createMuxAssetManagerAgent();

// Natural language queries
const response = await agent.generate(`
  Please analyze my video assets from the last week and tell me:
  1. Which assets are still processing
  2. Any failed uploads that need attention
  3. Overall processing success rate
`);
```

## MCP Integration

The system uses Model Context Protocol (MCP) to dynamically access Mux API tools:

- **Dynamic Tool Loading**: Automatically discovers available Mux API endpoints
- **Real-time Data**: Direct integration with Mux services
- **Flexible Operations**: Supports all Mux API operations through MCP
- **Error Handling**: Graceful fallback when MCP tools are unavailable

## Ollama Configuration

### Supported Models
- gpt-oss:20b (recommended)
- Other Ollama-compatible models

### Health Checks
The system includes comprehensive Ollama health checking:
- Server connectivity validation
- Model availability verification
- Performance testing

## Error Handling & Troubleshooting

### Common Issues

**Agent Not Responding**
- Check Ollama is running: `ollama serve`
- Verify model is available: `ollama list`
- Test connection: `npm run test:ollama`

**MCP Connection Issues**
- Verify Mux credentials in `.env`
- Test MCP connection: `npm run test:mux-mcp`
- Check network connectivity to Mux services

**Model Loading Issues**
- Ensure sufficient memory for the model
- Try restarting Ollama service
- Check Ollama logs for errors

### Debug Mode

Enable detailed logging:
```bash
DEBUG=mastra:* npm run dev
```

### Testing Strategy

1. **Start with Ollama**: `npm run test:ollama`
2. **Test Agent**: `npm run test:asset-manager`
3. **Verify MCP** (if credentials available): `npm run test:mux-mcp`

## Development

### Adding Custom Functionality

Extend the asset manager:

```typescript
import { MuxAssetManager } from "./src/mastra/agents/mux-asset-manager";

class CustomAssetManager extends MuxAssetManager {
  async analyzePerformanceMetrics() {
    // Custom analysis logic
  }
}
```

### Custom Tools

Create new tools in `src/mastra/tools/`:

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const customAnalyticsTool = createTool({
  id: "analytics-tool",
  description: "Custom analytics for video assets",
  inputSchema: z.object({
    timeRange: z.string(),
    metrics: z.array(z.string())
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      metric: z.string(),
      value: z.number()
    }))
  }),
  execute: async ({ context }) => {
    // Implementation
  }
});
```

## Production Deployment

### Build and Deploy

```bash
npm run build
npm start
```

### Environment Variables

```env
NODE_ENV=production
PORT=4111
# ... Mux credentials
# ... Ollama configuration
```

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4111
CMD ["npm", "start"]
```

## Monitoring

### Agent Performance
- Response time tracking
- Tool usage analytics
- Error pattern detection
- Success/failure rates

### Asset Analytics
- Processing success rates
- Average encoding times
- Storage utilization
- Content distribution analysis

## Support & Resources

- **Mastra Framework**: [Mastra Documentation](https://docs.mastra.ai)
- **Mux API**: [Mux Documentation](https://docs.mux.com)
- **Model Context Protocol**: [MCP Specification](https://modelcontextprotocol.io)
- **Ollama**: [Ollama Documentation](https://ollama.ai)

## License

MIT License - see LICENSE file for details.

## Changelog

### v2.0.0 (Current)
- **NEW**: Agent-based architecture with Mastra integration
- **NEW**: Local Ollama LLM support for privacy
- **NEW**: Comprehensive testing suite
- **NEW**: Improved error handling and debugging
- **IMPROVED**: Streamlined CLI interface
- **REMOVED**: Unused workflow components
- **FIXED**: Model compatibility issues

### v1.1.0
- Initial Mux Asset Manager CLI
- Basic MCP integration
- Asset analysis and reporting

### v1.0.0
- Initial video processing workflow
- Basic agent integration
```
# Mastra Mux Video Processing Workflow

A comprehensive video processing solution built with Mastra and Mux MCP (Model Context Protocol) integration.

## Features

- 🎬 **Complete Video Pipeline**: URL validation → Asset creation → Processing monitoring → URL generation
- 🤖 **AI Agent**: Intelligent video processing assistant with Mux tools
- 🔧 **MCP Integration**: Dynamic tool loading from Mux MCP server
- 📊 **Real-time Monitoring**: Asset processing status tracking
- 🎯 **Multiple Formats**: HLS, DASH, and MP4 support
- 📝 **Subtitle Generation**: Automatic speech recognition
- 🧪 **Test Mode**: Free development testing with watermarks
- 💼 **Asset Management CLI**: Command-line interface for managing Mux assets

## Prerequisites

- Node.js 18+
- Mux account with API credentials
- Ollama with local LLM model (e.g., gpt-oss:20b)

## Installation

```shell script
# Clone the repository
git clone <repository-url>
cd mastra-mux-workflow

# Install dependencies
npm install

# Set up environment variables
cp sample.env .env
```

## Configuration

Create a `.env` file in the root directory with your credentials:

```
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

### 1. Start the Development Server

```shell script
npm run dev
```

The Mastra playground will be available at http://localhost:4111

### 2. Use the Mux Asset Manager CLI

```shell script
# List all assets
npm run assets list

# Get recent assets (last 24 hours)
npm run assets recent

# Get assets by status
npm run assets status ready

# Generate comprehensive report
npm run assets report

# Search for specific assets
npm run assets search "my video"

# Get detailed asset information
npm run assets details abc123...
```

### 3. Test the System Components

```shell script
# Test Mux MCP connection
npm run test:mux-mcp

# Test asset manager agent
npm run test:asset-manager

# Test Ollama connection
npm run test:ollama
```

## 🎬 Mux Asset Manager CLI

The CLI provides powerful commands for managing your Mux video assets:

### Available Commands

- `list [--detailed] [--limit N]` - List all assets
- `recent [hours]` - Get recent assets (default 24h)
- `status <ready|preparing|errored|waiting>` - Get assets by status
- `details <asset-id>` - Get detailed asset info
- `search <query>` - Search assets
- `report` - Generate comprehensive report
- `date <start> <end>` - Get assets by date range
- `help` - Show help

### CLI Examples

```shell script
# List recent assets from last 48 hours
npm run assets recent 48

# Find all ready assets
npm run assets status ready

# Get details for specific asset
npm run assets details abc123def456

# Search for assets
npm run assets search 'my video title'

# Get assets from date range
npm run assets date 2024-01-01 2024-01-31

# Generate detailed report
npm run assets report

# List assets with full details
npm run assets list --detailed --limit 10
```

### CLI Features

🔍 **Smart Filtering**: Filter by status, date, or custom criteria  
📊 **Detailed Analytics**: Processing success rates, duration stats, error analysis  
🎯 **Asset Discovery**: Search by title, ID, metadata, or technical specs  
📋 **Comprehensive Reports**: Executive summaries with actionable insights  
⚡ **Real-time Data**: Direct integration with Mux API via MCP  
🛠️ **Troubleshooting**: Identify problematic assets and get solutions

## Usage

### Video Processing Workflow

The workflow accepts a video URL and processes it through these stages:

1. **URL Validation**: Verifies the video URL is accessible
2. **Asset Creation**: Creates a new Mux asset from the video
3. **Processing Monitor**: Tracks encoding progress until completion
4. **URL Generation**: Produces streaming URLs and thumbnails

**Example Input:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "title": "My Demo Video",
  "playbackPolicy": "public",
  "generateSubtitles": true,
  "testMode": true
}
```

**Example Output:**
```json
{
  "success": true,
  "assetId": "abc123...",
  "status": "ready",
  "duration": 120.5,
  "hlsUrl": "https://stream.mux.com/xyz789.m3u8",
  "thumbnailUrl": "https://image.mux.com/xyz789/thumbnail.jpg"
}
```

### AI Agent Integration

The video processing agent can handle natural language requests:

- "Process this video URL and create streaming links"
- "Generate subtitles for my video asset"
- "Check the status of asset ID abc123"
- "What video formats does Mux support?"

## API Endpoints

When the server is running, these endpoints are available:

### Workflows
- `GET /api/workflows` - List available workflows
- `POST /api/workflows/video-processing-workflow/run` - Execute the video workflow
- `GET /api/workflows/{workflowId}/runs/{runId}` - Check workflow run status

### Agents
- `GET /api/agents` - List available agents
- `POST /api/agents/videoProcessingAgent/generate` - Chat with the video agent

### Tools
- `GET /api/tools` - List available tools
- `POST /api/tools/{toolId}/execute` - Execute a specific tool

## Available Scripts

```shell script
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Asset Management
npm run assets       # Asset Manager CLI - see commands above

# Testing
npm run test:mux-mcp        # Test Mux MCP connection
npm run test:asset-manager  # Test asset manager agent
npm run test:ollama         # Test Ollama connection
npm run test:comfy          # Test ComfyUI integration

# Agent Interaction
npm run agent:recent-assets # Get recent assets using agent
```

## Asset Management Features

### 📊 Comprehensive Asset Reports

Generate detailed reports including:
- **Executive Summary**: Total assets, storage usage, success rates
- **Asset Distribution**: By status, date, duration, resolution
- **Performance Metrics**: Processing times, error rates, delivery stats
- **Content Analysis**: Popular content, problematic assets
- **Recommendations**: Optimization opportunities, best practices
- **Action Items**: Immediate issues to resolve

### 🔍 Smart Asset Discovery

- **Status Filtering**: Find ready, preparing, errored, or waiting assets
- **Date Range Queries**: Assets created within specific timeframes
- **Metadata Search**: Search by title, external ID, or custom fields
- **Technical Specs**: Filter by resolution, duration, codec details
- **Playback Analysis**: Review streaming configurations and policies

### 🛠️ Troubleshooting & Optimization

- **Error Detection**: Identify failed uploads and processing issues
- **Performance Analysis**: Track processing times and success rates
- **Usage Insights**: Understand content consumption patterns
- **Cost Optimization**: Identify unused or underutilized assets
- **Best Practices**: Receive recommendations for workflow improvements

## Configuration Options

### Workflow Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `videoUrl` | string | required | URL of video to process |
| `title` | string | optional | Video title for metadata |
| `playbackPolicy` | "public" \| "signed" | "public" | Access control policy |
| `generateSubtitles` | boolean | false | Auto-generate English subtitles |
| `testMode` | boolean | true | Use free test mode (watermarked) |
| `maxPollingAttempts` | number | 20 | Max status check attempts |
| `pollingIntervalMs` | number | 10000 | Time between status checks |

### MCP Server Configuration

The Mux MCP server is configured to use dynamic tools with Claude client compatibility. The configuration automatically loads all available Mux API endpoints as tools.

### Agent Configuration

The video processing agent includes:
- Access to all Mux API operations via MCP
- Custom video validation tools
- Streaming URL generation utilities
- Intelligent error handling and user guidance

## Error Handling

The system includes comprehensive error handling for:

- **Invalid URLs**: Validates video accessibility before processing
- **API Failures**: Handles Mux API errors with retry logic
- **Processing Timeouts**: Monitors asset creation with configurable timeouts
- **Network Issues**: Graceful handling of connectivity problems
- **Rate Limiting**: Respects API rate limits with backoff strategies

Common error scenarios and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid video URL" | URL not accessible | Check URL validity and accessibility |
| "Asset processing timeout" | Video too large/complex | Increase polling attempts or use smaller video |
| "MCP tool not available" | MCP server connection issue | Check MCP server configuration and credentials |
| "Insufficient credits" | Mux account limits | Upgrade Mux plan or use test mode |

## Development

### Project Structure

```
src/
├── mastra/
│   ├── index.ts              # Main Mastra instance
│   ├── mcp/
│   │   └── mux-client.ts     # Mux MCP client configuration
│   ├── workflows/
│   │   └── video-processing.ts # Video workflow definition
│   ├── agents/
│   │   ├── video-agent.ts    # AI agent configuration
│   │   └── mux-asset-manager.ts # Asset management agent
│   └── tools/
│       └── index.ts          # Custom tool definitions
├── scripts/
│   ├── asset-cli.ts          # Asset Manager CLI
│   ├── test-asset-manager.ts # Asset manager testing
│   ├── test-mux.ts           # MCP connection testing
│   └── test-ollama.ts        # Ollama connection testing
└── types/
    └── mux.ts                # TypeScript type definitions
```

### Adding Custom Tools

Create new tools in `src/mastra/tools/`:

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const customVideoTool = createTool({
  id: "custom-video-tool",
  description: "Description of what the tool does",
  inputSchema: z.object({
    // Define input parameters
  }),
  outputSchema: z.object({
    // Define output structure
  }),
  execute: async ({ context }) => {
    // Tool implementation
  }
});
```

### Extending the Asset Manager

The `MuxAssetManager` class can be extended with new methods:

```typescript
import { MuxAssetManager } from "./src/mastra/agents/mux-asset-manager";

class ExtendedAssetManager extends MuxAssetManager {
  async getAssetsByResolution(resolution: string) {
    // Custom implementation
  }
  
  async analyzeAssetPerformance() {
    // Custom analytics
  }
}
```

## Monitoring and Observability

### Workflow Monitoring

- Real-time step execution tracking
- Processing time metrics
- Error reporting and stack traces
- Asset status progression logging

### Agent Monitoring

- Tool usage analytics
- Response time tracking
- Conversation flow analysis
- Error pattern detection

### Asset Analytics

- Processing success rates
- Average encoding times
- Storage utilization metrics
- Playback performance data

## Deployment

### Production Build

```shell script
npm run build
npm start
```

### Environment Variables for Production

```
NODE_ENV=production
PORT=4111
MUX_TOKEN_ID=prod_token_id
MUX_TOKEN_SECRET=prod_secret
# ... other production credentials
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4111
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

**MCP Connection Errors**
- Verify Mux credentials in `.env`
- Check network connectivity
- Ensure `@mux/mcp` package is properly installed

**Asset Manager CLI Issues**
- Run `npm run test:mux-mcp` to verify MCP connection
- Check Ollama server is running and accessible
- Verify all environment variables are set

**Workflow Timeout**
- Increase `maxPollingAttempts` parameter
- Check video file size and complexity
- Monitor Mux dashboard for processing status

**Agent Not Responding**
- Verify Ollama is running and model is available
- Check MCP tools are properly loaded
- Review agent logs for error details

### Debug Mode

Enable debug logging:

```
DEBUG=mastra:*
LOG_LEVEL=debug
```

### Testing Commands

```shell script
# Test all components
npm run test:mux-mcp && npm run test:asset-manager && npm run test:ollama

# Test specific functionality
npm run assets help              # Test CLI
npm run assets recent 1          # Test recent assets
npm run assets status ready     # Test status filtering
```

## Support

For issues related to:
- **Mastra Framework**: Check [Mastra Documentation](https://docs.mastra.ai)
- **Mux API**: Visit [Mux Documentation](https://docs.mux.com)
- **MCP Protocol**: See [MCP Specification](https://modelcontextprotocol.io)
- **Ollama**: Check [Ollama Documentation](https://ollama.ai)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.1.0
- **NEW**: Mux Asset Manager CLI with comprehensive asset management
- **NEW**: Intelligent asset analysis and reporting
- **NEW**: Advanced filtering and search capabilities
- **NEW**: Troubleshooting and optimization recommendations
- **IMPROVED**: Enhanced error handling and user feedback
- **IMPROVED**: Better integration with Ollama local models

### v1.0.0
- Initial release with complete video processing workflow
- AI agent integration with Mux MCP tools
- Comprehensive error handling and monitoring
- Production-ready deployment configuration
```
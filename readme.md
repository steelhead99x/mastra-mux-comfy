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

## Prerequisites

- Node.js 18+
- Mux account with API credentials
- OpenAI API key (for agent functionality)

## Installation

```shell script
# Clone the repository
git clone <repository-url>
cd mastra-mux-workflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
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

# OpenAI Configuration (for AI agent)
OPENAI_API_KEY=your_openai_api_key

# Server Configuration (optional)
PORT=4111
```


## Quick Start

### 1. Start the Development Server

```shell script
npm run dev
```


The Mastra playground will be available at http://localhost:4111

### 2. Test the Video Processing Workflow

```shell script
npm run test:workflow
```


This will process a sample video and show the complete pipeline in action.

### 3. Test the AI Agent

```shell script
npm run test:agent
```


This demonstrates the AI agent's ability to handle video processing requests using natural language.

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

# Testing
npm run test:workflow  # Test the video processing workflow
npm run test:agent     # Test the AI agent functionality

# Utilities
npm run type-check    # Run TypeScript type checking
npm run lint          # Run code linting
```


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
│   │   └── video-agent.ts    # AI agent configuration
│   └── tools/
│       └── index.ts          # Custom tool definitions
├── scripts/
│   ├── test-workflow.ts      # Workflow testing script
│   └── test-agent.ts         # Agent testing script
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


### Extending the Workflow

Add new steps to the workflow:

```typescript
const newStep = createStep({
  id: "new-step",
  description: "New processing step",
  inputSchema: z.object({...}),
  outputSchema: z.object({...}),
  execute: async ({ context }) => {
    // Step implementation
  }
});

export const extendedWorkflow = createWorkflow({...})
  .then(existingStep)
  .then(newStep)
  .commit();
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

**Workflow Timeout**
- Increase `maxPollingAttempts` parameter
- Check video file size and complexity
- Monitor Mux dashboard for processing status

**Agent Not Responding**
- Verify OpenAI API key is valid
- Check MCP tools are properly loaded
- Review agent logs for error details

### Debug Mode

Enable debug logging:

```
DEBUG=mastra:*
LOG_LEVEL=debug
```


### Support

For issues related to:
- **Mastra Framework**: Check [Mastra Documentation](https://docs.mastra.ai)
- **Mux API**: Visit [Mux Documentation](https://docs.mux.com)
- **MCP Protocol**: See [MCP Specification](https://modelcontextprotocol.io)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release with complete video processing workflow
- AI agent integration with Mux MCP tools
- Comprehensive error handling and monitoring
- Production-ready deployment configuration
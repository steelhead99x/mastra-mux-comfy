# Mastra Mux Asset Manager

AI-powered video asset management system with local LLM processing, Mux API integration, and ComfyUI workflow support.

## What it does

🎬 **Intelligent Video Asset Management** - Chat with your Mux video library using natural language  
🤖 **Local AI Processing** - Uses Ollama for private, offline AI analysis  
🔧 **Real-time Mux Integration** - Direct access to Mux API through Model Context Protocol (MCP)  
🎨 **ComfyUI Integration** - AI-powered video processing workflows  
📊 **Smart Analytics** - Comprehensive reports and insights about your video assets

## Quick Start

### 1. Prerequisites
- Node.js 18+
- [Ollama](https://ollama.ai) with a model (e.g., `ollama pull llama3.1:8b`)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) (optional - for video processing)
- Mux account (optional - works without credentials)

### 2. Setup
```shell script
git clone <this-repo>
cd mastra-mux-workflow
npm install

# Configure Ollama (adjust IP if needed)
echo "OLLAMA_BASE_URL=http://localhost:11434" > .env
echo "OLLAMA_MODEL=llama3.1:8b" >> .env
```


### 3. Test Everything Works
```shell script
# Test Ollama connection
npm run test:ollama

# Test the AI agent
npm run test:asset-manager

# Test ComfyUI connection (optional)
npm run test:comfy
```


## Features & Commands

### 🧪 Testing Commands
```shell script
npm run test:ollama          # Test Ollama connection
npm run test:asset-manager   # Test AI asset analysis
npm run test:mux-mcp         # Test Mux API (needs credentials)
npm run test:comfy           # Test ComfyUI connection
```


### 🎯 Interactive Asset Manager
```shell script
npm run mux:interactive      # Interactive chat with your video assets
```


Available commands in interactive mode:
- `recent` - Get recent assets
- `list` - List all assets
- `search <query>` - Search assets
- `report` - Generate comprehensive report
- `status <ready|preparing|errored>` - Filter by status

### 🚀 Development Server
```shell script
npm run dev                  # Start Mastra agent system
npm start                   # Production server
```


## Core Features

### 🤖 AI Asset Analysis
Ask questions like:
- "Show me all my video assets from last week"
- "Which assets are still processing?"
- "Generate a report of failed uploads"
- "Find videos longer than 10 minutes"

### 🎨 Video Processing with ComfyUI
- AI-powered video thumbnail generation
- Custom video processing workflows
- Automated video enhancement
- Integration with Mux video pipeline

### 📊 Smart Reports
- Asset inventory and status breakdown
- Processing success rates
- Storage usage analytics
- Performance recommendations
- Error identification and solutions

### 🔧 Technical Integration
- **Mastra Framework**: Modern AI agent architecture
- **Ollama Local LLM**: Private AI processing
- **Mux MCP**: Direct API integration via Model Context Protocol
- **ComfyUI**: AI video processing workflows
- **TypeScript**: Full type safety

## Configuration

### Basic Setup (.env)
```
# Ollama (required)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Mux (optional - for real data)
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret

# ComfyUI (optional - for video processing)
COMFYUI_BASE_URL=http://127.0.0.1:8000
```


### Supported Models
- `llama3.1:8b` (recommended)
- `gpt-oss:20b`
- Any Ollama-compatible model

## Project Structure
```
src/
├── mastra/
│   ├── agents/mux-asset-manager.ts    # Main AI agent
│   ├── models/ollama-provider.ts      # Ollama integration
│   ├── mcp/
│   │   ├── mux-client.ts             # Mux API client
│   │   └── comfyui-client.ts         # ComfyUI integration
│   └── tools/comfy-video-tools.ts    # Video processing tools
├── scripts/
│   ├── test-asset-manager.ts         # Agent testing
│   ├── test-asset-manager-debug.ts   # Interactive mode
│   └── comfy-test.ts                 # ComfyUI testing
├── workflows/
│   └── thumbnail-generator.json      # ComfyUI workflow
└── types/mux.ts                      # TypeScript definitions
```


## How It Works

1. **AI Agent**: Processes natural language requests about video assets
2. **MCP Integration**: Dynamically loads Mux API tools for real-time data
3. **Local LLM**: Uses Ollama for private AI analysis without cloud dependencies
4. **ComfyUI Integration**: Processes videos using AI workflows
5. **Smart Responses**: Combines real Mux data with AI-generated insights

## Troubleshooting

### Ollama Issues
```shell script
# Check Ollama is running
ollama serve

# List available models
ollama list

# Pull a model if needed
ollama pull llama3.1:8b
```


### ComfyUI Issues
```shell script
# Start ComfyUI server
python main.py --listen

# Check if running on correct port
curl http://127.0.0.1:8000/queue
```


### Debug Mode
```shell script
# See detailed responses
DEBUG=true npm run test:asset-manager
```


## Example Output

```
🎬 Interactive Mux Asset Manager
===============================

Enter command: recent

🔍 Getting recent assets...

📋 Response:
Based on your Mux account, here's an analysis of recent video assets:

ASSET INVENTORY (Last 24 Hours):
- Total new assets: 3
- Ready: 2 assets
- Processing: 1 asset
- Errors: 0 assets

DETAILED ASSET LIST:
1. Asset ID: abc123 (Ready)
   - Duration: 2:34 minutes
   - Resolution: 1920x1080
   - Created: 2024-01-15 14:30 UTC

[... detailed analysis continues ...]
```


## ComfyUI Integration

### Test ComfyUI Connection
```shell script
npm run test:comfy
```


Expected output:
```
🚀 Testing ComfyUI Connection...

1️⃣ Testing if ComfyUI server is running...
✅ ComfyUI server is running!

2️⃣ Getting available nodes...
✅ Found 847 node types

3️⃣ Getting system information...
✅ System stats: {...}

🎉 Connection test successful! ComfyUI is ready to use.
```


### Available Video Workflows
- **Thumbnail Generation**: Creates video thumbnails using AI
- **Video Enhancement**: Improves video quality
- **Custom Processing**: User-defined video workflows

## Contributing

This is a demonstration project showing:
- Mastra agent architecture
- Ollama local LLM integration
- MCP protocol implementation
- AI-powered video asset management
- ComfyUI workflow integration

Feel free to extend it for your specific use cases!

## License

MIT License
# Mux AI Video Assistant

**AI-powered video asset management using Mastra framework with Claude and Ollama models.**

A comprehensive video processing solution that combines the Mastra AI framework with Mux's video platform, enabling intelligent video asset management through conversational AI agents.

## 🎯 What it does

Chat with sophisticated AI agents to manage your Mux video assets:

- **📋 Asset Management** - List, search, and filter video assets
- **🔍 Status Monitoring** - Check processing status and readiness
- **📊 Analytics & Reports** - Get detailed upload and error reports  
- **🎥 Playback Management** - Monitor streaming readiness and URLs
- **🚨 Error Analysis** - Intelligent error detection and troubleshooting
- **💡 Smart Insights** - AI-powered video workflow optimization

## 🆕 Latest Updates (v2.0)

### 🔧 Enhanced Security & Reliability
- **Production-Ready Logging** - Environment-based log levels with clean production output
- **Secure Argument Parsing** - Comprehensive validation against shell injection and path traversal
- **Connection Timeout Management** - Configurable timeouts with bounds validation
- **Thread-Safe Connections** - Promise-based synchronization eliminates race conditions
- **Robust Error Handling** - Graceful fallbacks and comprehensive error recovery

### 🎬 Advanced Claude Integration  
- **Claude 3.7,4.0 Support** - Latest model with enhanced reasoning capabilities
- **Streaming & Non-Streaming** - Full support for both interaction modes
- **Tool Integration** - Dynamic Mux tool discovery and execution
- **Memory Persistence** - Conversation history across sessions
- **Interactive Commands** - Built-in status, reset, and tool inspection

### 🔒 Security Enhancements
- **Input Sanitization** - Multi-layer validation for all environment inputs
- **Credential Protection** - No sensitive data exposure in logs
- **Bounds Checking** - Prevent resource exhaustion attacks
- **Safe Defaults** - Automatic fallback to secure configurations

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```
```


### 2. Environment Setup
Create a `.env` file with your credentials:
```shell script
# Required: Mux Video Platform
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret

# Required: Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gpt-oss:20b

# Optional: Advanced Settings
ANTHROPIC_MODEL=claude-3-7-sonnet-20250219
NODE_ENV=development
MUX_CONNECTION_TIMEOUT=20000
MUX_MCP_INTERACTIVE_ARGS=@mux/mcp,client=openai-agents,--tools=dynamic,--resource=video.assets
```


### 3. Install Required Models
```shell script
# Required for embeddings and memory
ollama pull embeddinggemma:300m

# Optional for local Ollama agent
ollama pull gpt-oss:20b
```


## 🤖 AI Agents

### Claude Agent (Recommended)(Must have basic limits removed and moved to tier 4) ⭐
**Advanced reasoning with superior video analysis capabilities**
```shell script
npm run agent:anthropic
```


**✨ New Features:**
- 🧠 **Enhanced Model**: Claude 3.7 Sonnet with improved reasoning
- 🔄 **Interactive Commands**: `status`, `tools`, `reset`, `direct` mode switching
- 💾 **Persistent Memory**: Conversation history with semantic search
- 🛠️ **Dynamic Tools**: Real-time Mux API tool discovery
- 🎯 **Specialized Instructions**: Video workflow optimization prompts

### Ollama Agent
**Privacy-focused local AI processing**
```shell script
npm run dev:alt
```


- 🔒 Complete local privacy (no external API calls)
- ⚡ Fast response times
- 🏠 Runs entirely on your hardware
- 💾 Local conversation storage
- 🔧 Enhanced tool calling with better repetition control

### Web Interface
**Visual dashboard for both agents**
```shell script
npm run dev
# Visit http://localhost:4111
```


- 🌐 Browser-based interface
- 👥 Multi-agent support
- 📱 Responsive design
- 📊 Visual asset management

## 💬 Example Conversations

**Asset Discovery:**
- *"List my recent video uploads"* → Shows recent assets with processing status
- *"Find videos that failed processing"* → Filters by error status with detailed diagnostics
- *"Show me videos ready for streaming"* → Lists assets with active playback URLs

**Status & Analytics:**
- *"What's the status of asset abc123?"* → Detailed asset information and processing timeline
- *"Show me today's upload statistics"* → Summary of processing success/failure rates
- *"Which videos have encoding errors?"* → Error analysis with resolution suggestions

**Interactive Commands (Claude Agent):**
- Type `status` → Check connection status and tool availability
- Type `tools` → List all available Mux tools
- Type `reset` → Reset MCP connection
- Type `direct` → Switch to direct Claude mode (no tools/memory)

## 🛠️ Available Commands

| Command | Purpose | Best For |
|---------|---------|----------|
| `npm run agent:anthropic` | Claude agent (premium) | Complex analysis, best results |
| `npm run dev:alt` | Ollama agent (local) | Privacy, offline usage |
| `npm run dev` | Web UI (both agents) | Visual management, demos |
| `npm run test:anthropic` | Test Claude setup | Troubleshooting Claude |
| `npm run test:auth` | Test Mux credentials | Troubleshooting Mux API |
| `npm run test:list` | Test asset listing | Verify MCP integration |
| `npm run test:vnext` | Test Ollama connectivity | Verify local AI setup |
| `npm run build` | Compile TypeScript | Production deployment |

## 🏗️ Architecture

### Core Components

```
src/mastra/
├── index.ts                    # 🚀 Multi-agent application entry
├── agents/                     # 🤖 AI agent configurations
│   ├── interactive-agent.ts    # Enhanced Ollama agent
│   ├── interactive-agent-errors.ts # Error-focused Ollama agent  
│   └── anthropic-dynamic-agent.ts # Advanced Claude agent
├── models/                     # 🧠 AI model integrations
│   ├── ollama-vnext.ts        # Enhanced Ollama with repetition control
│   └── anthropic-model.ts     # Production-ready Claude integration
├── mcp/                       # 🔌 Secure Model Context Protocol clients
│   └── mux-client.ts         # 🎥 Thread-safe Mux API integration
├── types/                     # 📝 TypeScript definitions
│   └── mux.ts               # Comprehensive Mux type definitions
└── scripts/                   # 🔧 Testing and utilities
    ├── test-anthropic-agent.ts # Claude integration tests
    ├── ollama-vnext-demo.ts   # Enhanced Ollama examples
    └── test-mux-auth.ts      # Mux credential validation
```


### 🔐 Security Architecture

#### Multi-Layer Input Validation
- **Environment Variables** - Comprehensive validation with secure defaults
- **Shell Injection Prevention** - Blocks dangerous characters and patterns
- **Path Traversal Protection** - Prevents directory escape attempts
- **Bounds Checking** - Length limits and resource usage controls

#### Connection Security
- **Promise-Based Synchronization** - Thread-safe connection management
- **Timeout Protection** - Configurable timeouts prevent hanging connections
- **Graceful Degradation** - Automatic fallback to safe configurations
- **Clean Shutdown** - Proper resource cleanup on termination

## 🧠 Memory System

Both agents use persistent memory with advanced features:

- **📚 Conversation History** - SQLite-based storage with full context retention
- **🔍 Semantic Search** - Find relevant past interactions using embeddings
- **🧵 Thread Management** - Organized conversation threads with context awareness
- **⚡ Working Memory** - Active context for ongoing conversations

### Memory Databases
- `agent-memory.db` - Ollama agent conversations and context
- `anthropic-agent-memory.db` - Claude agent conversations and context

### Memory Configuration
```typescript
memory: new Memory({
    storage: new LibSQLStore({ url: "file:./agent-memory.db" }),
    vector: new LibSQLVector({ connectionUrl: "file:./agent-memory.db" }),
    embedder: ollamaProvider.textEmbeddingModel("embeddinggemma:300m"),
    options: {
        workingMemory: { enabled: true },
        semanticRecall: {
            topK: 8,
            messageRange: 15, 
            scope: 'thread'
        }
    }
})
```


## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MUX_TOKEN_ID` | ✅ | Mux API token ID | - |
| `MUX_TOKEN_SECRET` | ✅ | Mux API token secret | - |
| `ANTHROPIC_API_KEY` | ✅* | Anthropic Claude API key | - |
| `OLLAMA_BASE_URL` | ❌ | Ollama server URL | `http://localhost:11434` |
| `ANTHROPIC_MODEL` | ❌ | Claude model version | `claude-3-7-sonnet-20250219` |
| `OLLAMA_MODEL` | ❌ | Ollama model name | `gpt-oss:20b` |
| `NODE_ENV` | ❌ | Environment mode | `development` |
| `MUX_CONNECTION_TIMEOUT` | ❌ | Connection timeout (5s-5min) | `20000` |
| `MUX_MCP_INTERACTIVE_ARGS` | ❌ | MCP client configuration | See below |

*Required for Claude agent functionality

### 🆕 Advanced Configuration
```shell script
# Production logging (errors only)
NODE_ENV=production

# Custom connection timeout (5-300 seconds)
MUX_CONNECTION_TIMEOUT=30000

# Enhanced MCP configuration
MUX_MCP_INTERACTIVE_ARGS=@mux/mcp,client=openai-agents,--tools=dynamic,--resource=video.assets,--resource=video.errors
```


Available resources:
- `video.assets` - Core video asset management
- `video.errors` - Error tracking and analysis
- `video.analytics` - Usage and performance metrics
- `video.webhooks` - Event notification handling

## 🚨 Troubleshooting

### 🆕 Enhanced Diagnostics

**Connection Issues:**
```shell script
# Test all components
npm run test:anthropic     # Claude integration
npm run test:auth          # Mux authentication  
npm run test:list          # Asset listing functionality
npm run test:vnext         # Ollama connectivity
```


**Production Logging:**
```shell script
# Enable debug logging
NODE_ENV=development npm run agent:anthropic

# Production mode (errors only)  
NODE_ENV=production npm run agent:anthropic
```


**Security Validation:**
- ✅ Environment variables automatically validated
- ✅ Connection timeouts enforced (5s-5min range)
- ✅ Input sanitization prevents injection attacks
- ✅ Graceful fallbacks for invalid configurations

### Common Issues

**Claude Agent Issues:**
```shell script
# Check API key and test connection
echo $ANTHROPIC_API_KEY
npm run test:anthropic
```


**Mux Integration Issues:**
```shell script
# Verify credentials and test connection
npm run test:auth
npm run test:list
```


**Ollama Connection Issues:**
```shell script
# Start Ollama server and test models
ollama serve
ollama pull embeddinggemma:300m
npm run test:vnext
```


## 🔒 Security & Privacy

### 🆕 Enhanced Security Features
- **🔐 Zero-Log Credentials** - No sensitive data in logs (production-ready)
- **🛡️ Input Sanitization** - Multi-layer validation against all injection types
- **⏱️ Timeout Protection** - Configurable bounds prevent resource attacks
- **🔒 Thread-Safe Operations** - Promise-based synchronization eliminates race conditions
- **🚫 Secure Defaults** - Automatic fallback to safe configurations

### Privacy Options
- **🌐 Cloud AI (Claude)** - Advanced reasoning with API-based processing
- **🏠 Local AI (Ollama)** - Complete privacy with local processing
- **💾 Local Storage** - SQLite databases (completely local)
- **🔒 Isolated Execution** - MCP runs as isolated subprocess

## 📊 Performance Metrics

### Typical Response Times
- **Claude Agent**: 2-5 seconds (depends on API latency)
- **Ollama Agent**: 1-3 seconds (local processing)
- **Tool Execution**: 0.5-2 seconds (depends on Mux API response)
- **Memory Retrieval**: <0.1 seconds (local SQLite queries)

### 🆕 Enhanced Performance
- **Connection Pooling** - Thread-safe connection reuse
- **Timeout Management** - No hanging connections
- **Clean Error Handling** - Fast failure recovery
- **Optimized Logging** - Production-friendly performance

## 🎯 Latest Features

### 🔧 Production Enhancements
- **Environment-Based Logging** - Debug in dev, silent in production
- **Configurable Timeouts** - Prevent hanging connections
- **Input Validation** - Comprehensive security against malicious inputs
- **Thread Safety** - Promise-based connection management

### 🎬 Advanced AI Capabilities
- **Claude 3.7 Sonnet** - Latest model with enhanced reasoning
- **Interactive Commands** - Built-in status, reset, and inspection tools
- **Memory Persistence** - Cross-session conversation continuity
- **Dynamic Tool Discovery** - Real-time API capability detection

### 🛡️ Security Improvements
- **Zero-Credential Logging** - No sensitive data exposure
- **Multi-Layer Validation** - Defense against injection attacks
- **Secure Defaults** - Safe fallback configurations
- **Bounds Checking** - Resource exhaustion prevention

## 🔗 Resources & Documentation

- **[Mastra Framework](https://mastra.ai/docs)** - AI agent orchestration platform
- **[Mux Video API](https://docs.mux.com)** - Video infrastructure and analytics
- **[Anthropic Claude](https://console.anthropic.com)** - Advanced AI model access
- **[Ollama](https://ollama.ai)** - Local AI model runtime
- **[Model Context Protocol](https://modelcontextprotocol.io)** - Tool integration standard

## 🤝 Contributing

We welcome contributions! Here are some areas where you can help:

### Priority Areas
- 🔌 **Additional AI Model Integrations** (OpenAI, Google, etc.)
- 🎥 **Enhanced Mux Tool Coverage** (webhooks, analytics, live streaming)
- 🎨 **UI/UX Improvements** (better web interface, mobile support)
- ⚡ **Performance Optimizations** (caching, batch operations)
- 📖 **Documentation Updates** (tutorials, examples, best practices)

### Development Process
1. **Fork the repository** and create a feature branch
2. **Add comprehensive tests** for new functionality
3. **Follow TypeScript best practices** and maintain code quality
4. **Update documentation** to reflect your changes
5. **Submit a pull request** with clear description and examples

### Code Standards
- Use TypeScript with strict mode enabled
- Follow existing code organization patterns
- Add JSDoc comments for public APIs
- Include error handling and logging
- Write tests for critical functionality
- Follow security best practices

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ using:
- **[Mastra](https://mastra.ai)** - For AI agent orchestration and workflow management
- **[Mux](https://mux.com)** - For reliable video infrastructure and analytics
- **[Anthropic](https://anthropic.com)** - For advanced AI reasoning capabilities
- **[Ollama](https://ollama.ai)** - For local, privacy-focused AI processing

---

**Ready to revolutionize your video workflow with AI?**

Start with `npm install` and `npm run agent:anthropic` to experience intelligent video management today! 🚀

### Recent Changes (v2.0)
- ✅ Enhanced security with comprehensive input validation
- ✅ Production-ready logging with environment-based levels
- ✅ Thread-safe connection management with Promise-based sync
- ✅ Configurable timeouts with bounds validation
- ✅ Claude 3.7 Sonnet integration with advanced capabilities
- ✅ Interactive command system for real-time control
- ✅ Improved error handling and graceful degradation
- ✅ Zero-credential logging for production security
```
This updated README reflects all the latest improvements including:

1. **Security Enhancements** - Comprehensive input validation, secure logging, thread safety
2. **Advanced Claude Integration** - Latest model, interactive commands, streaming support
3. **Production Readiness** - Environment-based logging, configurable timeouts, robust error handling
4. **Enhanced User Experience** - Interactive commands, better diagnostics, improved performance
5. **Architecture Updates** - Thread-safe connections, Promise-based sync, clean resource management

The changelog highlights the major improvements while maintaining the comprehensive documentation structure.
```

// Ensure telemetry instrumentation is loaded before Mastra
import "./instrumentation";
import { Mastra } from "@mastra/core";
import { createMuxAssetManagerAgent } from "./agents/mux-asset-manager";

// Create Mastra instance with minimal config to avoid registering non-agent config objects
const mastra = new Mastra({
    agents: {},
    workflows: {},
    tools: []
} as any);

// Export async function to initialize agent with tools
export async function initializeMuxAssetManager() {
    try {
        const agent = await createMuxAssetManagerAgent();
        return agent;
    } catch (error) {
        console.error("Failed to initialize Mux Asset Manager:", error);
        throw error;
    }
}

// Export the Mastra instance
export default mastra;

// Start the server if this file is run directly
async function startServer() {
    try {
        console.log("🚀 Starting Mastra development server...");

        const port = process.env.PORT || 4111;
        console.log(`📡 Server will be available at http://localhost:${port}`);

        // Check if Mastra has a serve method
        if (typeof (mastra as any).serve === 'function') {
            await (mastra as any).serve(Number(port));
        } else {
            // Fallback: start a minimal HTTP server to provide a basic UI
            const http = await import('node:http');

            // Ensure agent can be created
            let agentReady = false;
            try {
                await initializeMuxAssetManager();
                agentReady = true;
            } catch (error) {
                console.error("❌ Failed to initialize agent:", error);
            }

            const server = http.createServer((req, res) => {
                if (!req.url) {
                    res.statusCode = 400;
                    res.end('Bad Request');
                    return;
                }
                if (req.url.startsWith('/api/ping')) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ ok: true, agentReady }));
                    return;
                }
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mastra Mux ComfyUI – Dev UI</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 2rem; line-height: 1.5; }
    code { background: #f5f5f5; padding: 0.15rem 0.35rem; border-radius: 4px; }
    .ok { color: #0a7; }
    .warn { color: #c70; }
    .err { color: #c33; }
    ul { margin-top: 0.25rem; }
    .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0; }
    .small { color: #666; font-size: 0.9rem; }
    a.button { display: inline-block; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 6px; text-decoration: none; color: #333; background: #fafafa; }
  </style>
</head>
<body>
  <h1>Mastra Mux Comfy – Development UI</h1>
  <p class="${agentReady ? 'ok' : 'warn'}">Agent status: ${agentReady ? 'Ready' : 'Not initialized'}</p>

  <div class="card">
    <h2>Quick checks</h2>
    <ul>
      <li><a class="button" href="/api/ping" target="_blank">GET /api/ping</a> – health check</li>
    </ul>
  </div>

  <div class="card">
    <h2>CLI commands</h2>
    <p>From your terminal:</p>
    <ul>
      <li><code>npm run test:asset-manager</code> – interactive asset manager</li>
      <li><code>npm run test:mux-mcp</code> – test MCP connection</li>
      <li><code>npm run test:ollama</code> – test Ollama connection</li>
    </ul>
  </div>

  <p class="small">This fallback UI is shown because the current @mastra/core version doesn’t expose a built-in serve() method. When you upgrade to a version with server support, this page will be replaced automatically.</p>
</body>
</html>`);
            });

            await new Promise<void>((resolve) => server.listen(Number(port), resolve));

            console.log(`✅ Development server running at http://localhost:${port}`);
            console.log(agentReady ? '🤖 Mux Asset Manager agent ready!' : '⚠️ Agent failed to initialize (see logs above)');
            console.log("🎯 Open the UI in your browser or use the CLI commands listed below.");

            console.log("\n🔧 Available commands:");
            console.log("npm run test:asset-manager  - Test the asset manager");
            console.log("npm run test:ollama         - Test Ollama connection");
            console.log("npm run test:mux-mcp        - Test MCP connection");
            return;
        }

        console.log("✅ Mastra server started successfully!");
        console.log(`🎯 Access the playground at http://localhost:${port}`);

        console.log("\n🔧 To use the Mux Asset Manager:");
        console.log("const agent = await initializeMuxAssetManager();");
        console.log("const response = await agent.generate('Your message here');");

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        console.log("\n🔧 You can still use the agents and CLI commands:");
        console.log("npm run test:asset-manager  - Test the asset manager");
        console.log("npm run assets              - Use the asset CLI");
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}
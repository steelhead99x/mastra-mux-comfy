// Ensure telemetry instrumentation is loaded before Mastra (JS version to avoid TS in bundle)
import "./instrumentation.js";
import { Mastra } from "@mastra/core";
import mastraConfig from "../../mastra.config";
import { createMuxAssetManagerAgent } from "./agents/mux-asset-manager";
import { pathToFileURL } from "node:url";

// Create Mastra instance using a sanitized config to avoid registering plain objects as agents/workflows
const sanitizedConfig = (() => {
    const cfg: any = { ...mastraConfig };
    // Remove sections that may contain plain objects instead of Mastra instances
    if (cfg.agents) delete cfg.agents;
    if (cfg.workflows) delete cfg.workflows;
    if (cfg.legacy_workflows) delete cfg.legacy_workflows;
    return cfg;
})();
const mastra = new Mastra(sanitizedConfig as any);

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
export { mastra };
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
            // Try to launch the Mastra Dev Server CLI to provide the full UI
            try {
                const { spawn } = await import('node:child_process');
                console.log('ℹ️  @mastra/core does not expose mastra.serve(). Attempting to launch Mastra Dev Server via CLI...');
                const child = spawn('npx', ['mastra@latest', 'dev', '--port', String(port)], {
                    stdio: 'inherit',
                    shell: false,
                    env: { ...process.env }
                });
                child.on('exit', (code) => {
                    if (code === 0) {
                        console.log('✅ Mastra Dev Server exited cleanly.');
                    } else {
                        console.error(`❌ Mastra Dev Server exited with code ${code}. Falling back to minimal server...`);
                    }
                });
                // Do not return here; if the CLI fails to start immediately, we will fall back below.
            } catch (e) {
                console.warn('⚠️  Failed to spawn Mastra Dev Server CLI automatically:', e);
            }

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
    <h2>Get the full Mastra Dev UI</h2>
    <ol>
      <li>We attempted to auto-run <code>npx mastra@latest dev --port ${port}</code>. Check your terminal for the Dev Server logs.</li>
      <li>If the CLI failed to start, ensure you have network access and permissions to run <code>npx</code>.</li>
      <li>You can also run it manually in this project: <code>npx mastra@latest dev --port ${port}</code>.</li>
    </ol>
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

  <p class="small">This fallback UI appears because the current <code>@mastra/core</code> in node_modules does not provide a built-in server. The project will try to launch the official Mastra Dev Server automatically. If it cannot, use the manual command above.</p>
</body>
</html>`);
            });

            await new Promise<void>((resolve) => server.listen(Number(port), resolve));

            console.log(`✅ Fallback development server running at http://localhost:${port}`);
            console.log(agentReady ? '🤖 Mux Asset Manager agent ready!' : '⚠️ Agent failed to initialize (see logs above)');
            console.log("🎯 If the Mastra Dev Server started successfully, use its URL. Otherwise, this minimal UI is available.");

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

// ESM-compatible direct-run check
const isDirectRun = (() => {
    const entry = process.argv && process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
    return import.meta && import.meta.url && entry && import.meta.url === entry;
})();

if (isDirectRun) {
    // Note: intentional no-await; startServer manages its own async flow
    startServer();
}
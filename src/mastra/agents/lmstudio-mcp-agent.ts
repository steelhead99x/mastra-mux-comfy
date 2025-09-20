import 'dotenv/config';
import readline from 'readline';
import { generateText } from 'ai';
import { model as lmstudioModel, MODEL_NAME, LMSTUDIO_BASE_URL } from '../models/lmstudio';
import { muxMcpClient } from '../mcp/mux-client';

type ToolRecord = Record<string, any>;

async function getToolsSafe(): Promise<ToolRecord> {
    try {
        return await muxMcpClient.getTools();
    } catch (err) {
        console.error('❌ Failed to load MCP tools:', err);
        return {};
    }
}

function printHelp() {
    console.log('\nCommands:');
    console.log("  • Type any message to chat with the LM Studio model");
    console.log("  • 'tools'                        - List available MCP tools");
    console.log("  • 'discover [query]'             - Discover endpoints (uses list_api_endpoints)");
    console.log("  • 'schema <endpoint>'            - Get endpoint schema (uses get_api_endpoint_schema)");
    console.log("  • 'invoke <endpoint> <jsonArgs>' - Invoke an endpoint with optional JSON args (uses invoke_api_endpoint)");
    console.log("  • 'status'                       - Show MCP connection status");
    console.log("  • 'reset'                        - Reset MCP connection");
    console.log("  • 'help'                         - Show this help");
    console.log("  • 'exit'                         - Quit the session\n");
}

async function handleDiscover(tools: ToolRecord, args: string[]) {
    if (!tools.list_api_endpoints) {
        console.log("❌ 'list_api_endpoints' tool is not available.");
        return;
    }
    const query = args.join(' ').trim();
    console.log(`🔍 Discovering endpoints${query ? ` (query: ${query})` : ''}...`);
    const res = await tools.list_api_endpoints.execute({
        context: query ? { search_query: query } : {},
    });
    console.log('Result:');
    console.log(JSON.stringify(res, null, 2));
}

async function handleSchema(tools: ToolRecord, endpoint: string | undefined) {
    if (!tools.get_api_endpoint_schema) {
        console.log("❌ 'get_api_endpoint_schema' tool is not available.");
        return;
    }
    if (!endpoint) {
        console.log("⚠️ Usage: schema <endpoint_name>");
        return;
    }
    console.log(`📝 Getting schema for '${endpoint}'...`);
    const res = await tools.get_api_endpoint_schema.execute({
        context: { endpoint },
    });
    console.log('Schema:');
    console.log(JSON.stringify(res, null, 2));
}

async function handleInvoke(tools: ToolRecord, endpoint: string | undefined, jsonArgsRaw?: string) {
    if (!tools.invoke_api_endpoint) {
        console.log("❌ 'invoke_api_endpoint' tool is not available.");
        return;
    }
    if (!endpoint) {
        console.log("⚠️ Usage: invoke <endpoint_name> <jsonArgs?>");
        return;
    }

    let argsObj: Record<string, unknown> = {};
    if (jsonArgsRaw) {
        try {
            argsObj = JSON.parse(jsonArgsRaw);
        } catch (err) {
            console.log(`⚠️ Could not parse JSON args: ${String(err)}`);
            console.log("   Provide valid JSON or omit arguments.");
            return;
        }
    }

    console.log(`🚀 Invoking '${endpoint}' with args: ${JSON.stringify(argsObj)}`);
    const result = await tools.invoke_api_endpoint.execute({
        context: {
            endpoint_name: endpoint,
            args: argsObj,
        },
    });

    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
}

async function main() {
    console.log('🎬 LM Studio MCP Interactive Agent');
    console.log(`   Base URL: ${LMSTUDIO_BASE_URL}`);
    console.log(`   Model: ${MODEL_NAME}`);

    // Preload tools (non-fatal if this fails; you can retry with 'reset')
    let tools = await getToolsSafe();
    if (Object.keys(tools).length > 0) {
        console.log(`✅ MCP connected. ${Object.keys(tools).length} tools available.`);
    } else {
        console.log('⚠️ MCP tools not loaded yet. Use "reset" after fixing env or MCP availability.');
    }

    printHelp();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const ask = () => new Promise<string>((resolve) => rl.question('💬 You> ', resolve));

    try {
        for (;;) {
            const input = (await ask()).trim();
            if (!input) continue;

            // commands
            if (input.toLowerCase() === 'exit') {
                console.log('👋 Bye!');
                break;
            }
            if (input.toLowerCase() === 'help') {
                printHelp();
                continue;
            }
            if (input.toLowerCase() === 'tools') {
                tools = await getToolsSafe();
                const names = Object.keys(tools);
                console.log(`\n🛠️ Available tools (${names.length}):`);
                names.forEach((n, i) => console.log(`   ${i + 1}. ${n}`));
                console.log('');
                continue;
            }
            if (input.toLowerCase() === 'status') {
                const connected = muxMcpClient.isConnected();
                const names = Object.keys(tools ?? {});
                console.log('\n📊 Status:');
                console.log(`   MCP Connected: ${connected ? '✅' : '❌'}`);
                console.log(`   Tools Available: ${names.length}`);
                console.log('');
                continue;
            }
            if (input.toLowerCase() === 'reset') {
                console.log('🔄 Resetting MCP connection...');
                await muxMcpClient.reset();
                tools = await getToolsSafe();
                console.log(`✅ Reset complete. ${Object.keys(tools).length} tools loaded.`);
                continue;
            }

            // discover [query]
            if (input.toLowerCase().startsWith('discover')) {
                const parts = input.split(' ').slice(1);
                try {
                    await handleDiscover(tools, parts);
                } catch (err) {
                    console.error('❌ Discover failed:', err);
                }
                continue;
            }

            // schema <endpoint>
            if (input.toLowerCase().startsWith('schema')) {
                const endpoint = input.split(' ').slice(1).join(' ').trim();
                try {
                    await handleSchema(tools, endpoint);
                } catch (err) {
                    console.error('❌ Schema fetch failed:', err);
                }
                continue;
            }

            // invoke <endpoint> <jsonArgs?>
            if (input.toLowerCase().startsWith('invoke')) {
                const parts = input.split(' ');
                if (parts.length < 2) {
                    console.log("⚠️ Usage: invoke <endpoint_name> <jsonArgs?>");
                    continue;
                }
                const endpoint = parts[1];
                const jsonArgsRaw = parts.slice(2).join(' ').trim() || undefined;

                try {
                    await handleInvoke(tools, endpoint, jsonArgsRaw);
                } catch (err) {
                    console.error('❌ Invoke failed:', err);
                }
                continue;
            }

            // Default: chat with LM Studio model
            try {
                const { text, usage } = await generateText({
                    model: lmstudioModel,
                    prompt: input,
                    temperature: 0.3,
                });
                console.log('\n🤖 Agent:\n' + text + '\n');
                if (usage) {
                    console.log('ℹ️ Token usage:', usage);
                }
            } catch (err) {
                console.error('❌ LM Studio call failed:', err);
                console.log('💡 Ensure LM Studio is running and LMSTUDIO_BASE_URL/API key are correct.');
            }
        }
    } finally {
        rl.close();
        try {
            await muxMcpClient.disconnect();
        } catch {
            // ignore
        }
    }
}

main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
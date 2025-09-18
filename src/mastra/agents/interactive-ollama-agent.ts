// TypeScript
import readline from "readline";
import { generateText, streamText } from "ai";
import { ollamaModel } from "../models/ollama-vnext";
import { muxMcpClient } from "../mcp/mux-client";

type Role = "system" | "user" | "assistant";

interface Message {
    role: Role;
    content: string;
}

const SYSTEM_PROMPT = `You are a helpful AI agent. Be concise, accurate, and actionable. If users ask about Mux, prefer using available MCP tools when relevant.`;

// Keep a short rolling history to give context without overwhelming the model
const MAX_TURNS = 8;

function makeInterface() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
    });
    rl.on("SIGINT", () => {
        rl.close();
        process.exit(0);
    });
    return rl;
}

// Summarize up to 10 tools via the LLM, with safe fallback
async function summarizeMuxTools(): Promise<string> {
    try {
        const tools = await muxMcpClient.getTools();
        const entries = Object.values(tools) as Array<{
            name: string;
            description?: string;
            inputSchema?: unknown;
        }>;

        if (!entries.length) {
            return "No Mux MCP tools are available at the moment.";
        }

        const total = entries.length;
        const limited = entries.slice(0, 10);

        const toolDigest = limited
            .map((t, idx) => {
                const desc = (t.description || "").toString().trim().replace(/\s+/g, " ");
                return `${idx + 1}. ${t.name} — ${desc || "No description provided."}`;
            })
            .join("\n");

        const prompt = `You are preparing a short welcome message that summarizes what the user can do with the following Mux tools.
Write a friendly, concise summary (bulleted when useful), and avoid repeating tool names verbatim unless helpful.
Focus on capabilities, not implementation. Keep it under ~120 words.

Tools (showing up to 10): 
${toolDigest}

Additional instruction:
- If there are more than 10 tools in total, end with: "Showing 10 of ${total} tools."`;

        const { text } = await generateText({
            model: ollamaModel,
            prompt,
            temperature: 0.3,
        });

        const suffix = total > 10 ? `\n\nShowing 10 of ${total} tools.` : "";
        return `${text.trim()}${suffix}`;
    } catch {
        // Fallback to a basic list if summarization or fetch fails
        try {
            const tools = await muxMcpClient.getTools();
            const entries = Object.values(tools) as Array<{ name: string; description?: string }>;
            const total = entries.length;
            const limited = entries.slice(0, 10);
            const list = limited
                .map((t) => `- ${t.name}${t.description ? `: ${t.description}` : ""}`)
                .join("\n");
            const suffix = total > 10 ? `\n\nShowing 10 of ${total} tools.` : "";
            return `Here are the available Mux tools you can ask me to use:\n${list}${suffix}`;
        } catch {
            return "Could not retrieve Mux tools. You can still chat or try again later.";
        }
    }
}

export async function runInteractiveAgent() {
    console.log("🎬 Interactive AI Agent (Ollama vNext: gpt-oss:20b)");

    // At startup, connect to Mux MCP and summarize tools
    console.log("🔌 Connecting to Mux MCP and summarizing capabilities...");
    try {
        const summary = await summarizeMuxTools();
        console.log("\n📋 Mux Capabilities Summary:");
        console.log(summary);
    } catch (e: any) {
        console.log("⚠️ Unable to summarize Mux tools:", e?.message || String(e));
    }

    console.log("\nType your message and press Enter. Type 'exit' to quit.\n");

    const history: Message[] = [{ role: "system", content: SYSTEM_PROMPT }];
    const rl = makeInterface();
    const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

    while (true) {
        const input = (await ask("You > ")).trim();
        if (!input) continue;
        if (input.toLowerCase() === "exit") {
            rl.close();
            break;
        }

        history.push({ role: "user", content: input });

        // Keep recent turns within limit (preserve system message)
        const trimmed = [history[0], ...history.slice(-MAX_TURNS * 2)];

        // Stream the response
        process.stdout.write("Assistant > ");
        let assistantText = "";
        try {
            const { textStream } = await streamText({
                model: ollamaModel,
                messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
                temperature: 0.2,
            });

            for await (const token of textStream) {
                assistantText += token;
                process.stdout.write(token);
            }
            process.stdout.write("\n");
            history.push({ role: "assistant", content: assistantText });
        } catch (err: any) {
            console.error("\n[Error]", err?.message || String(err));
        }
    }
}
import dotenv from "dotenv";
import { muxMcpClient } from "../mcp/mux-client";
import { OllamaProvider } from "../models/ollama-provider";

dotenv.config();

type AgentResult = { text: string; finishReason?: string; usage?: any; toolCalls?: any[]; toolResults?: any[] };

type ListOptions = { limit?: number; includeDetails?: boolean };

type AssetStatus = 'ready' | 'preparing' | 'errored' | 'waiting';

export class MuxAssetManager {
    private debug: boolean;

    constructor() {
        this.debug = process.env.DEBUG === 'true' || false;
    }

    private log(label: string, data: any) {
        if (!this.debug) return;
        console.log(`\n🔧 MUX DEBUG - ${label}:`);
        try {
            console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
        } catch {
            console.log(data);
        }
    }

    private async getTools() {
        const tools = await muxMcpClient.getTools();
        this.log('Available tools', Object.keys(tools));
        return tools as Record<string, any>;
    }

    async debugTools(): Promise<void> {
        const tools = await this.getTools();
        const names = Object.keys(tools);
        console.log(`🛠️  Found ${names.length} Mux tools`);
        names.slice(0, 20).forEach(n => console.log(` • ${n}`));
    }

    async testEndpoints(): Promise<void> {
        const tools = await this.getTools();
        // pick a safe read-only tool
        const name = Object.keys(tools).find(n => /list|get|retrieve/i.test(n)) || Object.keys(tools)[0];
        if (!name) {
            console.log('⚠️  No tools available');
            return;
        }
        const tool = tools[name];
        this.log('Testing tool', name);
        try {
            if (typeof tool.call === 'function') await tool.call({});
            else if (typeof tool.execute === 'function') await tool.execute({});
            else if (typeof tool.run === 'function') await tool.run({});
            console.log(`✅ Endpoint reachable: ${name}`);
        } catch (e: any) {
            console.log(`⚠️  Endpoint responded with error (mechanism OK): ${name} -> ${e?.message || e}`);
        }
    }

    private stringify(obj: any): string {
        try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
    }

    private formatAssetsList(raw: any, header: string): AgentResult {
        let text = `${header}\n`;
        if (Array.isArray(raw?.data)) {
            const items = raw.data;
            text += `Found ${items.length} items\n`;
            items.slice(0, 20).forEach((it: any, idx: number) => {
                const id = it.id || it.asset_id || it.playback_id || it.uid || `#${idx+1}`;
                const status = it.status || it.state || it.passthrough || 'unknown';
                const created = it.created_at || it.created || it.createdAt || it.timestamp || '';
                text += `- ${id} (${status}) ${created ? `created: ${created}` : ''}\n`;
            });
            if (items.length > 20) text += `...and ${items.length - 20} more\n`;
        } else {
            text += this.stringify(raw);
        }
        return { text };
    }

    private async callToolPrefer(names: RegExp[], args: any = {}): Promise<any> {
        const tools = await this.getTools();
        const key = Object.keys(tools).find(k => names.some(rx => rx.test(k)));
        if (!key) throw new Error(`No matching tool for ${names.map(r => r.toString()).join(', ')}`);
        const tool = tools[key];
        if (typeof tool.call === 'function') return tool.call(args);
        if (typeof tool.execute === 'function') return tool.execute(args);
        if (typeof tool.run === 'function') return tool.run(args);
        throw new Error(`Tool ${key} has no executable method`);
    }

    async listAllAssets(options: ListOptions = {}): Promise<AgentResult> {
        try {
            const raw = await this.callToolPrefer([/list.*asset/i, /list/i]);
            return this.formatAssetsList(raw, `All assets${options.limit ? ` (limit ${options.limit})` : ''}`);
        } catch (e: any) {
            return { text: `Failed to list assets: ${e?.message || e}` };
        }
    }

    async getRecentAssets(hours: number = 24): Promise<AgentResult> {
        try {
            const raw = await this.callToolPrefer([/list.*asset/i, /list/i]);
            return this.formatAssetsList(raw, `Assets from last ${hours} hours`);
        } catch (e: any) {
            return { text: `Failed to get recent assets: ${e?.message || e}` };
        }
    }

    async getAssetsByStatus(status: AssetStatus): Promise<AgentResult> {
        try {
            const raw = await this.callToolPrefer([/list.*asset/i, /list/i]);
            // Best-effort client-side filter if array shape is recognizable
            const data = Array.isArray(raw?.data) ? { data: raw.data.filter((it: any) => {
                const s = (it.status || it.state || '').toString().toLowerCase();
                return s.includes(status);
            }) } : raw;
            return this.formatAssetsList(data, `Assets with status: ${status}`);
        } catch (e: any) {
            return { text: `Failed to get assets by status: ${e?.message || e}` };
        }
    }

    async searchAssets(query: string): Promise<AgentResult> {
        try {
            // Prefer a native search tool if exposed, otherwise list and filter client-side
            let raw: any;
            try {
                raw = await this.callToolPrefer([/search.*asset/i, /search/i], { query });
            } catch {
                raw = await this.callToolPrefer([/list.*asset/i, /list/i]);
                if (Array.isArray(raw?.data)) {
                    raw = { data: raw.data.filter((it: any) => this.stringify(it).toLowerCase().includes(query.toLowerCase())) };
                }
            }
            return this.formatAssetsList(raw, `Search results for: "${query}"`);
        } catch (e: any) {
            return { text: `Failed to search assets: ${e?.message || e}` };
        }
    }

    async generateAssetReport(): Promise<AgentResult> {
        try {
            const list = await this.listAllAssets({});
            const recent = await this.getRecentAssets(24);
            const ready = await this.getAssetsByStatus('ready');
            const errored = await this.getAssetsByStatus('errored');

            const text = [
                '📊 Mux Asset Report',
                '===================',
                '',
                recent.text,
                '',
                'Ready assets:',
                ready.text,
                '',
                'Errored assets:',
                errored.text,
                '',
                'Inventory overview:',
                list.text
            ].join('\n');

            return { text };
        } catch (e: any) {
            return { text: `Failed to generate report: ${e?.message || e}` };
        }
    }
}

export async function createMuxAssetManagerAgent() {
    // Minimal agent that can generate responses using Ollama
    const provider = new OllamaProvider(process.env.OLLAMA_BASE_URL);
    const model = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
    return {
        async generate(prompt: string) {
            const res = await provider.generate(prompt, model);
            return res;
        }
    };
}
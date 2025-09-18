import dotenv from "dotenv";
import { muxMcpClient } from "../mcp/mux-client";
import { Agent } from "@mastra/core";
import { createOllamaModel } from "../models/ollama-model";

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
        const level = (process.env.DEBUG_LEVEL || 'minimal').toLowerCase();
        console.log(`\n🔧 MUX DEBUG - ${label}:`);
        try {
            if (level === 'full') {
                // Full, but still safe against circular refs
                console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
                return;
            }
            // Minimal mode: summarize large arrays/objects
            const summarize = (val: any, depth = 0): any => {
                if (val == null) return val;
                if (typeof val !== 'object') return val;
                if (Array.isArray(val)) {
                    const max = 10;
                    return {
                        type: 'Array',
                        length: val.length,
                        preview: val.slice(0, max),
                        truncated: val.length > max ? val.length - max : 0
                    };
                }
                // Object
                const keys = Object.keys(val);
                const maxKeys = 10;
                const out: Record<string, any> = {};
                keys.slice(0, maxKeys).forEach(k => {
                    const v = (val as any)[k];
                    out[k] = typeof v === 'object' ? '[object]' : v;
                });
                return {
                    type: 'Object',
                    keys: keys.length,
                    preview: out,
                    truncatedKeys: keys.length > maxKeys ? keys.length - maxKeys : 0
                };
            };
            const summarized = summarize(data);
            console.log(typeof summarized === 'string' ? summarized : JSON.stringify(summarized, null, 2));
        } catch {
            console.log(data);
        }
    }

    private async getTools() {
        const tools = await muxMcpClient.getTools();
        const names = Object.keys(tools);
        // Summarized debug output
        this.log('Available tools', {
            count: names.length,
            sample: names.slice(0, 15),
            truncated: names.length > 15 ? names.length - 15 : 0
        });
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

    private formatAssetsList(raw: any, header: string, limit?: number): AgentResult {
        // Unwrap common MCP content envelopes and parse embedded JSON if needed
        const unwrap = (val: any): any => {
            try {
                if (val && typeof val === 'object' && Array.isArray(val.content)) {
                    for (const part of val.content) {
                        if (part && typeof part === 'object') {
                            if (part.type === 'json' && part.json) return part.json;
                            if (typeof part.text === 'string') {
                                const t = part.text.trim();
                                if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
                                    try { return JSON.parse(t); } catch {}
                                }
                            }
                        }
                    }
                }
            } catch {}
            return val;
        };
        const dataOrEnvelope = unwrap(raw);

        let text = `${header}\n`;
        const source = dataOrEnvelope;
        if (Array.isArray(source?.data)) {
            const items = source.data as any[];
            const total = items.length;
            const show = typeof limit === 'number' && limit > 0 ? Math.min(limit, total) : Math.min(20, total);
            text += `Found ${total} item${total === 1 ? '' : 's'} (showing ${show})\n`;
            // Column headers
            const col = (s: string, n: number) => (s ?? '').toString().padEnd(n);
            text += `${col('ID', 18)} ${col('STATUS', 10)} ${col('CREATED', 20)} ${col('PLAYBACK', 16)}\n`;
            text += `${'-'.repeat(18)} ${'-'.repeat(10)} ${'-'.repeat(20)} ${'-'.repeat(16)}\n`;
            items.slice(0, show).forEach((it: any, idx: number) => {
                const id = (it.id || it.asset_id || it.uid || it.playback_id || `#${idx+1}`).toString();
                const status = (it.status || it.state || it.passthrough || 'unknown').toString();
                const createdRaw = it.created_at || it.created || it.createdAt || it.timestamp || '';
                const created = typeof createdRaw === 'number' ? new Date(createdRaw * 1000).toISOString() : createdRaw?.toString() || '';
                // Playback info: array or single
                let playback: string = '';
                try {
                    if (Array.isArray(it.playback_ids) && it.playback_ids.length) {
                        const first = it.playback_ids[0];
                        playback = (first.id || first.policy || JSON.stringify(first)).toString();
                    } else if (it.playback_id) {
                        playback = it.playback_id.toString();
                    } else if (it.playbackIds && Array.isArray(it.playbackIds) && it.playbackIds.length) {
                        playback = (it.playbackIds[0].id || JSON.stringify(it.playbackIds[0])).toString();
                    }
                } catch {}
                text += `${col(id, 18)} ${col(status, 10)} ${col(created, 20)} ${col(playback, 16)}\n`;
            });
            if (total > show) text += `...and ${total - show} more\n`;
        } else {
            // If we still have an envelope with content.text, print that text prettily if possible
            if (source && typeof source === 'object' && Array.isArray(source.content) && source.content[0]?.text) {
                const t = String(source.content[0].text);
                try {
                    const parsed = JSON.parse(t);
                    text += this.stringify(parsed);
                } catch {
                    text += t; // fallback to raw text
                }
            } else {
                text += this.stringify(source);
            }
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
            return this.formatAssetsList(raw, `All assets${options.limit ? ` (limit ${options.limit})` : ''}` , options.limit);
        } catch (e: any) {
            return { text: `Failed to list assets: ${e?.message || e}` };
        }
    }

    async getRecentAssets(hours: number = 24, options: ListOptions = {}): Promise<AgentResult> {
        try {
            const raw = await this.callToolPrefer([/list.*asset/i, /list/i]);
            return this.formatAssetsList(raw, `Assets from last ${hours} hours`, options.limit);
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
            let analytics: AgentResult | null = null;
            try { analytics = await this.getAnalyticsSummary(); } catch {}

            const text = [
                '📊 Mux Asset Report',
                '===================',
                '',
                analytics?.text ? analytics.text : '',
                analytics?.text ? '' : '',
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

    async getAnalyticsSummary(): Promise<AgentResult> {
        try {
            // Try to find an analytics tool exposed by @mux/mcp
            const raw = await this.callToolPrefer([
                /analytics/i,
                /metric/i,
                /metrics/i,
                /insight/i,
                /views?/i
            ]);

            // Try to produce a concise summary
            let text = '📈 Analytics Summary\n';
            const d = raw?.data ?? raw;
            if (d && typeof d === 'object') {
                // Common fields we might find
                const totals = (d.totals || d.total || d.summary || {}) as any;
                const totalViews = totals.views || totals.play_count || d.views || d.play_count;
                const watchTime = totals.watch_time || totals.total_watch_time || d.watch_time;
                const uniqueViewers = totals.unique_viewers || d.unique_viewers;
                const period = d.period || d.range || '';
                if (period) text += `Range: ${typeof period === 'string' ? period : this.stringify(period)}\n`;
                if (totalViews != null) text += `Total views: ${totalViews}\n`;
                if (watchTime != null) text += `Watch time: ${watchTime}\n`;
                if (uniqueViewers != null) text += `Unique viewers: ${uniqueViewers}\n`;

                // Top assets if present
                const top = d.top_assets || d.assets || d.top || [];
                if (Array.isArray(top) && top.length) {
                    text += `Top assets (up to 5):\n`;
                    top.slice(0, 5).forEach((it: any, i: number) => {
                        const id = it.asset_id || it.id || it.playback_id || `#${i+1}`;
                        const v = it.views || it.play_count || it.count || 0;
                        text += `  - ${id}: ${v} views\n`;
                    });
                    if (top.length > 5) text += `  ...and ${top.length - 5} more\n`;
                }
            } else {
                text += this.stringify(raw);
            }
            return { text };
        } catch (e: any) {
            return { text: `Failed to get analytics: ${e?.message || e}` };
        }
    }

    // Format a table for video views analytics
    private formatVideoViewsList(raw: any, header: string, limit?: number): AgentResult {
        // Reuse unwrap logic similar to formatAssetsList
        const unwrap = (val: any): any => {
            try {
                if (val && typeof val === 'object' && Array.isArray(val.content)) {
                    for (const part of val.content) {
                        if (part && typeof part === 'object') {
                            if (part.type === 'json' && part.json) return part.json;
                            if (typeof part.text === 'string') {
                                const t = part.text.trim();
                                if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
                                    try { return JSON.parse(t); } catch {}
                                }
                            }
                        }
                    }
                }
            } catch {}
            return val;
        };
        const src = unwrap(raw);

        const col = (s: any, n: number) => (s ?? '').toString().padEnd(n);
        let text = `${header}\n`;

        const data = Array.isArray(src?.data) ? src.data : Array.isArray(src) ? src : null;
        if (Array.isArray(data)) {
            const total = data.length;
            const show = typeof limit === 'number' && limit > 0 ? Math.min(limit, total) : Math.min(20, total);
            text += `Found ${total} row${total === 1 ? '' : 's'} (showing ${show})\n`;
            text += `${col('DATE', 20)} ${col('ASSET/PLAYBACK', 20)} ${col('VIEWS', 8)} ${col('WATCH_TIME', 12)}\n`;
            text += `${'-'.repeat(20)} ${'-'.repeat(20)} ${'-'.repeat(8)} ${'-'.repeat(12)}\n`;
            data.slice(0, show).forEach((it: any, i: number) => {
                const dateRaw = it.date || it.day || it.timestamp || it.time || '';
                const date = typeof dateRaw === 'number' ? new Date(dateRaw * 1000).toISOString() : (dateRaw || '');
                const id = it.asset_id || it.video_id || it.playback_id || it.id || `#${i+1}`;
                const views = it.views ?? it.view_count ?? it.play_count ?? it.count ?? '';
                const watchRaw = it.watch_time ?? it.total_watch_time ?? it.watch_time_seconds ?? it.seconds_watched;
                const watch = watchRaw != null ? watchRaw : '';
                text += `${col(date, 20)} ${col(id, 20)} ${col(views, 8)} ${col(watch, 12)}\n`;
            });
            if (total > show) text += `...and ${total - show} more\n`;
            if (total === 0 && src) {
                // Provide raw details to help diagnose empty results
                try { text += `\nRaw response: \n` + this.stringify(src); } catch {}
            }
        } else if (src && typeof src === 'object') {
            text += this.stringify(src);
        } else {
            text += String(src ?? 'No data');
        }
        return { text };
    }

    // Call the MCP tool for listing video views data
    async listVideoViews(options: { timeframe?: string | string[]; start?: string; end?: string; limit?: number } = {}): Promise<AgentResult> {
        try {
            // Build args with only defined values
            const args: Record<string, any> = {};
            if (options.timeframe) {
                args.timeframe = Array.isArray(options.timeframe) ? options.timeframe : [options.timeframe];
            }
            if (options.start) args.start = options.start;             // e.g., '2025-01-01'
            if (options.end) args.end = options.end;                   // e.g., '2025-01-31'
            if (options.limit != null) args.limit = options.limit;

            const raw = await this.callToolPrefer([
                /list.*data.*video.*views/i,
                /list.*video.*views/i,
                /list.*views/i,
                /views?.*video/i,
                /views?/i
            ], args);

            return this.formatVideoViewsList(raw, `Video Views${options.timeframe ? ` (${options.timeframe})` : options.start || options.end ? ` (${options.start || ''} to ${options.end || ''})` : ''}`, options.limit);
        } catch (e: any) {
            return { text: `Failed to list video views: ${e?.message || e}` };
        }
    }

    // Format a table for error analytics
    private formatErrorsList(raw: any, header: string, limit?: number): AgentResult {
        const unwrap = (val: any): any => {
            try {
                if (val && typeof val === 'object' && Array.isArray(val.content)) {
                    for (const part of val.content) {
                        if (part && typeof part === 'object') {
                            if (part.type === 'json' && part.json) return part.json;
                            if (typeof part.text === 'string') {
                                const t = part.text.trim();
                                if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
                                    try { return JSON.parse(t); } catch {}
                                }
                            }
                        }
                    }
                }
            } catch {}
            return val;
        };
        const src = unwrap(raw);

        const col = (s: any, n: number) => (s ?? '').toString().padEnd(n);
        let text = `${header}` + "\n";

        const data = Array.isArray(src?.data) ? src.data : Array.isArray(src) ? src : null;
        if (Array.isArray(data)) {
            const total = data.length;
            const show = typeof limit === 'number' && limit > 0 ? Math.min(limit, total) : Math.min(20, total);
            text += `Found ${total} row${total === 1 ? '' : 's'} (showing ${show})` + "\n";
            text += `${col('DATE', 20)} ${col('ERROR', 22)} ${col('COUNT', 8)} ${col('CONTEXT', 24)}` + "\n";
            text += `${'-'.repeat(20)} ${'-'.repeat(22)} ${'-'.repeat(8)} ${'-'.repeat(24)}` + "\n";
            data.slice(0, show).forEach((it: any, i: number) => {
                const dateRaw = it.date || it.day || it.timestamp || it.time || it.created_at || '';
                const date = typeof dateRaw === 'number' ? new Date(dateRaw * 1000).toISOString() : (dateRaw || '');
                const error = it.error || it.error_type || it.error_code || it.type || it.code || it.name || 'unknown';
                const count = it.count ?? it.total ?? it.occurrences ?? it.views ?? it.view_count ?? '';
                const ctx = it.asset_id || it.video_id || it.playback_id || it.request_id || it.id || '';
                const context = ctx ? `${ctx}` : (it.message || it.reason || '');
                text += `${col(date, 20)} ${col(error, 22)} ${col(count, 8)} ${col(context, 24)}` + "\n";
            });
            if (total > show) text += `...and ${total - show} more` + "\n";
            if (total === 0 && src) {
                try { text += `\nRaw response: \n` + this.stringify(src); } catch {}
            }
        } else if (src && typeof src === 'object') {
            text += this.stringify(src);
        } else {
            text += String(src ?? 'No data');
        }
        return { text };
    }

    // Call the MCP tool for listing error analytics data
    async listErrors(options: { timeframe?: string | string[]; start?: string; end?: string; limit?: number } = {}): Promise<AgentResult> {
        try {
            const args: Record<string, any> = {};
            if (options.timeframe) {
                args.timeframe = Array.isArray(options.timeframe) ? options.timeframe : [options.timeframe];
            }
            if (options.start) args.start = options.start;
            if (options.end) args.end = options.end;
            if (options.limit != null) args.limit = options.limit;

            const raw = await this.callToolPrefer([
                /list.*data.*errors?/i,
                /list.*errors?/i,
                /errors?/i
            ], args);

            const tfLabel = Array.isArray(options.timeframe) ? options.timeframe.join(',') : options.timeframe;
            const rangeLabel = tfLabel ? ` (${tfLabel})` : (options.start || options.end ? ` (${options.start || ''} to ${options.end || ''})` : '');
            return this.formatErrorsList(raw, `Error Analytics${rangeLabel}`, options.limit);
        } catch (e: any) {
            return { text: `Failed to list errors: ${e?.message || e}` };
        }
    }

    // Verify MCP connectivity and attempt to detect the target Mux environment
    async verifyConnectionAndEnv(): Promise<AgentResult> {
        const lines: string[] = [];
        const mask = (s?: string) => s ? (s.length <= 8 ? '***' : `${s.slice(0,4)}…${s.slice(-4)}`) : 'not set';
        try {
            lines.push('🔎 Verifying Mux MCP connection and environment');

            // 1) Check env vars present
            const tokenId = process.env.MUX_TOKEN_ID;
            const tokenSecret = process.env.MUX_TOKEN_SECRET;
            const muxEnv = process.env.MUX_ENVIRONMENT;
            const muxBase = process.env.MUX_BASE_URL;
            lines.push(`- MUX_TOKEN_ID: ${mask(tokenId)}`);
            lines.push(`- MUX_TOKEN_SECRET: ${mask(tokenSecret)}`);
            if (muxEnv) lines.push(`- MUX_ENVIRONMENT: ${muxEnv}`);
            if (muxBase) lines.push(`- MUX_BASE_URL: ${muxBase}`);
            if (!tokenId || !tokenSecret) {
                lines.push('❌ Missing MUX tokens. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env');
                return { text: lines.join('\n') };
            }

            // 2) List tools
            const tools = await this.getTools();
            const names = Object.keys(tools);
            lines.push(`- MCP tools available: ${names.length}`);
            lines.push(`  sample: ${names.slice(0,10).join(', ')}`);

            // Helper to try calling a tool if available
            const tryCall = async (patterns: RegExp[], args: any = {}) => {
                try {
                    const key = Object.keys(tools).find(k => patterns.some(p => p.test(k)));
                    if (!key) return { ok: false, name: undefined, error: 'no matching tool' } as const;
                    const tool = tools[key];
                    const res = typeof tool.call === 'function' ? await tool.call(args)
                        : typeof tool.execute === 'function' ? await tool.execute(args)
                        : typeof tool.run === 'function' ? await tool.run(args)
                        : undefined;
                    return { ok: true, name: key, res } as const;
                } catch (err: any) {
                    return { ok: false, name: undefined, error: err?.message || String(err) } as const;
                }
            };

            // 3) Try to detect account/environment info
            const accountTry = await tryCall([/account/i, /environment/i, /project/i, /organization/i]);
            if (accountTry.ok) {
                lines.push(`- Account/Env tool responded: ${accountTry.name}`);
                try {
                    const obj = accountTry.res?.content ? accountTry.res : accountTry.res?.data ? accountTry.res : accountTry.res;
                    lines.push(`  account/env payload present`);
                } catch {}
            } else {
                lines.push(`- No explicit account/env tool found (${accountTry.error}).`);
            }

            // 4) Ping safe read endpoints
            const assetsTry = await tryCall([/list.*asset/i, /assets?/i], { limit: 1 });
            lines.push(assetsTry.ok ? `- Assets endpoint reachable${assetsTry.name ? ` (${assetsTry.name})` : ''}` : `- Assets endpoint failed: ${assetsTry.error}`);

            const viewsTry = await tryCall([/list.*data.*video.*views/i, /list.*video.*views/i, /list.*views/i, /views?.*video/i, /views?/i], { timeframe: ['7d'], limit: 1 });
            if (viewsTry.ok) {
                lines.push(`- Views tool reachable${viewsTry.name ? ` (${viewsTry.name})` : ''}`);
            } else {
                lines.push(`- Views tool failed or not found: ${viewsTry.error}`);
            }

            const errorsTry = await tryCall([/list.*data.*errors?/i, /list.*errors?/i, /errors?/i], { timeframe: ['7d'], limit: 1 });
            if (errorsTry.ok) {
                lines.push(`- Errors tool reachable${errorsTry.name ? ` (${errorsTry.name})` : ''}`);
            } else {
                lines.push(`- Errors tool failed or not found: ${errorsTry.error}`);
            }

            // 5) High-level note about environment
            if (muxEnv) {
                lines.push(`ℹ️ Using explicit MUX_ENVIRONMENT=${muxEnv}. If you expect Production, ensure this matches your Production environment name.`);
            } else {
                lines.push(`ℹ️ No MUX_ENVIRONMENT provided. Mux tokens are scoped to their environment; ensure you created tokens in your Production environment.`);
            }
            if (muxBase) {
                lines.push(`ℹ️ Custom MUX_BASE_URL is set; ensure it points to the correct API host.`);
            }

            return { text: lines.join('\n') };
        } catch (e: any) {
            return { text: `Verification failed: ${e?.message || e}` };
        }
    }
}

// Add this to your MuxAssetManager class or createMuxAssetManagerAgent function

export async function createMuxAssetManagerAgent() {
    // Create a proper Mastra Agent instance
    const agent = new Agent({
        name: 'muxAssetManager',
        instructions: `You are the Mux Asset Manager, an AI assistant specialized in video asset management using Mux APIs.
        
Your capabilities include:
- Managing video assets and their lifecycle
- Analyzing video performance and engagement metrics  
- Generating comprehensive reports and insights
- Troubleshooting asset processing issues
- Optimizing video delivery and playback

Use the available Mux tools to help users manage their video assets effectively.`,

        model: createOllamaModel({
            model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
            baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            temperature: 0.7,
            maxTokens: 2048
        }),

        // Provide the MCP tools to the agent
        tools: async () => {
            try {
                const muxTools = await muxMcpClient.getTools();
                return muxTools;
            } catch (error) {
                console.warn('Failed to get MCP tools for agent:', error);
                return {};
            }
        }
    });

    return agent;
}
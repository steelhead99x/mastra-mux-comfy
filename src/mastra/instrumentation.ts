// Mastra Telemetry Instrumentation
// This file is loaded before creating the Mastra instance so telemetry hooks are available.
// To silence the warning when running outside the Mastra server environment, set the flag below.
// See: https://mastra.ai/en/docs/observability/tracing#tracing-outside-mastra-server-environment

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any;
if (!g.___MASTRA_TELEMETRY___) {
  g.___MASTRA_TELEMETRY___ = true;
}

// If you later add OpenTelemetry exporters, initialize them here.
// Example (pseudo-code):
// import { startTracing } from '@mastra/core/tracing'
// startTracing({ serviceName: 'mastra-mux-comfy' })

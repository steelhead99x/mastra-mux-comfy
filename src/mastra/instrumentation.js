// Mastra instrumentation file
// Set the Mastra telemetry flag so the runtime knows instrumentation is present.
// See: https://mastra.ai/en/docs/observability/tracing#tracing-outside-mastra-server-environment

globalThis.___MASTRA_TELEMETRY___ = true;

console.log("📊 Instrumentation module loaded");

export default {};
import { muxMcpClient } from "../mastra/mcp/mux-client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    duration?: number;
}

class MuxMCPTester {
    private results: TestResult[] = [];

    private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
        const startTime = Date.now();
        try {
            await testFn();
            const duration = Date.now() - startTime;
            this.results.push({
                name,
                passed: true,
                message: "✅ Passed",
                duration
            });
            console.log(`✅ ${name} - Passed (${duration}ms)`);
        } catch (error) {
            const duration = Date.now() - startTime;
            const message = error instanceof Error ? error.message : String(error);
            this.results.push({
                name,
                passed: false,
                message: `❌ Failed: ${message}`,
                duration
            });
            console.log(`❌ ${name} - Failed: ${message} (${duration}ms)`);
        }
    }

    async testEnvironmentVariables(): Promise<void> {
        const requiredEnvVars = [
            'MUX_TOKEN_ID',
            'MUX_TOKEN_SECRET',
            'MUX_WEBHOOK_SECRET',
            'MUX_SIGNING_KEY',
            'MUX_PRIVATE_KEY',
            'MUX_AUTHORIZATION_TOKEN'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
        }

        console.log("📋 All required environment variables are present");
    }

    async testClientInitialization(): Promise<void> {
        if (!muxMcpClient) {
            throw new Error("MCP client is not initialized");
        }

        if (!muxMcpClient.id || muxMcpClient.id !== "mux-mcp-client") {
            throw new Error("MCP client ID is not set correctly");
        }

        console.log("🔧 MCP client initialized successfully");
    }

    async testGetTools(): Promise<void> {
        const tools = await muxMcpClient.getTools();

        if (!tools || typeof tools !== 'object') {
            throw new Error("Failed to get tools from MCP client");
        }

        const toolNames = Object.keys(tools);

        if (toolNames.length === 0) {
            throw new Error("No tools available from MCP client");
        }

        console.log(`🛠️  Retrieved ${toolNames.length} tools: ${toolNames.slice(0, 5).join(', ')}${toolNames.length > 5 ? '...' : ''}`);
    }

    async testSpecificTools(): Promise<void> {
        const tools = await muxMcpClient.getTools();
        const expectedTools = [
            'list_video_assets',
            'create_video_assets',
            'retrieve_video_assets'
        ];

        const missingTools = expectedTools.filter(toolName => !tools[toolName]);

        if (missingTools.length > 0) {
            throw new Error(`Expected tools not found: ${missingTools.join(', ')}`);
        }

        console.log("🎯 All expected video asset tools are available");
    }

    async testToolExecution(): Promise<void> {
        const tools = await muxMcpClient.getTools();

        if (!tools.list_video_assets) {
            throw new Error("list_video_assets tool not available");
        }

        try {
            // Test calling the list assets tool with minimal parameters
            const result = await tools.list_video_assets.call({
                limit: 1 // Request only 1 asset to minimize load
            });

            if (!result) {
                throw new Error("Tool execution returned no result");
            }

            console.log("🚀 Tool execution test passed - API call successful");

            // Log some basic info about the result without exposing sensitive data
            if (result.data && Array.isArray(result.data)) {
                console.log(`📊 Retrieved ${result.data.length} asset(s) from API`);
            }

        } catch (error) {
            // Check if it's an authentication error vs other errors
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
                throw new Error("Authentication failed - check your Mux API credentials");
            } else if (errorMessage.includes('403')) {
                throw new Error("Access forbidden - check your API token permissions");
            } else if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
                throw new Error("Network connectivity issue - check your internet connection");
            } else {
                throw new Error(`API call failed: ${errorMessage}`);
            }
        }
    }

    async testServerConnection(): Promise<void> {
        try {
            // Test if we can initialize connection to the MCP server
            const tools = await Promise.race([
                muxMcpClient.getTools(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), 15000)
                )
            ]);

            if (!tools) {
                throw new Error("Failed to establish server connection");
            }

            console.log("🌐 MCP server connection established successfully");

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('timeout')) {
                throw new Error("Server connection timeout - MCP server may be unavailable");
            } else if (errorMessage.includes('spawn')) {
                throw new Error("Failed to spawn MCP server process - check npx and @mux/mcp installation");
            } else {
                throw new Error(`Server connection failed: ${errorMessage}`);
            }
        }
    }

    async testMCPProtocol(): Promise<void> {
        try {
            // Test basic MCP protocol functionality
            const tools = await muxMcpClient.getTools();

            // Check if tools have the expected MCP structure
            const toolEntries = Object.entries(tools);

            for (const [toolName, tool] of toolEntries.slice(0, 3)) { // Test first 3 tools
                if (!tool || typeof tool !== 'object') {
                    throw new Error(`Tool ${toolName} has invalid structure`);
                }

                if (typeof tool.call !== 'function') {
                    throw new Error(`Tool ${toolName} missing call method`);
                }
            }

            console.log("🔌 MCP protocol implementation is working correctly");

        } catch (error) {
            throw new Error(`MCP protocol test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    printSummary(): void {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;

        console.log("\n" + "=".repeat(60));
        console.log("🧪 MUX MCP CLIENT TEST SUMMARY");
        console.log("=".repeat(60));
        console.log(`📊 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

        if (failedTests > 0) {
            console.log("\n🔍 Failed Tests:");
            this.results
                .filter(r => !r.passed)
                .forEach(result => {
                    console.log(`   • ${result.name}: ${result.message}`);
                });
        }

        console.log("\n⏱️  Test Durations:");
        this.results.forEach(result => {
            const status = result.passed ? "✅" : "❌";
            console.log(`   ${status} ${result.name}: ${result.duration}ms`);
        });

        console.log("=".repeat(60));
    }

    async runAllTests(): Promise<boolean> {
        console.log("🚀 Starting Mux MCP Client Tests...\n");

        await this.runTest("Environment Variables Check", () => this.testEnvironmentVariables());
        await this.runTest("Client Initialization", () => this.testClientInitialization());
        await this.runTest("Server Connection", () => this.testServerConnection());
        await this.runTest("Get Tools", () => this.testGetTools());
        await this.runTest("Specific Tools Availability", () => this.testSpecificTools());
        await this.runTest("MCP Protocol", () => this.testMCPProtocol());
        await this.runTest("Tool Execution", () => this.testToolExecution());

        this.printSummary();

        const allPassed = this.results.every(r => r.passed);
        return allPassed;
    }
}

// Additional utility functions for debugging
export async function debugMuxMCP(): Promise<void> {
    console.log("🔍 DEBUG: Mux MCP Client Configuration");
    console.log("=====================================");

    try {
        console.log("Client ID:", muxMcpClient.id);
        console.log("Environment Variables Present:");

        const envVars = [
            'MUX_TOKEN_ID',
            'MUX_TOKEN_SECRET',
            'MUX_WEBHOOK_SECRET',
            'MUX_SIGNING_KEY',
            'MUX_PRIVATE_KEY',
            'MUX_AUTHORIZATION_TOKEN'
        ];

        envVars.forEach(varName => {
            const value = process.env[varName];
            console.log(`  ${varName}: ${value ? `${value.substring(0, 8)}***` : 'NOT SET'}`);
        });

        console.log("\nAttempting to get tools...");
        const tools = await muxMcpClient.getTools();
        console.log(`Tools retrieved: ${Object.keys(tools).length}`);
        console.log("Available tools:", Object.keys(tools).slice(0, 10).join(', '));

    } catch (error) {
        console.error("Debug failed:", error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new MuxMCPTester();

    tester.runAllTests()
        .then((success) => {
            if (success) {
                console.log("\n🎉 All tests passed! Your Mux MCP client is working correctly.");
                process.exit(0);
            } else {
                console.log("\n⚠️  Some tests failed. Please check the configuration and try again.");
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error("\n💥 Test runner crashed:", error);
            process.exit(1);
        });
}

export { MuxMCPTester };
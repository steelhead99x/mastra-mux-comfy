import dotenv from "dotenv";
import readline from "readline";
import BasicAgent from "../agents/basic-agent";
import { pathToFileURL } from "node:url";

dotenv.config();

async function basicInteractive() {
    console.log("🤖 Basic Interactive Agent");
    console.log("==========================");

    const agent = new BasicAgent();
    const tools = await agent.listTools();

    console.log(`✅ Agent ready with ${tools.length} tools`);
    console.log("Ask questions like:");
    console.log("- 'List video assets'");
    console.log("- 'Show me 3 assets'");
    console.log("- 'What tools do you have?'");
    console.log("- 'exit' to quit\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (question: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(question, resolve);
        });
    };

    while (true) {
        try {
            const input = await askQuestion("🤖 Ask me anything: ");

            if (input.trim().toLowerCase() === 'exit') {
                console.log("👋 Goodbye!");
                rl.close();
                break;
            }

            if (input.trim() === '') {
                continue;
            }

            console.log("\n🤔 Thinking...");
            const response = await agent.ask(input);

            console.log("🤖 Response:");
            console.log(response.text);
            console.log("\n" + "─".repeat(50));

        } catch (error: any) {
            console.error("❌ Error:", error?.message || error);
            console.log("Try asking something else...\n");
        }
    }
}

// Run if called directly
const isDirectRun = (() => {
    const entry = process.argv?.[1] ? pathToFileURL(process.argv[1]).href : '';
    return import.meta?.url === entry;
})();

if (isDirectRun) {
    basicInteractive().catch(console.error);
}

export { basicInteractive };
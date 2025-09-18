import dotenv from "dotenv";

dotenv.config();

console.log("🔧 Environment Variables Check");
console.log("==============================");

const requiredVars = [
    'MUX_TOKEN_ID',
    'MUX_TOKEN_SECRET'
];

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 12)}***`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
    }
});

console.log("\nFull environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV || 'not set');
console.log("PWD:", process.cwd());

// Check if .env file exists
import { existsSync } from 'fs';
const envExists = existsSync('.env');
console.log(".env file exists:", envExists);
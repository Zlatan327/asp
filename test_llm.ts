import 'dotenv/config';
import { ask } from './src/lib/ai/llm.js';

async function main() {
  console.log("Testing Mimo Model...");
  try {
    const result = await ask("You are a helpful AI assistant.", "Say 'Hello, World! I am working.'");
    console.log("Model Response: ", result);
  } catch (error) {
    console.error("Model Error: ", error);
  }
}

main();

import { config } from "dotenv";
import { streamText } from "ai";

async function main() {
  config({ path: ".env.local" });
  await import("./src/env");

  const result = streamText({
    model: "openai/gpt-5.4",
    prompt: "Say hello in one short sentence.",
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  process.stdout.write("\n");

  const usage = await result.usage;
  console.log("Token usage:", usage);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

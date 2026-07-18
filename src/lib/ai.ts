import { createGateway } from "ai";
import { env } from "~/env";

export const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

export const chatModel = gateway("openai/gpt-4o-mini");

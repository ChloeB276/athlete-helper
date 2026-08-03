import { createGateway } from "ai";
import { env } from "~/env";

export const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });

export const chatModel = gateway("openai/gpt-4o");

/**
 * Cheaper/faster model for classification-style steps (intent routing,
 * ranking search results) where the extra quality of `chatModel` isn't
 * needed but latency directly adds to the user's wait time.
 */
export const fastModel = gateway("openai/gpt-4o-mini");

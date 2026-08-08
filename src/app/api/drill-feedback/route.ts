import type { ChatStreamEvent, ConversationTurn } from "~/lib/drill-generation";
import { streamChatResponse } from "~/lib/drill-generation";
import { getPlanContext } from "~/lib/plan";
import { drillQuotaKey, drillQuotaWindow } from "~/lib/quota";
import { checkRateLimit, getClientIp, peekRateLimit } from "~/lib/rate-limit";
import { createClient } from "~/lib/supabase/server";

export const maxDuration = 60;

const ANONYMOUS_RATE_LIMIT = { windowSeconds: 60 * 60, maxRequests: 3 };
const MAX_HISTORY_TURNS = 8;

interface TrainingContext {
  partners: number;
  equipment: string[];
}

function sanitizeHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (turn): turn is ConversationTurn =>
        typeof turn === "object" &&
        turn !== null &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string",
    )
    .slice(-MAX_HISTORY_TURNS);
}

function sanitizePositions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is string => typeof p === "string");
}

export async function POST(request: Request) {
  let feedback: string;
  let positions: string[];
  let trainingContext: TrainingContext | null | undefined;
  let history: unknown;
  let quotaKey: string | null = null;
  let quotaWindow: { windowSeconds: number; maxRequests: number } | null = null;

  try {
    const body = (await request.json()) as {
      feedback?: string;
      positions?: unknown;
      trainingContext?: TrainingContext | null;
      history?: unknown;
    };
    positions = sanitizePositions(body.positions);
    trainingContext = body.trainingContext;
    history = body.history;

    if (!body.feedback?.trim()) {
      return Response.json({ error: "feedback is required" }, { status: 400 });
    }
    feedback = body.feedback;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const allowed = await checkRateLimit(
        `drill-feedback:${getClientIp(request)}`,
        ANONYMOUS_RATE_LIMIT,
      );
      if (!allowed) {
        return Response.json(
          {
            error:
              "You've hit the demo's hourly limit. Sign up for unlimited access.",
          },
          { status: 429 },
        );
      }
    } else {
      const plan = await getPlanContext(supabase, user.id);
      const isCoach = plan.role === "coach";
      quotaKey = drillQuotaKey(plan, user.id);
      quotaWindow = drillQuotaWindow(plan);

      const allowed = await checkRateLimit(quotaKey, quotaWindow);
      if (!allowed) {
        return Response.json(
          {
            error: isCoach
              ? "You've hit your weekly drill-recommendation limit. Upgrade to Athlete Helper Pro for 10/week."
              : "You've hit your monthly drill-generation limit. Upgrade to Athlete Helper Pro for 30/month.",
          },
          { status: 429 },
        );
      }
    }
  } catch (error) {
    console.error("drill-feedback pre-stream setup failed", error);
    return Response.json(
      { error: "Failed to generate drills" },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(
        event:
          | ChatStreamEvent
          | { type: "quota"; quota: { remaining: number; max: number } },
      ) {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      }

      try {
        await streamChatResponse(
          feedback,
          positions,
          trainingContext ?? null,
          sanitizeHistory(history),
          send,
        );

        if (quotaKey && quotaWindow) {
          const { remaining } = await peekRateLimit(quotaKey, quotaWindow);
          send({
            type: "quota",
            quota: { remaining, max: quotaWindow.maxRequests },
          });
        }
      } catch (error) {
        console.error(error);
        send({ type: "error", message: "Failed to generate drills" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}

import type { ChatStreamEvent, ConversationTurn } from "~/lib/drill-generation";
import { streamChatResponse } from "~/lib/drill-generation";
import { getPlanContext } from "~/lib/plan";
import { drillQuotaKey, drillQuotaWindow } from "~/lib/quota";
import { checkRateLimit, getClientIp, peekRateLimit } from "~/lib/rate-limit";
import { createClient } from "~/lib/supabase/server";

export const maxDuration = 60;

const ANONYMOUS_RATE_LIMIT = { windowSeconds: 60 * 60, maxRequests: 3 };
const MAX_HISTORY_TURNS = 8;

/**
 * How many drill regenerations ("give me harder ones", "these don't work,
 * find better") are free after the first drill in a chat, before quota
 * charges resume. Keeps refinement cheap without making an entire chat's
 * regenerations unlimited on one quota charge.
 */
const FREE_FOLLOWUP_DRILLS_PER_CHAT = 2;

interface TrainingContext {
  partners: number;
  equipment: string[];
}

/**
 * Counts how many times this chat has already produced real drills, by
 * looking at persisted data rather than trusting the client — a message
 * only has `drills` rows if a generation actually completed. RLS scopes
 * this to the caller's own chat, so an unrecognized `chatId` just reads
 * back zero rather than leaking another user's data.
 */
async function countPriorDrillGenerations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chatId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, drills(id)")
    .eq("chat_id", chatId)
    .eq("role", "assistant");
  if (error) {
    console.error(error);
    return 0;
  }
  return (data ?? []).filter(
    (message) => ((message as { drills?: unknown[] }).drills?.length ?? 0) > 0,
  ).length;
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

export async function POST(request: Request) {
  let feedback: string;
  let position: string | null | undefined;
  let trainingContext: TrainingContext | null | undefined;
  let history: unknown;
  let quotaKey: string | null = null;
  let quotaWindow: { windowSeconds: number; maxRequests: number } | null = null;
  let isCoach = false;
  let isFreeRegeneration = false;

  try {
    const body = (await request.json()) as {
      feedback?: string;
      position?: string | null;
      trainingContext?: TrainingContext | null;
      history?: unknown;
      chatId?: string;
    };
    position = body.position;
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
      isCoach = plan.role === "coach";
      quotaKey = drillQuotaKey(plan, user.id);
      quotaWindow = drillQuotaWindow(plan);

      if (body.chatId) {
        const priorDrillGenerations = await countPriorDrillGenerations(
          supabase,
          body.chatId,
        );
        isFreeRegeneration =
          priorDrillGenerations > 0 &&
          priorDrillGenerations <= FREE_FOLLOWUP_DRILLS_PER_CHAT;
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
        const key = quotaKey;
        const window = quotaWindow;
        await streamChatResponse(
          feedback,
          position ?? null,
          trainingContext ?? null,
          sanitizeHistory(history),
          send,
          key && window
            ? async () => {
                if (isFreeRegeneration) return null;
                const allowed = await checkRateLimit(key, window);
                if (allowed) return null;
                return isCoach
                  ? "You've hit your weekly drill-recommendation limit. Upgrade to Athlete Helper Pro for 10/week."
                  : "You've hit your monthly drill-generation limit. Upgrade to Athlete Helper Pro for 30/month.";
              }
            : undefined,
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

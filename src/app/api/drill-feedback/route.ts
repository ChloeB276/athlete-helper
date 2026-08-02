import type { ConversationTurn } from "~/lib/drill-generation";
import { generateDrillBreakdown } from "~/lib/drill-generation";
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

export async function POST(request: Request) {
  const { feedback, position, trainingContext, history } =
    (await request.json()) as {
      feedback?: string;
      position?: string | null;
      trainingContext?: TrainingContext | null;
      history?: unknown;
    };

  if (!feedback?.trim()) {
    return Response.json({ error: "feedback is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let quotaKey: string | null = null;
  let quotaWindow: { windowSeconds: number; maxRequests: number } | null = null;

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

  try {
    const result = await generateDrillBreakdown(
      feedback,
      position ?? null,
      trainingContext ?? null,
      sanitizeHistory(history),
    );

    if (!result) {
      return Response.json(
        { error: "Couldn't find any matching drill videos" },
        { status: 502 },
      );
    }

    if (quotaKey && quotaWindow) {
      const { remaining } = await peekRateLimit(quotaKey, quotaWindow);
      return Response.json({
        ...result,
        quota: { remaining, max: quotaWindow.maxRequests },
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to generate drills" },
      { status: 502 },
    );
  }
}

import { generateDrillBreakdown } from "~/lib/drill-generation";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit";
import { createClient } from "~/lib/supabase/server";

const ANONYMOUS_RATE_LIMIT = { windowSeconds: 60 * 60, maxRequests: 3 };

interface TrainingContext {
  partners: number;
  equipment: string[];
}

export async function POST(request: Request) {
  const { feedback, position, trainingContext } = (await request.json()) as {
    feedback?: string;
    position?: string;
    trainingContext?: TrainingContext;
  };

  if (!feedback?.trim() || !position?.trim() || !trainingContext) {
    return Response.json(
      { error: "feedback, position, and trainingContext are required" },
      { status: 400 },
    );
  }

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
  }

  try {
    const result = await generateDrillBreakdown(
      feedback,
      position,
      trainingContext,
    );

    if (!result) {
      return Response.json(
        { error: "Couldn't find any matching drill videos" },
        { status: 502 },
      );
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

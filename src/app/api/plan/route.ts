import { NextResponse } from "next/server";
import { PlanRequestSchema } from "@/lib/schemas";
import {
  AiConfigError,
  AiGenerationError,
  generateAirQualityPlan,
} from "@/lib/genai";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`plan:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded for plan generation. Please retry shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.resetInMs / 1000)),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid lifestyle profile or AQI payload.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateAirQualityPlan(parsed.data);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[/api/plan] Generation failed:", error);

    if (error instanceof AiConfigError) {
      return NextResponse.json(
        {
          error:
            "AI assistant is not configured yet. Please set GEMINI_API_KEY.",
        },
        { status: 503 },
      );
    }

    if (error instanceof AiGenerationError) {
      return NextResponse.json(
        {
          error:
            "Could not generate a valid action plan right now. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Unexpected server error while generating your plan." },
      { status: 500 },
    );
  }
}

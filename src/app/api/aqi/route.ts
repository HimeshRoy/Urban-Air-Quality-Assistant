import { NextResponse } from "next/server";
import { AqiQuerySchema } from "@/lib/schemas";
import {
  CityNotFoundError,
  UpstreamWeatherError,
  fetchCityAirQuality,
} from "@/lib/aqi";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`aqi:${ip}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.resetInMs / 1000)) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = AqiQuerySchema.safeParse({
    city: searchParams.get("city") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid city parameter.",
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  try {
    const report = await fetchCityAirQuality(parsed.data.city);
    return NextResponse.json(report, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    if (error instanceof CityNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof UpstreamWeatherError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Unable to retrieve air quality data right now." },
      { status: 500 },
    );
  }
}

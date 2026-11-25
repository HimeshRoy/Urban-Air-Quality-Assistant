import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AirQualityPlan, PlanRequest } from "@/lib/schemas";

const mockGenerateAirQualityPlan = vi.fn();

vi.mock("@/lib/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/genai")>();
  return {
    ...actual,
    generateAirQualityPlan: (...args: unknown[]) =>
      mockGenerateAirQualityPlan(...args),
  };
});

import { POST } from "@/app/api/plan/route";
import {
  AiConfigError,
  AiGenerationError,
  buildAirQualityPrompt,
} from "@/lib/genai";

const VALID_PAYLOAD: PlanRequest = {
  profile: {
    city: "New Delhi",
    householdMembers: ["adults", "children"],
    commuteMode: "car",
    homeSetup: {
      hasAirPurifier: false,
      cookingFuel: "lpg_gas",
      ventilation: "cross_ventilation",
    },
    outdoorActivity: "morning_walk",
  },
  aqiContext: {
    usAqi: 215,
    pm25: 145.2,
    pm10: 210.5,
    category: "Very Unhealthy",
    safestWindow: "13:00 – 15:00 (avg PM2.5: 62 µg/m³)",
  },
};

const sampleAction = {
  title: "Shift Errands to Afternoon Window",
  action:
    "Move outdoor walks and errands to the 13:00–15:00 lowest-PM2.5 window.",
  timingOrFrequency: "13:00 – 15:00 daily",
  healthImpact: "Avoids morning temperature inversion when PM2.5 peaks.",
  emissionImpact: "Combining trips cuts cold-start tailpipe emissions.",
  estimatedCo2SavedKgPerWeek: 4.5,
  estimatedPm25ReductionPercent: 35,
};

const VALID_PLAN: AirQualityPlan = {
  riskSummary:
    "Very unhealthy winter smog in New Delhi poses elevated risks for children.",
  lowEmissionRoutine: [sampleAction, sampleAction, sampleAction],
  indoorAirHacks: [sampleAction, sampleAction, sampleAction],
  sustainableAlternatives: [sampleAction, sampleAction, sampleAction],
  communityBrief:
    "New Delhi AQI is 215 today. Let's carpool, skip waste burning, and ventilate only between 1 PM and 3 PM.",
};

let ipCounter = 1;
function makeRequest(
  body: unknown,
  contentType = "application/json",
  ip?: string,
) {
  const clientIp = ip ?? `10.0.0.${ipCounter++}`;
  return new Request("http://localhost:3000/api/plan", {
    method: "POST",
    headers: {
      "content-type": contentType,
      "x-forwarded-for": clientIp,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/plan", () => {
  beforeEach(() => {
    mockGenerateAirQualityPlan.mockReset();
  });

  it("returns 200 with a validated plan on a valid request", async () => {
    mockGenerateAirQualityPlan.mockResolvedValueOnce({
      plan: VALID_PLAN,
      model: "gemini-3.5-flash-lite",
      generatedAt: "2026-11-25T10:00:00.000Z",
    });

    const response = await POST(makeRequest(VALID_PAYLOAD));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const data = await response.json();
    expect(data.plan.lowEmissionRoutine).toHaveLength(3);
  });

  it("returns 415 when Content-Type is not application/json", async () => {
    const response = await POST(makeRequest("plain text", "text/plain"));
    expect(response.status).toBe(415);
  });

  it("returns 400 on malformed JSON or invalid schema", async () => {
    const badJsonRes = await POST(makeRequest("{not-valid-json"));
    expect(badJsonRes.status).toBe(400);

    const badSchemaRes = await POST(makeRequest({ profile: {} }));
    expect(badSchemaRes.status).toBe(400);
  });

  it("maps AiConfigError to 503 and AiGenerationError to 502", async () => {
    mockGenerateAirQualityPlan.mockRejectedValueOnce(
      new AiConfigError("Missing key"),
    );
    const configRes = await POST(makeRequest(VALID_PAYLOAD));
    expect(configRes.status).toBe(503);

    mockGenerateAirQualityPlan.mockRejectedValueOnce(
      new AiGenerationError("Malformed model output"),
    );
    const genRes = await POST(makeRequest(VALID_PAYLOAD));
    expect(genRes.status).toBe(502);
  });

  it("enforces per-IP rate limiting with 429 and Retry-After header", async () => {
    mockGenerateAirQualityPlan.mockResolvedValue({
      plan: VALID_PLAN,
      model: "gemini-3.5-flash-lite",
      generatedAt: "2026-11-25T10:00:00.000Z",
    });

    const fixedIp = "192.168.99.99";
    for (let i = 0; i < 10; i++) {
      const res = await POST(
        makeRequest(VALID_PAYLOAD, "application/json", fixedIp),
      );
      expect(res.status).toBe(200);
    }

    const blocked = await POST(
      makeRequest(VALID_PAYLOAD, "application/json", fixedIp),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});

describe("buildAirQualityPrompt", () => {
  it("strips control characters and angle brackets from location input", () => {
    const prompt = buildAirQualityPrompt({
      ...VALID_PAYLOAD,
      profile: {
        ...VALID_PAYLOAD.profile,
        city: "New Delhi\n<ignore previous>",
      },
    });

    expect(prompt).not.toContain("<ignore");
    expect(prompt).toContain("New Delhi ignore previous");
    expect(prompt).toContain("13:00 – 15:00");
  });
});

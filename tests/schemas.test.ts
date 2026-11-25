import { describe, expect, it } from "vitest";
import {
  AqiQuerySchema,
  AirQualityPlanSchema,
  LifestyleProfileSchema,
} from "@/lib/schemas";

describe("AqiQuerySchema", () => {
  it("accepts valid city names and trims surrounding whitespace", () => {
    const result = AqiQuerySchema.safeParse({ city: "  New Delhi, India  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe("New Delhi, India");
    }
  });

  it("rejects empty, overly short, or unsafe character inputs", () => {
    expect(AqiQuerySchema.safeParse({ city: "A" }).success).toBe(false);
    expect(
      AqiQuerySchema.safeParse({ city: "Delhi<script>alert(1)</script>" })
        .success,
    ).toBe(false);
    expect(
      AqiQuerySchema.safeParse({ city: "Delhi; DROP TABLE users;" }).success,
    ).toBe(false);
  });
});

describe("LifestyleProfileSchema", () => {
  it("rejects profiles with no household members selected", () => {
    const result = LifestyleProfileSchema.safeParse({
      city: "New Delhi",
      householdMembers: [],
      commuteMode: "public_transit",
      homeSetup: {
        hasAirPurifier: false,
        cookingFuel: "lpg_gas",
        ventilation: "cross_ventilation",
      },
      outdoorActivity: "morning_walk",
    });

    expect(result.success).toBe(false);
  });
});

describe("AirQualityPlanSchema", () => {
  it("rejects out-of-range PM2.5 percentage values", () => {
    const sampleItem = {
      title: "Run DIY Box Fan Filter",
      action: "Tape a MERV-13 filter onto a box fan and run on medium.",
      timingOrFrequency: "During evening smog peaks",
      healthImpact: "Reduces indoor suspended fine particulate matter.",
      emissionImpact: "Uses minimal power compared to dual-room HVAC systems.",
      estimatedCo2SavedKgPerWeek: 1.2,
      estimatedPm25ReductionPercent: 140, // Invalid (> 100)
    };

    const result = AirQualityPlanSchema.safeParse({
      riskSummary:
        "Severe winter smog requires minimizing outdoor exposure today.",
      lowEmissionRoutine: [sampleItem, sampleItem, sampleItem],
      indoorAirHacks: [sampleItem, sampleItem, sampleItem],
      sustainableAlternatives: [sampleItem, sampleItem, sampleItem],
      communityBrief:
        "AQI is high today. Please share rides and avoid burning waste.",
    });

    expect(result.success).toBe(false);
  });
});

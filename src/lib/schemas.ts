import { z } from "zod";

export const AqiQuerySchema = z.object({
  city: z
    .string()
    .trim()
    .min(2, "City name must be at least 2 characters.")
    .max(80, "City name is too long.")
    .regex(/^[a-zA-Z0-9\s,.-]+$/, "City name contains invalid characters."),
});

export const LifestyleProfileSchema = z.object({
  city: z.string().trim().min(2).max(80),
  householdMembers: z
    .array(z.enum(["adults", "children", "elderly", "respiratory_sensitive"]))
    .min(1, "Select at least one household group."),
  commuteMode: z.enum([
    "car",
    "two_wheeler",
    "public_transit",
    "walk_cycle",
    "work_from_home",
  ]),
  homeSetup: z.object({
    hasAirPurifier: z.boolean(),
    cookingFuel: z.enum(["lpg_gas", "induction_electric", "mixed"]),
    ventilation: z.enum(["cross_ventilation", "exhaust_only", "sealed_ac"]),
  }),
  outdoorActivity: z.enum([
    "none",
    "morning_walk",
    "evening_exercise",
    "school_drop",
  ]),
});

export const PlanRequestSchema = z.object({
  profile: LifestyleProfileSchema,
  aqiContext: z.object({
    usAqi: z.number().min(0).max(1000),
    pm25: z.number().min(0).max(2000),
    pm10: z.number().min(0).max(2000),
    category: z.string(),
    safestWindow: z.string(),
  }),
});

export const ActionItemSchema = z.object({
  title: z.string().min(3),
  action: z.string().min(10),
  timingOrFrequency: z.string().min(2),
  healthImpact: z.string().min(10),
  emissionImpact: z.string().min(10),
  estimatedCo2SavedKgPerWeek: z.number().min(0).max(500),
  estimatedPm25ReductionPercent: z.number().min(0).max(100),
});

export const AirQualityPlanSchema = z.object({
  riskSummary: z.string().min(20),
  lowEmissionRoutine: z.array(ActionItemSchema).min(3).max(5),
  indoorAirHacks: z.array(ActionItemSchema).min(3).max(5),
  sustainableAlternatives: z.array(ActionItemSchema).min(3).max(5),
  communityBrief: z.string().min(30),
});

export type AqiQuery = z.infer<typeof AqiQuerySchema>;
export type LifestyleProfile = z.infer<typeof LifestyleProfileSchema>;
export type PlanRequest = z.infer<typeof PlanRequestSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type AirQualityPlan = z.infer<typeof AirQualityPlanSchema>;

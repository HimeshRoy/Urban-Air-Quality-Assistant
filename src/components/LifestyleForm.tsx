
"use client";

import { useState, type FormEvent } from "react";
import { Car, Home, Loader2, Sparkles, Users } from "lucide-react";
import type { LifestyleProfile } from "@/lib/schemas";

interface LifestyleFormProps {
  city: string;
  isGenerating: boolean;
  onSubmit: (profile: LifestyleProfile) => void;
}

type HouseholdMember = LifestyleProfile["householdMembers"][number];

const HOUSEHOLD_OPTIONS: Array<{
  value: HouseholdMember;
  label: string;
  hint: string;
}> = [
  { value: "adults", label: "Adults", hint: "Working-age family members" },
  {
    value: "children",
    label: "Children",
    hint: "Higher breathing rate per kg",
  },
  {
    value: "elderly",
    label: "Older Adults (65+)",
    hint: "Cardiopulmonary vulnerability",
  },
  {
    value: "respiratory_sensitive",
    label: "Asthma / Allergies",
    hint: "High sensitivity to PM2.5 & NO₂",
  },
];

export function LifestyleForm({
  city,
  isGenerating,
  onSubmit,
}: LifestyleFormProps) {
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([
    "adults",
  ]);
  const [commuteMode, setCommuteMode] =
    useState<LifestyleProfile["commuteMode"]>("public_transit");
  const [hasAirPurifier, setHasAirPurifier] = useState<boolean>(false);
  const [cookingFuel, setCookingFuel] =
    useState<LifestyleProfile["homeSetup"]["cookingFuel"]>("lpg_gas");
  const [ventilation, setVentilation] =
    useState<LifestyleProfile["homeSetup"]["ventilation"]>(
      "cross_ventilation",
    );
  const [outdoorActivity, setOutdoorActivity] =
    useState<LifestyleProfile["outdoorActivity"]>("morning_walk");
  const [validationError, setValidationError] = useState<string | null>(null);

  function toggleMember(member: HouseholdMember) {
    setValidationError(null);
    setHouseholdMembers((prev) =>
      prev.includes(member)
        ? prev.filter((item) => item !== member)
        : [...prev, member],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (householdMembers.length === 0) {
      setValidationError("Select at least one household member group.");
      return;
    }

    setValidationError(null);

    onSubmit({
      city,
      householdMembers,
      commuteMode,
      homeSetup: {
        hasAirPurifier,
        cookingFuel,
        ventilation,
      },
      outdoorActivity,
    });
  }

  const selectClass =
    "w-full appearance-none rounded-xl border border-[#E1E9E2] bg-white px-3.5 py-3 text-sm text-[#24352D] outline-none transition-all hover:border-[#B8D4C1] focus:border-[#237A57] focus:ring-2 focus:ring-[#237A57]/15";

  const labelClass =
    "mb-2 flex items-center gap-2 text-sm font-semibold text-[#34443A]";

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="profiler-heading"
      className="rounded-2xl border border-[#E5EBE6] bg-white p-5 shadow-sm sm:p-6"
    >
      {/* Form Heading */}
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E5F1E8] px-3 py-1.5 text-xs font-medium text-[#176B4D]">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          Personalised profile
        </div>

        <h2
          id="profiler-heading"
          className="text-xl font-semibold tracking-tight text-[#24352D] sm:text-2xl"
        >
          Household &amp; Routine Profile
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-[#68756D]">
          Tell us a little about your daily lifestyle so we can create a more
          relevant air quality action plan for{" "}
          <span className="font-semibold text-[#176B4D]">{city}</span>.
        </p>
      </div>

      {/* Household Members */}
      <fieldset className="mb-7">
        <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#34443A]">
          <Users className="h-4 w-4 text-[#176B4D]" aria-hidden="true" />
          Who lives in your household?
        </legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {HOUSEHOLD_OPTIONS.map((option) => {
            const checked = householdMembers.includes(option.value);
            const id = `member-${option.value}`;

            return (
              <label
                key={option.value}
                htmlFor={id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  checked
                    ? "border-[#9CC6A9] bg-[#F0F7F1]"
                    : "border-[#E5EBE6] bg-white hover:border-[#B8D4C1] hover:bg-[#F9FBF8]"
                }`}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMember(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#C7D2C9] accent-[#176B4D] focus:ring-2 focus:ring-[#237A57] focus:ring-offset-2"
                />

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#24352D]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[#87938A]">
                    {option.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {validationError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
          >
            {validationError}
          </p>
        )}
      </fieldset>

      {/* Commute & Outdoor Routine */}
      <div className="mb-7">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#34443A]">
            Daily Travel &amp; Activities
          </h3>
          <p className="mt-1 text-xs text-[#87938A]">
            How do you usually travel and spend time outdoors?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="commute-mode" className={labelClass}>
              <Car className="h-4 w-4 text-[#176B4D]" aria-hidden="true" />
              Primary Commute
            </label>

            <select
              id="commute-mode"
              value={commuteMode}
              onChange={(e) =>
                setCommuteMode(
                  e.target.value as LifestyleProfile["commuteMode"],
                )
              }
              className={selectClass}
            >
              <option value="public_transit">
                Metro / Bus / Public Transit
              </option>
              <option value="car">Private Car</option>
              <option value="two_wheeler">Two-Wheeler / Scooter</option>
              <option value="walk_cycle">Walking or Cycling</option>
              <option value="work_from_home">Work From Home</option>
            </select>
          </div>

          <div>
            <label htmlFor="outdoor-activity" className={labelClass}>
              Main Daily Outdoor Activity
            </label>

            <select
              id="outdoor-activity"
              value={outdoorActivity}
              onChange={(e) =>
                setOutdoorActivity(
                  e.target.value as LifestyleProfile["outdoorActivity"],
                )
              }
              className={selectClass}
            >
              <option value="morning_walk">Morning Walk / Jog</option>
              <option value="evening_exercise">
                Evening Outdoor Exercise
              </option>
              <option value="school_drop">School Drop-off / Pick-up</option>
              <option value="none">Minimal Outdoor Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Home Setup */}
      <div className="mb-7">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#34443A]">
            Your Home Environment
          </h3>
          <p className="mt-1 text-xs text-[#87938A]">
            Help us understand your indoor air conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cooking-fuel" className={labelClass}>
              <Home className="h-4 w-4 text-[#176B4D]" aria-hidden="true" />
              Cooking Fuel
            </label>

            <select
              id="cooking-fuel"
              value={cookingFuel}
              onChange={(e) =>
                setCookingFuel(
                  e.target.value as LifestyleProfile["homeSetup"]["cookingFuel"],
                )
              }
              className={selectClass}
            >
              <option value="lpg_gas">LPG / Piped Gas Stove</option>
              <option value="induction_electric">Induction / Electric</option>
              <option value="mixed">Mixed Gas &amp; Electric</option>
            </select>
          </div>

          <div>
            <label htmlFor="ventilation-type" className={labelClass}>
              Home Ventilation
            </label>

            <select
              id="ventilation-type"
              value={ventilation}
              onChange={(e) =>
                setVentilation(
                  e.target.value as LifestyleProfile["homeSetup"]["ventilation"],
                )
              }
              className={selectClass}
            >
              <option value="cross_ventilation">
                Natural Cross-Ventilation
              </option>
              <option value="exhaust_only">
                Kitchen / Bath Exhaust Only
              </option>
              <option value="sealed_ac">Sealed Rooms with AC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Air Purifier */}
      <label
        htmlFor="has-purifier"
        className={`mb-7 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
          hasAirPurifier
            ? "border-[#9CC6A9] bg-[#F0F7F1]"
            : "border-[#E5EBE6] bg-[#F9FBF8] hover:border-[#B8D4C1]"
        }`}
      >
        <input
          id="has-purifier"
          type="checkbox"
          checked={hasAirPurifier}
          onChange={(e) => setHasAirPurifier(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-[#C7D2C9] accent-[#176B4D] focus:ring-2 focus:ring-[#237A57] focus:ring-offset-2"
        />

        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#34443A]">
            We already have a HEPA air purifier at home
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-[#87938A]">
            Leave unchecked for DIY / zero-cost filtration hacks.
          </span>
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={isGenerating}
        aria-busy={isGenerating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#176B4D] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#12583E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#237A57] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Generating Your Action Plan...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generate Personalized Action Plan
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-[#87938A]">
        Your responses help tailor recommendations to your household.
      </p>
    </form>
  );
}

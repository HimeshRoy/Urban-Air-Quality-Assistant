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
    useState<LifestyleProfile["homeSetup"]["ventilation"]>("cross_ventilation");
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

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="profiler-heading"
      className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6"
    >
      <div className="mb-5">
        <h2
          id="profiler-heading"
          className="text-lg font-semibold text-zinc-100"
        >
          Household &amp; Routine Profile
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Tailor your low-emission routine and indoor air hacks to your home in{" "}
          <span className="font-medium text-zinc-200">{city}</span>.
        </p>
      </div>

      {/* Household Members Checkboxes */}
      <fieldset className="mb-5">
        <legend className="mb-2.5 flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Users className="h-4 w-4 text-zinc-400" aria-hidden="true" />
          Who lives in your household?
        </legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {HOUSEHOLD_OPTIONS.map((option) => {
            const checked = householdMembers.includes(option.value);
            const id = `member-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked
                    ? "border-emerald-500/70 bg-emerald-950/30"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMember(option.value)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">
                    {option.label}
                  </span>
                  <span className="block text-xs text-zinc-400">
                    {option.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {validationError && (
          <p role="alert" className="mt-2 text-xs font-medium text-rose-400">
            {validationError}
          </p>
        )}
      </fieldset>

      {/* Commute & Outdoor Routine */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="commute-mode"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-200"
          >
            <Car className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            Primary Commute
          </label>
          <select
            id="commute-mode"
            value={commuteMode}
            onChange={(e) =>
              setCommuteMode(e.target.value as LifestyleProfile["commuteMode"])
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <option value="public_transit">Metro / Bus / Public Transit</option>
            <option value="car">Private Car</option>
            <option value="two_wheeler">Two-Wheeler / Scooter</option>
            <option value="walk_cycle">Walking or Cycling</option>
            <option value="work_from_home">Work From Home</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="outdoor-activity"
            className="mb-1.5 block text-sm font-medium text-zinc-200"
          >
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <option value="morning_walk">Morning Walk / Jog</option>
            <option value="evening_exercise">Evening Outdoor Exercise</option>
            <option value="school_drop">School Drop-off / Pick-up</option>
            <option value="none">Minimal Outdoor Time</option>
          </select>
        </div>
      </div>

      {/* Home Setup */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cooking-fuel"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-200"
          >
            <Home className="h-4 w-4 text-zinc-400" aria-hidden="true" />
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <option value="lpg_gas">LPG / Piped Gas Stove</option>
            <option value="induction_electric">Induction / Electric</option>
            <option value="mixed">Mixed Gas &amp; Electric</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="ventilation-type"
            className="mb-1.5 block text-sm font-medium text-zinc-200"
          >
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <option value="cross_ventilation">Natural Cross-Ventilation</option>
            <option value="exhaust_only">Kitchen / Bath Exhaust Only</option>
            <option value="sealed_ac">Sealed Rooms with AC</option>
          </select>
        </div>
      </div>

      {/* Air Purifier Checkbox */}
      <label
        htmlFor="has-purifier"
        className="mb-6 flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 hover:border-zinc-700"
      >
        <input
          id="has-purifier"
          type="checkbox"
          checked={hasAirPurifier}
          onChange={(e) => setHasAirPurifier(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
        />
        <span className="text-sm text-zinc-200">
          We already have a HEPA air purifier at home{" "}
          <span className="text-zinc-400">
            (leave unchecked for DIY / zero-cost filtration hacks)
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={isGenerating}
        aria-busy={isGenerating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Generating Personalized Smog Action Plan...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generate Personalized Action Plan
          </>
        )}
      </button>
    </form>
  );
}

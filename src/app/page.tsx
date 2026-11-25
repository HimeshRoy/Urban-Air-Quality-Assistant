"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AlertCircle, Loader2, RefreshCw, Search } from "lucide-react";
import type { AirQualityReport } from "@/lib/aqi";
import type { AirQualityPlan, LifestyleProfile } from "@/lib/schemas";
import { AqiBanner } from "@/components/AqiBanner";
import { LifestyleForm } from "@/components/LifestyleForm";
import { ActionPlanTabs } from "@/components/ActionPlanTabs";

const PRESET_CITIES = [
  "New Delhi",
  "Noida",
  "Mumbai",
  "Bengaluru",
  "Kolkata",
  "London",
];

interface PlanApiResponse {
  plan: AirQualityPlan;
  model: string;
  generatedAt: string;
}

export default function HomePage() {
  const [cityInput, setCityInput] = useState<string>("New Delhi");
  const [aqiReport, setAqiReport] = useState<AirQualityReport | null>(null);
  const [isLoadingAqi, setIsLoadingAqi] = useState<boolean>(true);
  const [aqiError, setAqiError] = useState<string | null>(null);

  const [planResult, setPlanResult] = useState<PlanApiResponse | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const aqiAbortRef = useRef<AbortController | null>(null);
  const planSectionRef = useRef<HTMLDivElement | null>(null);

  const loadCityAqi = useCallback(async (rawCity: string) => {
    const trimmed = rawCity.trim();
    if (trimmed.length < 2) {
      setAqiError("Enter at least 2 characters for a city name.");
      return;
    }

    aqiAbortRef.current?.abort();
    const controller = new AbortController();
    aqiAbortRef.current = controller;

    setIsLoadingAqi(true);
    setAqiError(null);
    setPlanResult(null);
    setPlanError(null);

    try {
      const response = await fetch(
        `/api/aqi?city=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      );
      const data = (await response.json()) as
        | AirQualityReport
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in data && data.error
            ? data.error
            : "Unable to load air quality data for this location.";
        setAqiError(message);
        setAqiReport(null);
        return;
      }

      setAqiReport(data as AirQualityReport);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setAqiError("Network error while fetching live air quality telemetry.");
      setAqiReport(null);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingAqi(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    aqiAbortRef.current = controller;

    async function fetchInitialCity() {
      try {
        const response = await fetch(
          `/api/aqi?city=${encodeURIComponent("New Delhi")}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as
          | AirQualityReport
          | { error?: string };

        if (controller.signal.aborted) return;

        if (!response.ok) {
          const message =
            "error" in data && data.error
              ? data.error
              : "Unable to load air quality data for this location.";
          setAqiError(message);
          setAqiReport(null);
          return;
        }

        setAqiReport(data as AirQualityReport);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setAqiError("Network error while fetching live air quality telemetry.");
        setAqiReport(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingAqi(false);
        }
      }
    }

    void fetchInitialCity();

    return () => {
      controller.abort();
    };
  }, []);

  function handleCitySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadCityAqi(cityInput);
  }

  function handlePresetSelect(city: string) {
    setCityInput(city);
    void loadCityAqi(city);
  }

  async function handleGeneratePlan(profile: LifestyleProfile) {
    if (!aqiReport) return;

    setIsGeneratingPlan(true);
    setPlanError(null);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            ...profile,
            city: aqiReport.location.name,
          },
          aqiContext: {
            usAqi: aqiReport.current.usAqi,
            pm25: aqiReport.current.pm25,
            pm10: aqiReport.current.pm10,
            category: aqiReport.severity.category,
            safestWindow: aqiReport.safestWindow,
          },
        }),
      });

      const data = (await response.json()) as
        | PlanApiResponse
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in data && data.error
            ? data.error
            : "Could not generate an action plan right now.";
        setPlanError(message);
        return;
      }

      setPlanResult(data as PlanApiResponse);
      window.setTimeout(() => {
        planSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      setPlanError("Network error while contacting the AI assistant.");
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Intro & Location Search */}
      <section aria-labelledby="hero-heading" className="space-y-4">
        <div>
          <h1
            id="hero-heading"
            className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl"
          >
            Navigate winter smog with clear, low-emission daily choices
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Check hyperlocal PM2.5 levels, find today&apos;s safest outdoor
            window, and generate a tailored action plan showing both your
            family&apos;s health protection and community emission savings.
          </p>
        </div>

        <form
          onSubmit={handleCitySearch}
          role="search"
          aria-label="Search city air quality"
          className="flex flex-col gap-2.5 sm:flex-row"
        >
          <div className="relative flex-1">
            <label htmlFor="city-search" className="sr-only">
              Enter your city
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              id="city-search"
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Enter city (e.g., New Delhi, Noida, Panipat, London)"
              autoComplete="address-level2"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>

          <button
            type="submit"
            disabled={isLoadingAqi}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingAqi ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking...
              </>
            ) : (
              "Check Air Quality"
            )}
          </button>
        </form>

        {/* Quick City Presets */}
        <div
          aria-label="Quick city presets"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs text-zinc-500">Quick select:</span>
          {PRESET_CITIES.map((city) => {
            const isActive =
              aqiReport?.location.name.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                onClick={() => handlePresetSelect(city)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-emerald-500/70 bg-emerald-950/50 text-emerald-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </section>

      {/* AQI Loading / Error / Report */}
      {isLoadingAqi && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 text-sm text-zinc-400"
        >
          <span className="inline-flex items-center gap-2">
            <Loader2
              className="h-4 w-4 animate-spin text-emerald-400"
              aria-hidden="true"
            />
            Fetching live PM2.5, PM10, and 24-hour forecast...
          </span>
        </div>
      )}

      {aqiError && !isLoadingAqi && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-800/60 bg-rose-950/30 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5 text-sm text-rose-200">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{aqiError}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadCityAqi(cityInput)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-rose-700/60 bg-rose-950 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-900/60"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {aqiReport && !isLoadingAqi && (
        <>
          <AqiBanner report={aqiReport} />

          <LifestyleForm
            city={aqiReport.location.name}
            isGenerating={isGeneratingPlan}
            onSubmit={handleGeneratePlan}
          />
        </>
      )}

      {/* Plan Generation Error */}
      {planError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-800/60 bg-rose-950/30 p-5 text-sm text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{planError}</span>
        </div>
      )}

      {/* Generated Personalized Action Plan */}
      {planResult && aqiReport && (
        <div ref={planSectionRef} className="space-y-3">
          <ActionPlanTabs
            plan={planResult.plan}
            city={aqiReport.location.name}
          />
          <p className="text-right text-xs text-zinc-500">
            Generated using{" "}
            <span className="font-mono">{planResult.model}</span> at{" "}
            {new Date(planResult.generatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

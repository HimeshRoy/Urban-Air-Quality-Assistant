
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
    <div className="space-y-10 sm:space-y-12">

      {/* Premium Minimal Hero & Location Search */}
      <section
        aria-labelledby="hero-heading"
        className="space-y-7"
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE9DF] bg-[#EAF3ED] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#237A57]" />
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[#237A57]">
              YOUR DAILY AIR QUALITY COMPANION
            </span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1
              id="hero-heading"
              className="text-3xl font-semibold leading-[1.2] tracking-[-0.04em] text-[#202B25] sm:text-4xl lg:text-[46px]"
            >
              Breathe smarter.
              <br className="hidden sm:block" />
              Make every day a little healthier.
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-[#68756D] sm:text-base">
              Understand the air around you, discover safer times to step
              outdoors, and get practical recommendations tailored to your
              everyday lifestyle.
            </p>
          </div>
        </div>

        {/* City Search */}
        <div className="max-w-3xl space-y-3">
          <form
            onSubmit={handleCitySearch}
            role="search"
            aria-label="Search city air quality"
            className="flex flex-col gap-2 rounded-2xl border border-[#E5EBE6] bg-white p-2 shadow-[0_4px_20px_rgba(32,43,37,0.04)] sm:flex-row"
          >
            <div className="relative flex-1">
              <label htmlFor="city-search" className="sr-only">
                Enter your city
              </label>

              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#87938A]"
                aria-hidden="true"
              />

              <input
                id="city-search"
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Search a city or location..."
                autoComplete="address-level2"
                className="h-12 w-full rounded-xl border-0 bg-transparent py-3 pl-12 pr-4 text-sm text-[#202B25] outline-none placeholder:text-[#A0AAA2] focus:ring-2 focus:ring-[#237A57]/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingAqi}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#237A57] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1B6547] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingAqi ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Checking...
                </>
              ) : (
                <>
                  Check air quality
                  <Search className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Quick City Presets */}
          <div
            aria-label="Quick city presets"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="mr-1 text-xs font-medium text-[#87938A]">
              Explore:
            </span>

            {PRESET_CITIES.map((city) => {
              const isActive =
                aqiReport?.location.name.toLowerCase() === city.toLowerCase();

              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => handlePresetSelect(city)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border-[#237A57] bg-[#EAF3ED] text-[#237A57]"
                      : "border-[#E5EBE6] bg-white text-[#68756D] hover:border-[#B9D3C1] hover:bg-[#F5F9F5]"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* AQI Loading State */}
      {isLoadingAqi && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-[#E5EBE6] bg-white p-6 text-sm text-[#68756D]"
        >
          <span className="inline-flex items-center gap-2">
            <Loader2
              className="h-4 w-4 animate-spin text-[#237A57]"
              aria-hidden="true"
            />
            Fetching live PM2.5, PM10, and 24-hour forecast...
          </span>
        </div>
      )}

      {/* AQI Error */}
      {aqiError && !isLoadingAqi && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5 text-sm text-rose-800">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{aqiError}</span>
          </div>

          <button
            type="button"
            onClick={() => void loadCityAqi(cityInput)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* AQI Report & Lifestyle Form */}
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
          className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
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

          <p className="text-right text-xs text-[#87938A]">
            Generated using{" "}
            <span className="font-mono">{planResult.model}</span> at{" "}
            {new Date(planResult.generatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

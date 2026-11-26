"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cigarette,
  Clock,
  DoorClosed,
  Footprints,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Wind,
} from "lucide-react";
import type { AirQualityReport, AqiLevel, HourlyPoint } from "@/lib/aqi";

interface AqiBannerProps {
  report: AirQualityReport;
}

const SEVERITY_STYLES: Record<
  AqiLevel,
  {
    badge: string;
    border: string;
    bar: string;
    labelPrefix: string;
    surface: string;
    text: string;
  }
> = {
  good: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    labelPrefix: "Safe",
    surface: "bg-emerald-50",
    text: "text-emerald-700",
  },
  moderate: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    border: "border-amber-200",
    bar: "bg-amber-500",
    labelPrefix: "Fair",
    surface: "bg-amber-50",
    text: "text-amber-700",
  },
  sensitive: {
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    border: "border-orange-200",
    bar: "bg-orange-500",
    labelPrefix: "Caution",
    surface: "bg-orange-50",
    text: "text-orange-700",
  },
  unhealthy: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    border: "border-rose-200",
    bar: "bg-rose-500",
    labelPrefix: "Unhealthy",
    surface: "bg-rose-50",
    text: "text-rose-700",
  },
  very_unhealthy: {
    badge: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    border: "border-fuchsia-200",
    bar: "bg-fuchsia-500",
    labelPrefix: "Very Poor",
    surface: "bg-fuchsia-50",
    text: "text-fuchsia-700",
  },
  hazardous: {
    badge: "border-red-200 bg-red-50 text-red-700",
    border: "border-red-200",
    bar: "bg-red-500",
    labelPrefix: "Severe",
    surface: "bg-red-50",
    text: "text-red-700",
  },
};

function getBarColorByAqi(aqi: number): string {
  if (aqi <= 50) return "bg-emerald-500";
  if (aqi <= 100) return "bg-amber-500";
  if (aqi <= 150) return "bg-orange-500";
  if (aqi <= 200) return "bg-rose-500";
  if (aqi <= 300) return "bg-fuchsia-500";
  return "bg-red-500";
}

function getAqiShortWord(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Fair";
  if (aqi <= 150) return "Poor";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Poor";
  return "Severe";
}

function formatHour12(hourLabel: string): string {
  const hourNum = Number.parseInt(hourLabel.split(":")[0] ?? "0", 10);

  if (Number.isNaN(hourNum)) return hourLabel;
  if (hourNum === 0) return "12 AM";
  if (hourNum === 12) return "12 PM";

  return hourNum > 12 ? `${hourNum - 12} PM` : `${hourNum} AM`;
}

function getPollutantStatus(
  value: number,
  moderateAt: number,
  highAt: number,
): { label: string; className: string } {
  if (value >= highAt) {
    return {
      label: "High",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (value >= moderateAt) {
    return {
      label: "Moderate",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Low",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getFamilyVerdict(level: AqiLevel) {
  switch (level) {
    case "good":
      return {
        outdoor: { status: "Safe Outdoors", tone: "text-emerald-700" },
        windows: { status: "Open Freely", tone: "text-emerald-700" },
        mask: { status: "Not Needed", tone: "text-emerald-700" },
        purifier: { status: "Optional", tone: "text-[#68756D]" },
      };

    case "moderate":
      return {
        outdoor: { status: "OK for Most", tone: "text-amber-700" },
        windows: { status: "Open in Afternoon", tone: "text-amber-700" },
        mask: { status: "Sensitive Groups", tone: "text-amber-700" },
        purifier: { status: "Low / Sleep Mode", tone: "text-[#68756D]" },
      };

    case "sensitive":
      return {
        outdoor: {
          status: "Limit Heavy Exercise",
          tone: "text-orange-700",
        },
        windows: { status: "Brief Airing Only", tone: "text-orange-700" },
        mask: { status: "Recommended (N95)", tone: "text-orange-700" },
        purifier: { status: "Run on Medium", tone: "text-orange-700" },
      };

    case "unhealthy":
      return {
        outdoor: { status: "Move Indoors", tone: "text-rose-700" },
        windows: { status: "Keep Closed", tone: "text-rose-700" },
        mask: { status: "Wear N95 Outside", tone: "text-rose-700" },
        purifier: { status: "Run Continuously", tone: "text-rose-700" },
      };

    case "very_unhealthy":
    case "hazardous":
      return {
        outdoor: { status: "Avoid Going Out", tone: "text-red-700" },
        windows: { status: "Seal Drafts Tight", tone: "text-red-700" },
        mask: { status: "Mandatory N95", tone: "text-red-700" },
        purifier: { status: "Max / DIY Filter", tone: "text-red-700" },
      };
  }
}

function getTimeOfDaySummary(hourly: HourlyPoint[]) {
  const buckets = [
    { label: "Morning", range: "6 AM – 11 AM", start: 6, end: 11 },
    { label: "Afternoon", range: "12 PM – 4 PM", start: 12, end: 16 },
    { label: "Evening", range: "5 PM – 9 PM", start: 17, end: 21 },
    { label: "Night", range: "10 PM – 5 AM", start: 22, end: 5 },
  ];

  return buckets.map((bucket) => {
    const matching = hourly.filter((pt) => {
      const h = Number.parseInt(pt.hourLabel.split(":")[0] ?? "-1", 10);

      if (bucket.start <= bucket.end) {
        return h >= bucket.start && h <= bucket.end;
      }

      return h >= bucket.start || h <= bucket.end;
    });

    if (matching.length === 0) {
      return { ...bucket, avgAqi: null as number | null };
    }

    const avgAqi = Math.round(
      matching.reduce((sum, pt) => sum + pt.usAqi, 0) / matching.length,
    );

    return { ...bucket, avgAqi };
  });
}

function SeverityIcon({ level }: { level: AqiLevel }) {
  if (level === "good") {
    return <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (level === "moderate" || level === "sensitive") {
    return <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  return <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

export function AqiBanner({ report }: AqiBannerProps) {
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(
    null,
  );

  const style = SEVERITY_STYLES[report.severity.level];
  const verdict = getFamilyVerdict(report.severity.level);

  const locationLabel = [
    report.location.name,
    report.location.region,
    report.location.country,
  ]
    .filter(Boolean)
    .join(", ");

  // Existing health-impact calculations retained.
  const whoMultiplier = Math.max(0.1, report.current.pm25 / 15).toFixed(1);
  const cigaretteEquivalent = (report.current.pm25 / 22).toFixed(1);

  const peakAqi = Math.max(
    50,
    ...report.hourlyForecast.map((point) => point.usAqi),
  );

  const dayPeriods = getTimeOfDaySummary(report.hourlyForecast);

  const selectedPoint =
    selectedHourIndex !== null
      ? (report.hourlyForecast[selectedHourIndex] ?? null)
      : null;

  const pollutants = [
    {
      plainName: "Fine Smoke & Haze",
      techName: "PM2.5",
      value: `${report.current.pm25} µg/m³`,
      meaning: "Tiny particles that enter deep lungs & bloodstream",
      status: getPollutantStatus(report.current.pm25, 15, 55),
    },
    {
      plainName: "Road & Soil Dust",
      techName: "PM10",
      value: `${report.current.pm10} µg/m³`,
      meaning: "Coarse dust from traffic & construction sites",
      status: getPollutantStatus(report.current.pm10, 45, 150),
    },
    {
      plainName: "Traffic Exhaust",
      techName: "NO₂",
      value: `${report.current.no2} µg/m³`,
      meaning: "Fumes from diesel vehicles & generators",
      status: getPollutantStatus(report.current.no2, 25, 100),
    },
    {
      plainName: "Sunlit Smog Gas",
      techName: "Ozone",
      value: `${report.current.ozone} µg/m³`,
      meaning: "Ground-level gas that irritates throat & airways",
      status: getPollutantStatus(report.current.ozone, 100, 160),
    },
  ];

  const familyCards = [
    {
      label: "Outdoor Walk",
      icon: Footprints,
      verdict: verdict.outdoor,
    },
    {
      label: "Home Windows",
      icon: DoorClosed,
      verdict: verdict.windows,
    },
    {
      label: "Face Mask",
      icon: ShieldCheck,
      verdict: verdict.mask,
    },
    {
      label: "Air Purifier",
      icon: Wind,
      verdict: verdict.purifier,
    },
  ];

  return (
    <section
      aria-labelledby="aqi-banner-heading"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-[#E5EBE6] bg-white shadow-[0_4px_24px_rgba(32,43,37,0.035)]"
    >
      <div className="space-y-7 p-5 sm:p-7">
        {/* AQI Overview */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-[#68756D]">
              <MapPin className="h-4 w-4 text-[#237A57]" aria-hidden="true" />
              <span>{locationLabel}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h2
                id="aqi-banner-heading"
                className="text-4xl font-semibold tracking-[-0.04em] text-[#202B25] sm:text-5xl"
              >
                {report.current.usAqi}
              </h2>

              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[#202B25]">
                  Air Quality Index
                </p>
                <p className="text-xs text-[#87938A]">Global 0–500 scale</p>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-[#68756D]">
              {report.severity.guidance}
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${style.badge}`}
          >
            <SeverityIcon level={report.severity.level} />
            <span>
              {style.labelPrefix}: {report.severity.category}
            </span>
          </div>
        </div>

        {/* Health Impact Strip */}
        <div className="grid gap-3 rounded-xl border border-[#F1DDE0] bg-[#FFF8F8] p-4 sm:grid-cols-2 sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600">
              <Cigarette className="h-4 w-4" aria-hidden="true" />
            </div>

            <div>
              <p className="text-xs text-[#87938A]">
                Illustrative cigarette equivalent
              </p>
              <p className="mt-1 text-sm font-semibold text-[#202B25]">
                {cigaretteEquivalent} cigarettes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:border-l sm:border-[#F1DDE0] sm:pl-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600">
              <Activity className="h-4 w-4" aria-hidden="true" />
            </div>

            <div>
              <p className="text-xs text-[#87938A]">
                Compared with WHO 24-hour PM2.5 guideline
              </p>
              <p className="mt-1 text-sm font-semibold text-[#202B25]">
                {whoMultiplier}× the guideline value
              </p>
            </div>
          </div>
        </div>

        {/* Family Recommendations */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-[#202B25]">
              What should your family do?
            </h3>
            <p className="mt-1 text-xs text-[#87938A]">
              Quick recommendations based on the current AQI category
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {familyCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-[#E5EBE6] bg-[#FAFCFA] p-4 transition-colors hover:border-[#CADBCF]"
                >
                  <div className="flex items-center gap-2 text-[#68756D]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>

                  <p
                    className={`mt-3 text-sm font-semibold leading-5 ${item.verdict.tone}`}
                  >
                    {item.verdict.status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cleanest Window */}
        <div
          className={`flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${style.surface} ${style.border}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <Clock className={`h-4 w-4 ${style.text}`} aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#202B25]">
                Cleanest 3-hour window
              </p>
              <p className="mt-0.5 text-xs text-[#68756D]">
                Suggested time to step out or air rooms
              </p>
            </div>
          </div>

          <span className={`text-sm font-semibold ${style.text}`}>
            {report.safestWindow}
          </span>
        </div>

        {/* Pollutant Breakdown */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-[#202B25]">
              What&apos;s in the air right now?
            </h3>
            <p className="mt-1 text-xs text-[#87938A]">
              Understanding the main pollutants around you
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pollutants.map((item) => (
              <div
                key={item.techName}
                className="rounded-xl border border-[#E5EBE6] bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-xs font-semibold leading-5 text-[#202B25]">
                    {item.plainName}
                  </dt>

                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold ${item.status.className}`}
                  >
                    {item.status.label}
                  </span>
                </div>

                <dd className="mt-2 min-h-10 text-xs leading-5 text-[#68756D]">
                  {item.meaning}
                </dd>

                <dd className="mt-3 border-t border-[#EEF1EE] pt-3 font-mono text-xs font-medium text-[#237A57]">
                  {item.techName}: {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Interactive 24-Hour Timeline */}
        {report.hourlyForecast.length > 0 && (
          <div className="space-y-4 border-t border-[#E5EBE6] pt-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Activity
                  className="h-4 w-4 text-[#237A57]"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-semibold text-[#202B25]">
                    Hour-by-hour air quality
                  </h3>
                  <p className="mt-1 text-xs text-[#87938A]">
                    Select a bar to explore the forecast
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[#F5F8F5] px-3 py-2 text-xs font-medium text-[#68756D]">
                {selectedPoint ? (
                  <span className="text-[#202B25]">
                    {formatHour12(selectedPoint.hourLabel)}: AQI{" "}
                    {selectedPoint.usAqi} ·{" "}
                    {getAqiShortWord(selectedPoint.usAqi)}
                  </span>
                ) : (
                  `Peak AQI today: ${peakAqi}`
                )}
              </div>
            </div>

            <div
              role="group"
              aria-label="24-hour air quality timeline"
              className="flex h-28 items-end gap-1 rounded-xl border border-[#E5EBE6] bg-[#FAFCFA] p-3"
            >
              {report.hourlyForecast.slice(0, 24).map((point, idx) => {
                const heightPct = Math.max(
                  14,
                  Math.round((point.usAqi / peakAqi) * 100),
                );

                const isSelected = selectedHourIndex === idx;

                return (
                  <button
                    key={point.time}
                    type="button"
                    onClick={() => setSelectedHourIndex(idx)}
                    onMouseEnter={() => setSelectedHourIndex(idx)}
                    aria-label={`${formatHour12(point.hourLabel)}: AQI ${point.usAqi}, ${getAqiShortWord(point.usAqi)}`}
                    aria-pressed={isSelected}
                    className="flex h-full flex-1 items-end rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#237A57] focus-visible:ring-offset-2"
                  >
                    <span
                      className={`block w-full rounded-t-sm transition-all ${getBarColorByAqi(
                        point.usAqi,
                      )} ${
                        isSelected
                          ? "opacity-100 ring-2 ring-[#202B25]/20"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between text-[11px] text-[#87938A]">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>

            {/* Time-of-Day Comparison */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#68756D]">
                Average AQI by time of day
              </h4>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {dayPeriods.map((period) => (
                  <div
                    key={period.label}
                    className="rounded-xl border border-[#E5EBE6] bg-white p-3"
                  >
                    <p className="text-xs font-semibold text-[#202B25]">
                      {period.label}
                    </p>

                    <p className="mt-1 text-[11px] text-[#87938A]">
                      {period.range}
                    </p>

                    <p className="mt-3 text-sm font-semibold text-[#202B25]">
                      {period.avgAqi !== null ? `AQI ${period.avgAqi}` : "—"}
                    </p>

                    {period.avgAqi !== null && (
                      <p className="mt-1 text-[11px] font-medium text-[#68756D]">
                        {getAqiShortWord(period.avgAqi)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Data Source Note */}
        <div className="border-t border-[#E5EBE6] pt-4">
          <p className="text-[11px] leading-5 text-[#87938A]">
            Air quality readings and hourly forecasts are model-based estimates
            from Open-Meteo. AQI categories use the US AQI scale.
          </p>
        </div>
      </div>
    </section>
  );
}

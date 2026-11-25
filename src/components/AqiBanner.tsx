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
  { badge: string; border: string; bar: string; labelPrefix: string }
> = {
  good: {
    badge: "bg-emerald-950 text-emerald-300 border-emerald-700/60",
    border: "border-emerald-800/50",
    bar: "bg-emerald-400",
    labelPrefix: "Safe",
  },
  moderate: {
    badge: "bg-amber-950 text-amber-200 border-amber-700/60",
    border: "border-amber-800/50",
    bar: "bg-amber-400",
    labelPrefix: "Fair",
  },
  sensitive: {
    badge: "bg-orange-950 text-orange-200 border-orange-700/60",
    border: "border-orange-800/50",
    bar: "bg-orange-400",
    labelPrefix: "Caution",
  },
  unhealthy: {
    badge: "bg-rose-950 text-rose-200 border-rose-700/60",
    border: "border-rose-800/50",
    bar: "bg-rose-500",
    labelPrefix: "Unhealthy",
  },
  very_unhealthy: {
    badge: "bg-fuchsia-950 text-fuchsia-200 border-fuchsia-700/60",
    border: "border-fuchsia-800/50",
    bar: "bg-fuchsia-500",
    labelPrefix: "Very Poor",
  },
  hazardous: {
    badge: "bg-red-950 text-red-100 border-red-600/80",
    border: "border-red-700/70",
    bar: "bg-red-500",
    labelPrefix: "Severe",
  },
};

function getBarColorByAqi(aqi: number): string {
  if (aqi <= 50) return "bg-emerald-400";
  if (aqi <= 100) return "bg-amber-400";
  if (aqi <= 150) return "bg-orange-400";
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
      className: "bg-rose-950 text-rose-300 border-rose-800/60",
    };
  }
  if (value >= moderateAt) {
    return {
      label: "Moderate",
      className: "bg-amber-950 text-amber-200 border-amber-800/60",
    };
  }
  return {
    label: "Low",
    className: "bg-emerald-950 text-emerald-300 border-emerald-800/60",
  };
}

function getFamilyVerdict(level: AqiLevel) {
  switch (level) {
    case "good":
      return {
        outdoor: { status: "Safe Outdoors", tone: "text-emerald-300" },
        windows: { status: "Open Freely", tone: "text-emerald-300" },
        mask: { status: "Not Needed", tone: "text-emerald-300" },
        purifier: { status: "Optional", tone: "text-zinc-300" },
      };
    case "moderate":
      return {
        outdoor: { status: "OK for Most", tone: "text-amber-300" },
        windows: { status: "Open in Afternoon", tone: "text-amber-300" },
        mask: { status: "Sensitive Groups", tone: "text-amber-300" },
        purifier: { status: "Low / Sleep Mode", tone: "text-zinc-300" },
      };
    case "sensitive":
      return {
        outdoor: { status: "Limit Heavy Exercise", tone: "text-orange-300" },
        windows: { status: "Brief Airing Only", tone: "text-orange-300" },
        mask: { status: "Recommended (N95)", tone: "text-orange-300" },
        purifier: { status: "Run on Medium", tone: "text-orange-300" },
      };
    case "unhealthy":
      return {
        outdoor: { status: "Move Indoors", tone: "text-rose-300" },
        windows: { status: "Keep Closed", tone: "text-rose-300" },
        mask: { status: "Wear N95 Outside", tone: "text-rose-300" },
        purifier: { status: "Run Continuously", tone: "text-rose-300" },
      };
    case "very_unhealthy":
    case "hazardous":
      return {
        outdoor: { status: "Avoid Going Out", tone: "text-red-300" },
        windows: { status: "Seal Drafts Tight", tone: "text-red-300" },
        mask: { status: "Mandatory N95", tone: "text-red-300" },
        purifier: { status: "Max / DIY Filter", tone: "text-red-300" },
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

  // Real-world equivalents based on WHO 24h PM2.5 guideline (15 µg/m³)
  // and Berkeley Earth rule of thumb (~22 µg/m³ PM2.5 ≈ 1 cigarette/day)
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

  return (
    <section
      aria-labelledby="aqi-banner-heading"
      aria-live="polite"
      className={`rounded-xl border ${style.border} bg-zinc-900/90 p-5 sm:p-6`}
    >
      {/* Top Header: Location, Clean AQI Headline & Risk Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>{locationLabel}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
            <h2
              id="aqi-banner-heading"
              className="text-3xl font-semibold tracking-tight text-zinc-100"
            >
              AQI {report.current.usAqi}
            </h2>
            <span className="text-xs text-zinc-500">(Global 0–500 scale)</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
            {report.severity.guidance}
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-medium ${style.badge}`}
        >
          <SeverityIcon level={report.severity.level} />
          <span>
            {style.labelPrefix}: {report.severity.category}
          </span>
        </div>
      </div>

      {/* Real-World Health Translation Strip */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-zinc-200">
          <Cigarette
            className="h-4 w-4 text-rose-400 shrink-0"
            aria-hidden="true"
          />
          <span>
            Breathing this air all day ≈{" "}
            <strong className="font-semibold text-zinc-100">
              {cigaretteEquivalent} cigarettes
            </strong>
          </span>
        </div>
        <span className="hidden text-zinc-700 sm:inline" aria-hidden="true">
          •
        </span>
        <div className="text-zinc-300">
          <strong className="font-semibold text-zinc-100">
            {whoMultiplier}×
          </strong>{" "}
          above the WHO 24-hour safe limit
        </div>
      </div>

      {/* Instant Family Verdict Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Outdoor Walk</span>
          </div>
          <p className={`mt-1 text-sm font-semibold ${verdict.outdoor.tone}`}>
            {verdict.outdoor.status}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <DoorClosed className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Home Windows</span>
          </div>
          <p className={`mt-1 text-sm font-semibold ${verdict.windows.tone}`}>
            {verdict.windows.status}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Face Mask</span>
          </div>
          <p className={`mt-1 text-sm font-semibold ${verdict.mask.tone}`}>
            {verdict.mask.status}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Wind className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Air Purifier</span>
          </div>
          <p className={`mt-1 text-sm font-semibold ${verdict.purifier.tone}`}>
            {verdict.purifier.status}
          </p>
        </div>
      </div>

      {/* Best Time Window Today */}
      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Clock className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>Cleanest 3-hour window to step out or air rooms:</span>
        </div>
        <span className="text-sm font-semibold text-emerald-300">
          {report.safestWindow}
        </span>
      </div>

      {/* Plain-English "What's in the Air?" Breakdown */}
      <div className="mt-5">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          What&apos;s in the air right now?
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pollutants.map((item) => (
            <div
              key={item.techName}
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs font-semibold text-zinc-200">
                  {item.plainName}
                </dt>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${item.status.className}`}
                >
                  {item.status.label}
                </span>
              </div>
              <dd className="mt-1 text-xs text-zinc-400">{item.meaning}</dd>
              <dd className="mt-2 font-mono text-[11px] text-zinc-500">
                {item.techName}: {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Interactive Color-Coded 24-Hour Air Quality Timeline */}
      {report.hourlyForecast.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-zinc-200">
              <Activity
                className="h-3.5 w-3.5 text-zinc-400"
                aria-hidden="true"
              />
              Today&apos;s Hour-by-Hour Air Quality (tap or hover a bar)
            </span>
            <span className="text-zinc-400">
              {selectedPoint ? (
                <span className="font-medium text-zinc-100">
                  {formatHour12(selectedPoint.hourLabel)}: AQI{" "}
                  {selectedPoint.usAqi} ({getAqiShortWord(selectedPoint.usAqi)})
                </span>
              ) : (
                `Peak AQI today: ${peakAqi}`
              )}
            </span>
          </div>

          <div
            role="group"
            aria-label="24-hour air quality timeline"
            className="flex h-20 items-end gap-1 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5"
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
                  className="flex h-full flex-1 items-end focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                >
                  <span
                    className={`block w-full rounded-t-sm transition-all ${getBarColorByAqi(
                      point.usAqi,
                    )} ${
                      isSelected
                        ? "opacity-100 ring-1 ring-white"
                        : "opacity-75 hover:opacity-100"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 flex justify-between text-[11px] text-zinc-500">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>

          {/* Simple 4-Part Day Breakdown */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dayPeriods.map((period) => (
              <div
                key={period.label}
                className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2 text-xs"
              >
                <p className="font-medium text-zinc-300">{period.label}</p>
                <p className="text-[11px] text-zinc-500">{period.range}</p>
                <p className="mt-1 font-semibold text-zinc-100">
                  {period.avgAqi !== null
                    ? `AQI ${period.avgAqi} · ${getAqiShortWord(period.avgAqi)}`
                    : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy, Leaf, Share2, ShieldAlert } from "lucide-react";
import type { AirQualityPlan } from "@/lib/schemas";
import { ImpactExplainer } from "@/components/ImpactExplainer";

interface ActionPlanTabsProps {
  plan: AirQualityPlan;
  city: string;
}

type TabKey = "routine" | "indoor" | "alternatives";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "routine", label: "Low-Emission Routine" },
  { key: "indoor", label: "Indoor Air Hacks" },
  { key: "alternatives", label: "Sustainable Alternatives" },
];

export function ActionPlanTabs({ plan, city }: ActionPlanTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("routine");
  const [copied, setCopied] = useState<boolean>(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const allItems = [
    ...plan.lowEmissionRoutine,
    ...plan.indoorAirHacks,
    ...plan.sustainableAlternatives,
  ];

  const totalWeeklyCo2Kg = Number(
    allItems
      .reduce((sum, item) => sum + item.estimatedCo2SavedKgPerWeek, 0)
      .toFixed(1),
  );
  const maxPm25Reduction = Math.round(
    Math.max(0, ...allItems.map((item) => item.estimatedPm25ReductionPercent)),
  );

  const itemsByTab: Record<TabKey, AirQualityPlan["lowEmissionRoutine"]> = {
    routine: plan.lowEmissionRoutine,
    indoor: plan.indoorAirHacks,
    alternatives: plan.sustainableAlternatives,
  };

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveTab(TABS[nextIndex].key);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  async function handleCopyBrief() {
    const shareText = `Air Quality Action Brief (${city}):\n\n${plan.communityBrief}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-labelledby="action-plan-heading"
      aria-live="polite"
      className="space-y-5"
    >
      {/* Risk Summary & Aggregate Impact */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="action-plan-heading"
              className="flex items-center gap-2 text-lg font-semibold text-zinc-100"
            >
              <ShieldAlert
                className="h-5 w-5 text-emerald-400"
                aria-hidden="true"
              />
              Personalized Smog Risk Assessment
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {plan.riskSummary}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-3">
              <p className="text-xs text-zinc-400">Est. Weekly Savings</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-emerald-300">
                <Leaf className="h-4 w-4" aria-hidden="true" />
                {totalWeeklyCo2Kg} kg CO₂e
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-3">
              <p className="text-xs text-zinc-400">Peak Exposure Drop</p>
              <p className="mt-1 text-lg font-semibold text-sky-300">
                Up to {maxPm25Reduction}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WAI-ARIA Tabbed Action Plan */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6">
        <div
          role="tablist"
          aria-label="Air quality action categories"
          className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4"
        >
          {TABS.map((tab, index) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                id={`tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${tab.key}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isSelected
                    ? "bg-emerald-500 text-zinc-950"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                }`}
              >
                {tab.label} ({itemsByTab[tab.key].length})
              </button>
            );
          })}
        </div>

        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className="mt-5 space-y-4 focus-visible:outline-none"
        >
          {itemsByTab[activeTab].map((item, idx) => (
            <ImpactExplainer
              key={`${activeTab}-${item.title}`}
              item={item}
              index={idx}
            />
          ))}
        </div>
      </div>

      {/* Community Shareable Smog Brief */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-100">
            <Share2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Community Smog Brief (WhatsApp / RWA Ready)
          </h3>

          <button
            type="button"
            onClick={handleCopyBrief}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {copied ? (
              <>
                <Check
                  className="h-3.5 w-3.5 text-emerald-400"
                  aria-hidden="true"
                />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy Brief
              </>
            )}
          </button>
        </div>

        <p className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-relaxed text-zinc-300">
          {plan.communityBrief}
        </p>
      </div>
    </section>
  );
}

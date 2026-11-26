
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
      <div className="rounded-2xl border border-[#E5EBE6] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E5F1E8] px-3 py-1.5 text-xs font-medium text-[#176B4D]">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Personalised air quality insights
            </div>

            <h2
              id="action-plan-heading"
              className="text-xl font-semibold tracking-tight text-[#24352D] sm:text-2xl"
            >
              Your Smog Risk Assessment
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#68756D]">
              {plan.riskSummary}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3">
            <div className="min-w-0 rounded-xl border border-[#E5EBE6] bg-[#F7F9F5] px-4 py-3.5">
              <p className="text-xs font-medium text-[#68756D]">
                Est. Weekly Savings
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-[#176B4D]">
                <Leaf className="h-4 w-4 shrink-0" aria-hidden="true" />
                {totalWeeklyCo2Kg} kg CO₂e
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-[#E5EBE6] bg-[#F7F9F5] px-4 py-3.5">
              <p className="text-xs font-medium text-[#68756D]">
                Peak Exposure Drop
              </p>
              <p className="mt-2 text-lg font-semibold text-[#2876A8]">
                Up to {maxPm25Reduction}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Tabbed Action Plan */}
      <div className="rounded-2xl border border-[#E5EBE6] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold tracking-tight text-[#24352D]">
            Your Action Plan
          </h3>
          <p className="mt-1 text-sm text-[#87938A]">
            Practical steps to reduce exposure and make healthier choices.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Air quality action categories"
          className="flex flex-wrap gap-2 border-b border-[#E5EBE6] pb-4"
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
                className={`rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#237A57] focus-visible:ring-offset-2 ${
                  isSelected
                    ? "bg-[#176B4D] text-white shadow-sm"
                    : "border border-[#E5EBE6] bg-white text-[#68756D] hover:border-[#B8D4C1] hover:bg-[#F7F9F5] hover:text-[#176B4D]"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-75">
                  ({itemsByTab[tab.key].length})
                </span>
              </button>
            );
          })}
        </div>

        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className="mt-5 space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#237A57] focus-visible:ring-offset-2"
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

      {/* Community Shareable Brief */}
      <div className="rounded-2xl border border-[#E5EBE6] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F1E8]">
                <Share2
                  className="h-4 w-4 text-[#176B4D]"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#24352D]">
                  Community Smog Brief
                </h3>
                <p className="text-xs text-[#87938A]">
                  Ready to share with WhatsApp groups and RWAs
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyBrief}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#DCE7DE] bg-[#F7F9F5] px-4 py-2.5 text-sm font-medium text-[#176B4D] transition-colors hover:border-[#A9CBB4] hover:bg-[#E5F1E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#237A57] focus-visible:ring-offset-2 sm:self-auto"
          >
            {copied ? (
              <>
                <Check
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy Brief
              </>
            )}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[#E5EBE6] bg-[#F7F9F5] p-4 sm:p-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#536158]">
            {plan.communityBrief}
          </p>
        </div>
      </div>
    </section>
  );
}

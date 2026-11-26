import { Clock, HeartPulse, Leaf } from "lucide-react";
import type { ActionItem } from "@/lib/schemas";

interface ImpactExplainerProps {
  item: ActionItem;
  index: number;
}

export function ImpactExplainer({ item, index }: ImpactExplainerProps) {
  const pm25Reduction = Math.round(item.estimatedPm25ReductionPercent);
  const co2Saved = Number(item.estimatedCo2SavedKgPerWeek.toFixed(1));

  return (
    <article className="rounded-2xl border border-[#E5EBE6] bg-white p-4 transition-colors hover:border-[#C8DCCB] sm:p-5">
      {/* Action Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#DCE9DE] bg-[#F0F7F1] text-xs font-semibold text-[#176B4D]"
          >
            {index + 1}
          </span>

          <h3 className="pt-0.5 text-base font-semibold leading-snug text-[#24352D]">
            {item.title}
          </h3>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#E5EBE6] bg-[#F7F9F5] px-3 py-1.5 text-xs font-medium text-[#68756D] sm:max-w-[45%]">
          <Clock
            className="h-3.5 w-3.5 shrink-0 text-[#87938A]"
            aria-hidden="true"
          />
          <span>{item.timingOrFrequency}</span>
        </span>
      </div>

      {/* Action Description */}
      <p className="mt-4 text-sm leading-relaxed text-[#536158]">
        {item.action}
      </p>

      {/* Direct Impact Breakdown */}
      <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-[#E5EBE6] pt-4 sm:grid-cols-2">
        {/* Personal Health Impact */}
        <div className="rounded-xl border border-[#DCEAF3] bg-[#F1F7FB] p-3.5">
          <dt className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#2876A8]">
            <span className="inline-flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4" aria-hidden="true" />
              Personal Health Impact
            </span>

            {pm25Reduction > 0 && (
              <span className="rounded-md bg-[#E0EDF6] px-2 py-1 text-[11px] font-semibold text-[#24648E]">
                -{pm25Reduction}% PM2.5
              </span>
            )}
          </dt>

          <dd className="mt-2 text-xs leading-relaxed text-[#536B7A]">
            {item.healthImpact}
          </dd>
        </div>

        {/* Community Emission Impact */}
        <div className="rounded-xl border border-[#DCE9DE] bg-[#F0F7F1] p-3.5">
          <dt className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#176B4D]">
            <span className="inline-flex items-center gap-1.5">
              <Leaf className="h-4 w-4" aria-hidden="true" />
              Community Emission Impact
            </span>

            {co2Saved > 0 && (
              <span className="rounded-md bg-[#DDEEE0] px-2 py-1 text-[11px] font-semibold text-[#176B4D]">
                -{co2Saved} kg CO₂e/wk
              </span>
            )}
          </dt>

          <dd className="mt-2 text-xs leading-relaxed text-[#536B5D]">
            {item.emissionImpact}
          </dd>
        </div>
      </dl>
    </article>
  );
}

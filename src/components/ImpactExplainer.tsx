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
    <article className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300"
          >
            {index + 1}
          </span>
          <h3 className="text-base font-semibold text-zinc-100">
            {item.title}
          </h3>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          {item.timingOrFrequency}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        {item.action}
      </p>

      {/* Direct Impact Breakdown */}
      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-800/80 pt-4 sm:grid-cols-2">
        <div className="rounded-lg border border-sky-900/50 bg-sky-950/20 p-3">
          <dt className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-sky-300">
            <span className="inline-flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
              Personal Health Impact
            </span>
            {pm25Reduction > 0 && (
              <span className="rounded bg-sky-950 px-1.5 py-0.5 text-[11px] font-semibold text-sky-200">
                -{pm25Reduction}% PM2.5
              </span>
            )}
          </dt>
          <dd className="mt-1.5 text-xs leading-relaxed text-zinc-300">
            {item.healthImpact}
          </dd>
        </div>

        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3">
          <dt className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            <span className="inline-flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              Community Emission Impact
            </span>
            {co2Saved > 0 && (
              <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                -{co2Saved} kg CO₂e/wk
              </span>
            )}
          </dt>
          <dd className="mt-1.5 text-xs leading-relaxed text-zinc-300">
            {item.emissionImpact}
          </dd>
        </div>
      </dl>
    </article>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiCheck, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { PiRocketLaunchLight } from "react-icons/pi";
import type { OnboardingState } from "@/hooks/use-onboarding";

type Props = {
  onboarding: OnboardingState;
};

export function OnboardingChecklist({ onboarding }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { steps, completedCount, allDone, dismissed, dismissChecklist } = onboarding;

  if (dismissed || allDone) return null;

  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl bg-[#0e1628] border border-[#1e293b] shadow-2xl shadow-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e293b]/60">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 flex-shrink-0">
          <PiRocketLaunchLight className="text-cyan-400 text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm">Getting started</div>
          <div className="text-[#64748b] text-xs">
            {completedCount} of {steps.length} complete
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-[#64748b] hover:text-white rounded transition-colors"
            aria-label={expanded ? "Collapse checklist" : "Expand checklist"}
          >
            {expanded ? <FiChevronDown className="text-sm" /> : <FiChevronUp className="text-sm" />}
          </button>
          <button
            onClick={() => dismissChecklist()}
            className="p-1 text-[#64748b] hover:text-white rounded transition-colors"
            aria-label="Dismiss checklist"
          >
            <FiX className="text-sm" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#1e293b]">
        <div
          className="h-1 bg-gradient-to-r from-cyan-400 to-purple-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      {expanded && (
        <ul className="py-2">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.actionHref}
                className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                  step.done
                    ? "opacity-50 cursor-default pointer-events-none"
                    : "hover:bg-[#1e293b]/50"
                }`}
                tabIndex={step.done ? -1 : 0}
              >
                {/* Checkbox */}
                <span
                  className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    step.done
                      ? "bg-green-500/20 border-green-500/60"
                      : "border-[#334155] bg-[#0a0e1a]"
                  }`}
                >
                  {step.done && <FiCheck className="text-green-400 text-[10px]" />}
                </span>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium leading-snug ${
                      step.done ? "text-[#64748b] line-through" : "text-white"
                    }`}
                  >
                    {step.label}
                  </div>
                  {!step.done && (
                    <div className="text-xs text-[#475569] mt-0.5 leading-snug">
                      {step.description}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

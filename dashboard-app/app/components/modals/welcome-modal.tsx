"use client";

import React from "react";
import { FiX } from "react-icons/fi";
import { PiFolderOpenLight, PiMagnifyingGlassLight, PiChartBarLight, PiLightningLight } from "react-icons/pi";

type WelcomeModalProps = {
  open: boolean;
  onClose: () => void;
};

const features = [
  {
    icon: <PiFolderOpenLight className="text-2xl text-cyan-400" />,
    title: "Projects",
    description: "Add your websites and organise them into projects for easy management.",
  },
  {
    icon: <PiMagnifyingGlassLight className="text-2xl text-purple-400" />,
    title: "Accessibility Scans",
    description: "Run WCAG scans across all your pages and get detailed violation reports.",
  },
  {
    icon: <PiChartBarLight className="text-2xl text-cyan-400" />,
    title: "Reports & Insights",
    description: "Track your accessibility score over time and measure improvement.",
  },
  {
    icon: <PiLightningLight className="text-2xl text-purple-400" />,
    title: "Scheduled Scans",
    description: "Automate recurring scans so you always know when issues appear.",
  },
];

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0e1628] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#64748b] hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
          aria-label="Close welcome modal"
        >
          <FiX className="text-lg" />
        </button>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-[#1e293b]/50">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 mb-4">
            <img src="/logo-white.svg" alt="" className="h-7 w-auto brightness-0 invert opacity-90" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Ablelytics!</h2>
          <p className="text-[#94a3b8] text-sm leading-relaxed">
            Your accessibility monitoring platform. Here&apos;s a quick overview of what you can do.
          </p>
        </div>

        {/* Features grid */}
        <div className="px-8 py-6 grid grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-2 p-4 rounded-xl bg-[#0a0e1a] border border-[#1e293b]/60"
            >
              {f.icon}
              <div className="text-white font-semibold text-sm">{f.title}</div>
              <div className="text-[#64748b] text-xs leading-relaxed">{f.description}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-500 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-600/20"
          >
            Get Started
          </button>
          <p className="mt-3 text-xs text-[#475569]">
            Follow the checklist on the bottom-right to complete your setup.
          </p>
        </div>
      </div>
    </div>
  );
}

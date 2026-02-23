"use client";

import { createContext, useContext } from "react";
import type { OnboardingState } from "@/hooks/use-onboarding";

export const OnboardingContext = createContext<OnboardingState | null>(null);

export function useOnboardingContext(): OnboardingState | null {
  return useContext(OnboardingContext);
}

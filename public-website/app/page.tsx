"use client";

import { LoggedOutHeader } from "./components/organism/logged-out-header";
import { LoggedOutLayout } from "./components/organism/logged-out-layout";
import { LoggedOutFooter } from "./components/organism/logged-out-footer";
import { MainSections } from "./components/molecule/main-sections";
import { HomePageHeroSection } from "./components/sections/HomePage/hero";
import { HomePageFeaturesSection } from "./components/sections/HomePage/features";
import { HomePageSocialProofSection } from "./components/sections/HomePage/social-proof";
import { HomePageSummarySection } from "./components/sections/HomePage/summary";
import { HomePagePricingSection } from "./components/sections/HomePage/pricing";
import { HomePageFAQsSection } from "./components/sections/HomePage/faq";
import { HomePageCTASection } from "./components/sections/HomePage/cta";

import { motion, useReducedMotion } from "framer-motion";
import { useReveal } from "./libs/motion";
import { RevealSection } from "./components/molecule/reveal-section";

export default function Home() {
  const reveal = useReveal()

  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <MainSections>

        {/* HERO */}
        <RevealSection custom={0}>
          <HomePageHeroSection />
        </RevealSection>

        {/* SOCIAL PROOF & STATS */}
        <RevealSection custom={1}>
          <HomePageSocialProofSection />
        </RevealSection>

        {/* FEATURES */}
        <RevealSection custom={2}>
          <HomePageFeaturesSection />
        </RevealSection>

        {/* SUMMARY */}
        <RevealSection custom={3}>
          <HomePageSummarySection />
        </RevealSection>

        {/* PRICING */}
        <RevealSection custom={4}>
          <HomePagePricingSection />
        </RevealSection>

        {/* FAQ */}
        <RevealSection custom={5}>
          <HomePageFAQsSection />
        </RevealSection>

        {/* CTA */}
        <RevealSection custom={6}>
          <HomePageCTASection />
        </RevealSection>
      </MainSections>


      <LoggedOutFooter />
    </LoggedOutLayout>
  )
}

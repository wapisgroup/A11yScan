// src/pages/Pricing.jsx
import React from "react";
import LoggedOutFooter from "../components/organism/logged-out-footer";
import LoggedOutHeader from "../components/organism/logged-out-header";
import LoggedOutLayout from "../components/organism/logged-out-layout";
import { PricingPageHero } from "../components/sections/PricingPage/hero";
import { PricingPageTiers } from "../components/sections/PricingPage/tiers";
import { PricingPageComparation } from "../components/sections/PricingPage/comparation";
import { PricingPageFAQCta } from "../components/sections/PricingPage/faq_cta";
import { MainSections } from "../components/molecule/main-sections";

/**
 * Pricing page (public, logged-out)
 *
 * This component is content-only and is intended to be placed inside your
 * LoggedOutLayout wrapper which provides the LoggedOutHeader and LoggedOutFooter.
 *
 * Usage (example):
 *
 * <LoggedOutLayout>
 *   <LoggedOutHeader />
 *   <Pricing />
 *   <LoggedOutFooter />
 * </LoggedOutLayout>
 */
export default function PricingPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                {/* Hero */}
                <PricingPageHero />

                {/* Pricing tiers */}
                <PricingPageTiers />

                {/* Comparison table */}
                <PricingPageComparation />

                {/* FAQ & CTA */}
                <PricingPageFAQCta />

            </MainSections>
            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

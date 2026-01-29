// src/pages/Features.jsx
import React from 'react'
import LoggedOutLayout from "../components/organism/logged-out-layout";
import LoggedOutHeader from "../components/organism/logged-out-header";
import LoggedOutFooter from "../components/organism/logged-out-footer";
import { TitleText } from '../components/molecule/title-text';
import { FeaturesCoreCapabilitiesSection } from '../components/sections/FeaturesPage/core-capabilities';
import { FeaturesDeveloperAutomationSection } from '../components/sections/FeaturesPage/developer-automation';
import { FeaturesReportingSection } from '../components/sections/FeaturesPage/reporting';
import { FeaturesExamplesSection } from '../components/sections/FeaturesPage/examples';
import { FeaturesAccessibilityTestingSection } from '../components/sections/FeaturesPage/accessibility-testing';
import { FeaturesCTASection } from '../components/sections/FeaturesPage/cta';
import { MainSections } from '../components/molecule/main-sections';

/**
 * Features page (public)
 * - Tailwind-based and styled to match Home/Pricing/FAQ pages
 * - Intended to be wrapped by LoggedOutLayout / LoggedOutHeader / LoggedOutFooter
 *
 * Usage:
 * <LoggedOutLayout>
 *   <LoggedOutHeader />
 *   <Features />
 *   <LoggedOutFooter />
 * </LoggedOutLayout>
 */

export default function FeaturesPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                <header>
                    <TitleText title={`Features`}>Everything A11yScan can do — from full-site crawls to developer-friendly integrations and client-ready reports.</TitleText>
                </header>

                {/* Core capabilities */}
                <FeaturesCoreCapabilitiesSection/>

                {/* Developer & automation */}
                <FeaturesDeveloperAutomationSection/>

                {/* Reporting */}
                <FeaturesReportingSection/>

                {/* Accessibility & testing */}
                <FeaturesAccessibilityTestingSection/>

                {/* Examples / screenshots */}
                <FeaturesExamplesSection/>

                {/* CTA */}
                <FeaturesCTASection/>

            </MainSections>
            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

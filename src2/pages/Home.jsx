// src/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import LoggedOutHeader from "../components/organism/logged-out-header";
import LoggedOutFooter from "../components/organism/logged-out-footer";
import LoggedOutLayout from "../components/organism/logged-out-layout";
import { HomePageHeroSection } from '../components/sections/HomePage/hero';
import { HomePageFeaturesSection } from '../components/sections/HomePage/features';
import { HomePageSummarySection } from '../components/sections/HomePage/summary';
import { HomePagePricingSection } from '../components/sections/HomePage/pricing';
import { HomePageFAQsSection } from '../components/sections/HomePage/faq';
import { HomePageCTASection } from '../components/sections/HomePage/cta';
import { MainSections } from '../components/molecule/main-sections';

export default function Home() {
    useEffect(() => {
        document.title = 'A11yScan — Automated Website Accessibility Scanning'
    }, [])

 


    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                {/* HERO */}
                <HomePageHeroSection/>

                {/* FEATURES */}
                <HomePageFeaturesSection/>

                {/* SUMMARY */}
                <HomePageSummarySection/>

                {/* PRICING */}
                <HomePagePricingSection/>

                {/* FAQ */}
                <HomePageFAQsSection/>

                {/* CTA */}
                <HomePageCTASection/>
            </MainSections>

            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}
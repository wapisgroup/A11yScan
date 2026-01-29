// src/pages/FAQ.jsx
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { MainSections } from '../components/molecule/main-sections';
import { TitleText } from '../components/molecule/title-text';
import { FAQPageHelpSection } from '../components/sections/FaqsPage/still-need-help';
import { withTitlePostfix } from '../libs/metadata';
import { Metadata } from 'next';
import { FAQPageItemsSection } from '../components/sections/FaqsPage/items';
import { RevealSection } from "../components/molecule/reveal-section";

export const metadata: Metadata = withTitlePostfix(["FAQs"]);

export default function FAQPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />
            <MainSections>
                <RevealSection custom={0}>
                    <TitleText title={`Help & FAQ`}>Answers to common questions about scanning, reports, pricing and deployment.</TitleText>
                </RevealSection>
                <RevealSection custom={1}>
                    <FAQPageItemsSection />
                </RevealSection>

                <RevealSection custom={2}>
                    <FAQPageHelpSection />
                </RevealSection>

            </MainSections>
            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

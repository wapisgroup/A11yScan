// src/pages/Home.jsx
import {LoggedOutHeader} from "../components/organism/logged-out-header";
import {LoggedOutFooter} from "../components/organism/logged-out-footer";
import {LoggedOutLayout} from "../components/organism/logged-out-layout";
import { MainSections } from '../components/molecule/main-sections';
import { TitleText } from '../components/molecule/title-text';
import { TextBlock } from '../components/molecule/text-blocks';
import { withTitlePostfix } from "../libs/metadata";
import { Metadata } from "next";

export const metadata: Metadata = withTitlePostfix(["Cookies"]);

export default function CookiesPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                <p className='as-p3-text secondary-text-color'><em>Last updated: 13/01/2026</em></p>
                <TitleText title={`Cookies Policy`}/>

                <TextBlock title={`1. Purpose`}>
                    <p>
                        This Cookies Policy explains how Ablelytics uses cookies and similar technologies in accordance with GDPR and ePrivacy requirements.
                    </p>
                </TextBlock>

                <TextBlock title={`2. Categories of Cookies Used`}>
                    <p className='primary-text-color'><strong>Strictly Necessary Cookies</strong></p>
                    <p>Required for:</p>
                    <ul>
                        <li>User authentication</li>
                        <li>Session management</li>
                        <li>Core platform functionality</li>
                    </ul>
                    <p>These cookies cannot be disabled.</p>

                    <p className='primary-text-color'><strong>Analytics Cookies</strong></p>
                    <p>
                        Google Analytics is used to collect aggregated, anonymised usage data, including:
                    </p>
                    <ul>
                        <li>Page interactions</li>
                        <li>Session duration</li>
                        <li>Device and browser type</li>
                    </ul>
                    <p>Analytics cookies are set only where consent is provided.</p>

                    <p className='primary-text-color'><strong>Firebase Cookies</strong></p>
                    <p>Used to support:</p>
                    <ul>
                        <li>Secure login</li>
                        <li>Performance monitoring</li>
                        <li>Error detection</li>
                    </ul>
                </TextBlock>

                <TextBlock title={`3. Cookie Management`}>
                    <p>
                        Users may manage cookie preferences via browser settings or consent tools.
                    </p>
                    <p>
                        Disabling certain cookies may affect platform functionality.
                    </p>
                </TextBlock>

                <TextBlock title={`4. Policy Updates`}>
                    <p>
                        This policy may be updated to reflect regulatory, technical, or operational changes.
                    </p>
                </TextBlock>

                <TextBlock title={`5. Contact`}>
                    <p>Email: privacy@ablelytics.com</p>
                </TextBlock>

            </MainSections>

            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}
// src/pages/Home.jsx
import {LoggedOutHeader} from "../components/organism/logged-out-header";
import {LoggedOutFooter} from "../components/organism/logged-out-footer";
import {LoggedOutLayout} from "../components/organism/logged-out-layout";
import { MainSections } from '../components/molecule/main-sections';
import { TitleText } from '../components/molecule/title-text';
import { TextBlock } from '../components/molecule/text-blocks';
import { withTitlePostfix } from "../libs/metadata";
import { Metadata } from "next";

export const metadata: Metadata = withTitlePostfix(["Privacy policy"]);

export default function PrivacyPage() {

    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                <p className='as-p3-text secondary-text-color'><em>Last updated: 13/01/2026</em></p>
                <TitleText title={`Privacy Policy`}/>

                <TextBlock title={`1. Overview`}>
                    <p>
                        Ablelytics is committed to protecting personal data and ensuring compliance with the General Data Protection Regulation (EU) 2016/679 (“GDPR”).
                    </p>
                    <p>
                        This policy describes how personal data is collected, processed, and safeguarded.
                    </p>
                </TextBlock>

                <TextBlock title={`2. Categories of Personal Data`}>
                    <p className='primary-text-color'><strong>Account and Identity Data</strong></p>
                    <ul>
                        <li>Name</li>
                        <li>Email address</li>
                        <li>Account credentials (securely stored)</li>
                    </ul>

                    <p className='primary-text-color'><strong>Service Usage Data</strong></p>
                    <ul>
                        <li>Websites assessed</li>
                        <li>Accessibility scan results</li>
                        <li>Platform interaction data</li>
                    </ul>

                    <p className='primary-text-color'><strong>Billing Data</strong></p>
                    <ul>
                        <li>Billing contact details</li>
                        <li>Subscription status</li>
                    </ul>
                    <p>
                        Payment card details are processed and stored by the payment provider only.
                    </p>

                    <p className='primary-text-color'><strong>Technical Data</strong></p>
                    <ul>
                        <li>IP address</li>
                        <li>Device and browser metadata</li>
                        <li>Cookie identifiers</li>
                    </ul>
                </TextBlock>

                <TextBlock title={`3. Lawful Basis for Processing`}>
                    <p>Personal data is processed under one or more of the following lawful bases:</p>
                    <ul>
                        <li>Performance of a contract</li>
                        <li>Legal obligations</li>
                        <li>Legitimate interests</li>
                        <li>User consent (where applicable)</li>
                    </ul>
                </TextBlock>

                <TextBlock title={`4. Purpose of Processing`}>
                    <p>Personal data is used to:</p>
                    <ul>
                        <li>Deliver and maintain the Service</li>
                        <li>Generate accessibility assessment reports</li>
                        <li>Manage billing and subscriptions</li>
                        <li>Monitor performance and security</li>
                        <li>Provide support and service communications</li>
                    </ul>
                </TextBlock>

                <TextBlock title={`5. Third-Party Processors`}>
                    <p>Personal data may be processed by approved third parties, including:</p>
                    <ul>
                        <li>Google Analytics (usage analytics)</li>
                        <li>Firebase (authentication and infrastructure)</li>
                        <li>Payment service provider (to be specified)</li>
                    </ul>
                    <p>All processors operate under GDPR-compliant agreements.</p>
                </TextBlock>

                <TextBlock title={`6. Data Retention`}>
                    <p>
                        Data is retained only for as long as necessary to fulfil contractual, operational, and legal obligations.
                    </p>
                    <p>
                        Users may request deletion of personal data, subject to statutory requirements.
                    </p>
                </TextBlock>

                <TextBlock title={`7. Data Subject Rights`}>
                    <p>Under GDPR, Users have the right to:</p>
                    <ul>
                        <li>Access personal data</li>
                        <li>Rectify inaccurate data</li>
                        <li>Request erasure</li>
                        <li>Restrict or object to processing</li>
                        <li>Data portability</li>
                        <li>Withdraw consent at any time</li>
                    </ul>
                    <p>Requests may be submitted via email.</p>
                </TextBlock>

                <TextBlock title={`8. Security Measures`}>
                    <p>
                        Appropriate technical and organisational measures are implemented to protect personal data against unauthorised access, loss, or disclosure.
                    </p>
                </TextBlock>

                <TextBlock title={`9. Contact`}>
                    <p>Email: privacy@ablelytics.com</p>
                    <p>Registered address: [TO BE ADDED]</p>
                </TextBlock>

                

            </MainSections>

            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}
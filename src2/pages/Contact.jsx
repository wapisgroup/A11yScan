// src/pages/Contact.jsx
import React, { useState } from 'react'
import LoggedOutHeader from "../components/organism/logged-out-header";
import LoggedOutFooter from "../components/organism/logged-out-footer";
import LoggedOutLayout from "../components/organism/logged-out-layout";
import { MainSections } from '../components/molecule/main-sections';
import { TitleText } from '../components/molecule/title-text';
import { WhiteBox } from '../components/molecule/white-box';
import { ContactPageForm } from '../components/sections/ContactPage/form';
import { Button } from '../components/atom/button';
import { contactSales } from '../services/urlServices';


export default function ContactPage() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <MainSections>
                <TitleText title={`Contact sales & support`}>Have a question about pricing, deployment, integrations or need help with a scan? Send us a message and we'll get back within one business day.</TitleText>

                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-medium">
                    <WhiteBox largeRounded>
                        <ContactPageForm />
                    </WhiteBox>

                    <WhiteBox largeRounded extraClass='gap-medium'>
                        <div className='flex flex-col gap-small'>
                            <h4 className="as-h5-text primary-text-color">Prefer to talk?</h4>
                            <p className="as-p2-text secondary-text-color">Book a demo or drop us an email. If you'd like a demo
                                please provide a few available times in your message.</p>
                        </div>
                        <div>
                            <Button size='small' type='neutral' href={contactSales} title={`Email sales`} />
                        </div>
                        <div className="as-p2-text">
                            <div><strong>Support:</strong> support@a11yscan.example</div>
                            <div className="mt-2"><strong>Business hours:</strong> Mon–Fri, 09:00–17:00 (UTC)</div>
                        </div>

                        <div className="as-p3-text">We respond to sales enquiries within one
                            business day. For urgent support, email support@a11yscan.example.
                        </div>
                    </WhiteBox>
                </div>
            </MainSections>

            <LoggedOutFooter />
        </LoggedOutLayout>
    )
}

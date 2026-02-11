"use client";
import Link from "next/link"
import { contactSales, startTrial } from "../../../services/urlServices"
import { Button } from "../../atom/button"
import { WhiteBox } from "../../molecule/white-box"

export const PricingPageTiers = () => {
    return (
        <section className="">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Basic */}
                <WhiteBox largeRounded extraClass="justify-between gap-medium">
                    <div className="flex flex-col gap-medium">
                        <div className="flex flex-col gap-small">
                            <div className="as-p3-text secondary-text-color">Basic</div>
                            <div className="as-h1-text primary-text-color font-bold">$49 <span className="text-sm font-medium">/ mo</span></div>
                            <p className="as-p2-text secondary-text-color">For freelancers and small projects.</p>
                        </div>

                        <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                            <li>• 3 active projects</li>
                            <li>• 50 scans / month</li>
                            <li>• 100 pages / scan</li>
                            <li>• PDF reports + scheduled scans</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link  href={startTrial}>
                        <Button className="w-[100%] justify-center" variant="secondary" title={`Start free trial`} />
                        </Link>
                    </div>
                </WhiteBox>

                {/* Starter */}
                <WhiteBox largeRounded extraClass="justify-between gap-medium">
                    <div className="flex flex-col gap-medium">
                        <div className="flex flex-col gap-small">
                            <div className="as-p3-text secondary-text-color">Starter</div>
                            <div className="as-h1-text primary-text-color font-bold">$149 <span className="text-sm font-medium">/ mo</span></div>
                            <p className="as-p2-text secondary-text-color">For growing teams and agencies.</p>
                        </div>

                        <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                            <li>• 10 active projects</li>
                            <li>• 200 scans / month</li>
                            <li>• 500 pages / scan</li>
                            <li>• AI heuristics (metered)</li>
                            <li>• API + Slack notifications</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link href={startTrial} >
                        <Button className="w-[100%] justify-center" variant="primary" title={`Start free trial`} />
                        </Link>
                    </div>
                </WhiteBox>

                {/* Professional */}
                <WhiteBox largeRounded extraClass="justify-between gap-medium">
                    <div className="flex flex-col gap-medium">
                        <div className="flex flex-col gap-small">
                            <div className="as-p3-text secondary-text-color">Professional</div>
                            <div className="as-h1-text primary-text-color font-bold">$399 <span className="text-sm font-medium">/ mo</span></div>
                            <p className="as-p2-text secondary-text-color">For enterprises and large agencies.</p>
                        </div>

                        <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                            <li>• Unlimited projects</li>
                            <li>• 1,000 scans / month</li>
                            <li>• 2,000 pages / scan</li>
                            <li>• CI/CD + webhooks</li>
                            <li>• Advanced analytics</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link href={startTrial}>
                            <Button className="w-[100%] justify-center" variant="secondary" title={`Start free trial`}  />
                        </Link>
                    </div>
                </WhiteBox>

                {/* Enterprise */}
                <WhiteBox largeRounded extraClass="justify-between gap-medium">
                    <div className="flex flex-col gap-medium">
                        <div className="flex flex-col gap-small">
                            <div className="as-p3-text secondary-text-color">Enterprise</div>
                            <div className="as-h1-text primary-text-color font-bold">Custom</div>
                            <p className="as-p2-text secondary-text-color">Tailored limits, security, and support.</p>
                        </div>

                        <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                            <li>• Unlimited scans & pages</li>
                            <li>• SSO / SAML and on-prem</li>
                            <li>• Dedicated account manager</li>
                            <li>• Manual testing add-on</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link href={contactSales}>
                            <Button className="w-[100%] justify-center" variant="secondary" title={`Contact Sales`}  />
                        </Link>
                    </div>
                </WhiteBox>
               
            </div>
        </section>
    )
}
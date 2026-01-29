"use client";
import Link from "next/link"
import { startTrial } from "../../../services/urlServices"
import { Button } from "../../atom/button"
import { WhiteBox } from "../../molecule/white-box"

export const PricingPageTiers = () => {
    return (
        <section className="">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free */}
                <WhiteBox largeRounded extraClass="justify-between gap-medium">
                    <div className="flex flex-col gap-medium">
                        <div className="flex flex-col gap-small">
                            <div className="as-p3-text secondary-text-color">Free</div>
                            <div className="as-h1-text primary-text-color font-bold">€0 <span className="text-sm font-medium">/ mo</span></div>
                            <p className="as-p2-text secondary-text-color">Good for testing and small sites.</p>
                        </div>

                        <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                            <li>• 1 project</li>
                            <li>• Up to 200 pages / month</li>
                            <li>• 3 reports / month</li>
                            <li>• Basic rule set & PDF export</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link  href={startTrial}>
                        <Button className="w-[100%] justify-center" variant="secondary" title={`Start free`} />
                        </Link>
                    </div>
                </WhiteBox>

                {/* Team */}
                <WhiteBox largeRounded extraClass="justify-between gap-medium">
                    <div className="flex flex-col gap-medium">
                        <div className="flex flex-col gap-small">
                            <div className="as-p3-text secondary-text-color">Team</div>
                            <div className="as-h1-text primary-text-color font-bold">€49 <span className="text-sm font-medium">/ mo</span></div>
                            <p className="as-p2-text secondary-text-color">Designed for product and QA teams.</p>
                        </div>

                        <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                            <li>• Multiple projects</li>
                            <li>• 2,000 pages / month</li>
                            <li>• Scheduled scans</li>
                            <li>• Priority export & storage</li>
                            <li>• Webhooks & integrations</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link href={startTrial} >
                        <Button className="w-[100%] justify-center" variant="primary" title={`Get Team`} />
                        </Link>
                    </div>
                </WhiteBox>

                
                {/* Agency */}
                <WhiteBox largeRounded extraClass="justify-between gap-medium">
                    <div className="flex flex-col gap-medium">
                        <div className="flex flex-col gap-small">
                            <div className="as-p3-text secondary-text-color">Agency</div>
                            <div className="as-h1-text primary-text-color font-bold">€149 <span className="text-sm font-medium">/ mo</span></div>
                            <p className="as-p2-text secondary-text-color">Private deployments, SSO and audit support.</p>
                        </div>

                        <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                            <li>• Unlimited projects</li>
                        <li>• Private Cloud Run deployment</li>
                        <li>• SSO, SLAs & dedicated support</li>
                        <li>• White-label reports</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <Link href={startTrial}>
                            <Button className="w-[100%] justify-center" variant="secondary" title={`Contact Sales`}  />
                        </Link>
                    </div>
                </WhiteBox>
               
            </div>
        </section>
    )
}
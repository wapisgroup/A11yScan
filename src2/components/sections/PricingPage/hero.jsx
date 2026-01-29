import { contactSales, startTrial } from "../../../services/urlServices"
import { Button } from "../../atom/button"
import { ErrorStats } from "../../atom/error-stats"
import { FeaturePill } from "../../atom/feature-pill"
import { TitleText } from "../../molecule/title-text"
import { WhiteBox } from "../../molecule/white-box"

export const PricingPageHero = () => {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-large items-center">
            <div className="flex flex-col gap-large">
                <TitleText title={`Simple pricing for teams of every size`}>Scan whole websites, prioritize fixes by impact, and deliver client-ready PDF reports. Pick a plan that suits your workflow — start free, scale as you grow.</TitleText>

                <div className="flex flex-wrap gap-small">
                    <Button type="primary" title={`Start free`} href={startTrial} />
                    <Button type="neutral" title={`Contact sales`} href={contactSales} />
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 as-p2-text secondary-color-text">
                    <li className="flex gap-small"><span>✅</span> Chrome-accurate accessibility checks</li>
                    <li className="flex gap-small"><span>✅</span> Full-site crawling with throttling</li>
                    <li className="flex gap-small"><span>✅</span> Grouped issues and severity counts</li>
                    <li className="flex gap-small"><span>✅</span> Export PDF reports branded for your client</li>
                </ul>
            </div>

            <WhiteBox withShadow extraClass="gap-medium">
                <div className="flex gap-small items-center">
                    <FeaturePill>Example scan</FeaturePill>

                </div>

                <WhiteBox extraClass="gap-medium">
                    <h4 className="as-h5-text primary-text-color">Example — Royal Mail (summary)</h4>
                    <div className="as-p3-text secondary-text-color">Tested: https://www.royalmailpensionplan.co.uk · Aug 19, 2025</div>
                    <div className="grid gap-large py-[var(--spacing-m)] ">
                        <ErrorStats type="Critical" number={45} />
                        <ErrorStats type="Moderate" number={12} colorSet={2} />
                    </div>
                    <p className="as-p3-text secondary-text-color">
                        Export full PDF report or drill into per-page issues in the dashboard.
                    </p>
                </WhiteBox>
            </WhiteBox>
        </section>
    )
}
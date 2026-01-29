import { openSample, startTrial } from "../../../services/urlServices";
import { Button } from "../../atom/button";
import { ErrorStats } from "../../atom/error-stats";
import { FeaturePill } from "../../atom/feature-pill";
import { TitleText } from "../../molecule/title-text";
import { WhiteBox } from "../../molecule/white-box";

export function HomePageHeroSection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-large items-start">
            <div className="flex flex-col items-start gap-medium">
                <TitleText title={`Find accessibility issues across your whole website — fast.`}>Crawl complete websites with a Chrome-based engine, run up-to-date accessibility checks, and generate client-ready reports grouped by severity and rule.</TitleText>
                <div className="flex flex-wrap gap-medium">
                    <Button onClick={startTrial} type="primary" title={`Get started — Free trial`} />
                    <Button onClick={openSample} type="secondary" title={`See sample report`} />
                </div>
                <div className="as-p2-text text-slate-700">
                    <strong>Perfect for:</strong> Product teams, agencies, QA, and accessibility leads who need repeatable, auditable scans.
                </div>
            </div>

            <WhiteBox withShadow extraClass="gap-medium">
                <div className="flex gap-small items-center">
                    <FeaturePill>Full-site crawls</FeaturePill>
                    <FeaturePill>Chrome-accurate checks</FeaturePill>
                    <FeaturePill>Export PDF</FeaturePill>
                </div>

                <WhiteBox extraClass="gap-medium">
                    <h4 className="as-h5-text text-slate-800">Example — Royal Mail (summary)</h4>
                    <div className="as-p3-text text-slate-500">Tested: https://www.royalmailpensionplan.co.uk · Aug 19, 2025</div>
                    <div className="grid grid-cols-2 gap-large py-[var(--spacing-m)] ">
                        <ErrorStats type="Critical" number={45}/>
                        <ErrorStats type="Moderate" number={12} colorSet={2}/>
                    </div>
                    <p className="as-p3-text text-slate-500">
                        Download the full report as PDF or inspect per-page issues in the dashboard.
                    </p>
                </WhiteBox>
            </WhiteBox>
        </section>
    )
}
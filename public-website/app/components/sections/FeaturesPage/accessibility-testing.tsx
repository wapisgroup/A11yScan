import Link from "next/link"
import { Button } from "../../atom/button"
import { WhiteBox } from "../../molecule/white-box"

export const FeaturesAccessibilityTestingSection = () => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-large">
            <WhiteBox extraClass="gap-medium" largeRounded>  
                <h3 className="as-h5-title font-semibold primary-color-text">Accessibility-first design</h3>
                <p className="as-p2-text secondary-text-color">The report UI and exported PDFs follow accessibility best-practices — semantic markup, keyboard-friendly accordions and clear focus states. We also run checks that include ARIA, color contrast and keyboard navigation issues.</p>
                <div className="as-p2-text secondary-text-color">We recommend combining automated scans with manual testing for a complete audit (cognitive, usability, and AT testing).</div>
            </WhiteBox>

            <WhiteBox extraClass="gap-medium" largeRounded>
                <h3 className="font-semibold">Testing & quality</h3>
                <p className="as-p2-text secondary-text-color">Tests are executed in controlled Chrome instances and use the latest rule sets. You can run regression scans in CI to catch regressions before they reach production.</p>
                <div className="mt-4">
                    <Link href="/docs/testing">
                        <Button  title={`Developer testing guide`} variant="link"/>
                    </Link>
                </div>
            </WhiteBox>
        </section>
    )
}
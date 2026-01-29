import { FeatureBox } from "../../molecule/feature-box"
import { WhiteBox } from "../../molecule/white-box"

export const FeaturesCoreCapabilitiesSection = () => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-large">
            <FeatureBox title={`Full-site crawling`} text={`Breadth-first crawl with same-origin limits, configurable depth, max pages and polite throttling. Respect robots.txt or override for internal scans.`}/>
            <FeatureBox title={`Chrome-based checks`} text={`Runs accessibility rules inside a headless Chrome instance so results closely match real-browser behaviour and up-to-date rule sets.`}/>
            <FeatureBox title={`Severity grouping & prioritisation`} text={`Each issue is grouped by rule and given an impact (Critical / Serious / Moderate / Minor) so teams can prioritise remediation.`}/>
        </section>
    )
}
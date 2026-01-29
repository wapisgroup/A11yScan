import { FeatureBox } from "../../molecule/feature-box";
import { WhiteBox } from "../../molecule/white-box";

export function HomePageFeaturesSection() {
    return (
        <section id="features" className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-small">
            <div className="grid grid-cols-2 gap-small">
                <FeatureBox title={`Site-wide crawling`} text={`Breadth-first crawl with same-origin limits. Configure max pages, polite throttling, and depth to avoid overloading target sites.`}/>
                <FeatureBox title={`Chrome-accurate tests`} text={`Run browser-based checks with a headless Chrome runtime and the latest accessibility rules so findings match real users' browsers.`}/>
            </div>
            <FeatureBox title={`Client-ready reports`} text={`Beautiful PDF exports, grouped issues, severity counts and per-page accordions — perfect to share with clients and stakeholders.`}/>
            
        </section>
    )
}
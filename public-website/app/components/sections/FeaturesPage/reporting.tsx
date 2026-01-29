import { SectionTitle } from "../../atom/section-title"
import { FeatureBox } from "../../molecule/feature-box"

export const FeaturesReportingSection = () => {
    return (
        <section className="flex flex-col gap-medium">
            <SectionTitle title={`Reports & exports`} text={`Reports are designed for both developers and clients: a concise summary with grouped rule counts plus page-level details and node-level context for each issue.`}/>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-large">
                <FeatureBox title={`Summary & grouping`} text={`Group results by rule with occurrence counts and impact, perfect for stakeholder reporting and prioritisation.`} />
                <FeatureBox title={`Per-page drilldown`} text={`Page accordions show counts (Critical/Serious/Moderate/Minor) in the header and node-level details inside for developers to fix issues quickly.`} />
                <FeatureBox title={`PDF export & branding`} text={`Export client-ready PDFs with your logo, test metadata (date, URL) and clean layout. Perfect for handoff to clients or regulators.`} />
            </div>
        </section>
    )
}
import { SectionTitle } from "../../atom/section-title"
import { FeatureBox } from "../../molecule/feature-box"

export const FeaturesExamplesSection = () => {
    return (
        <section className="flex flex-col gap-medium">
            <SectionTitle title={`Examples`} text={`A few screenshots showing the report UI and sample pages.`}/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-large">
                <FeatureBox>Screenshot placeholder — Summary page</FeatureBox>
                <FeatureBox>Screenshot placeholder — Page detail with accordions</FeatureBox>
                <FeatureBox>Screenshot placeholder — PDF output preview</FeatureBox>
            </div>
        </section>
    )
}
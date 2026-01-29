import { SectionTitle } from "../../atom/section-title";
import { WhiteBox } from "../../molecule/white-box";
export const PricingPageComparation = () => {
    return (
        <section>
            <WhiteBox largeRounded extraClass="gap-medium">
                <SectionTitle title={`Feature comparison`} />
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left as-p2-text secondary-color-text">
                        <thead>
                            <tr className="">
                                <th className="p-[var(--spacing-s)] pl-0">Feature</th>
                                <th className="p-[var(--spacing-s)]">Free</th>
                                <th className="p-[var(--spacing-s)]">Team</th>
                                <th className="p-[var(--spacing-s)]">Agency</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Site-wide crawl</td><td className="p-[var(--spacing-s)]">✓</td><td className="p-[var(--spacing-s)]">✓</td><td className="p-[var(--spacing-s)]">✓</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Scheduled scans</td><td className="p-[var(--spacing-s)]">—</td><td className="p-[var(--spacing-s)]">✓</td><td className="p-[var(--spacing-s)]">✓</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Pages / month</td><td className="p-[var(--spacing-s)]">200</td><td className="p-[var(--spacing-s)]">2,000</td><td className="p-[var(--spacing-s)]">Unlimited</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">PDF exports</td><td className="p-[var(--spacing-s)]">✓</td><td className="p-[var(--spacing-s)]">✓ (priority)</td><td className="p-[var(--spacing-s)]">✓ (white-label)</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Integrations</td><td className="p-[var(--spacing-s)]">Basic</td><td className="p-[var(--spacing-s)]">Webhooks, APIs</td><td className="p-[var(--spacing-s)]">Enterprise Connectors</td></tr>
                        </tbody>
                    </table>
                </div>

            </WhiteBox>
        </section>
    )
}
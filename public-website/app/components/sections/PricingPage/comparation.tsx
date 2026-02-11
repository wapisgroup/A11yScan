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
                                <th className="p-[var(--spacing-s)]">Basic</th>
                                <th className="p-[var(--spacing-s)]">Starter</th>
                                <th className="p-[var(--spacing-s)]">Professional</th>
                                <th className="p-[var(--spacing-s)]">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Active projects</td><td className="p-[var(--spacing-s)]">3</td><td className="p-[var(--spacing-s)]">10</td><td className="p-[var(--spacing-s)]">Unlimited</td><td className="p-[var(--spacing-s)]">Unlimited</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Scans / month</td><td className="p-[var(--spacing-s)]">50</td><td className="p-[var(--spacing-s)]">200</td><td className="p-[var(--spacing-s)]">1,000</td><td className="p-[var(--spacing-s)]">Custom</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Pages / scan</td><td className="p-[var(--spacing-s)]">100</td><td className="p-[var(--spacing-s)]">500</td><td className="p-[var(--spacing-s)]">2,000</td><td className="p-[var(--spacing-s)]">Custom</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Report history</td><td className="p-[var(--spacing-s)]">30 days</td><td className="p-[var(--spacing-s)]">90 days</td><td className="p-[var(--spacing-s)]">365 days</td><td className="p-[var(--spacing-s)]">Custom</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">Scheduled scans</td><td className="p-[var(--spacing-s)]">1 active</td><td className="p-[var(--spacing-s)]">10 active</td><td className="p-[var(--spacing-s)]">Unlimited</td><td className="p-[var(--spacing-s)]">Unlimited</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">API + webhooks</td><td className="p-[var(--spacing-s)]">—</td><td className="p-[var(--spacing-s)]">✓</td><td className="p-[var(--spacing-s)]">✓</td><td className="p-[var(--spacing-s)]">✓</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">AI heuristics</td><td className="p-[var(--spacing-s)]">—</td><td className="p-[var(--spacing-s)]">Metered</td><td className="p-[var(--spacing-s)]">Higher limits</td><td className="p-[var(--spacing-s)]">Custom</td></tr>
                            <tr className="border-t border-black/5"><td className="p-[var(--spacing-s)] pl-0">SSO / on-prem</td><td className="p-[var(--spacing-s)]">—</td><td className="p-[var(--spacing-s)]">—</td><td className="p-[var(--spacing-s)]">—</td><td className="p-[var(--spacing-s)]">✓</td></tr>
                        </tbody>
                    </table>
                </div>

            </WhiteBox>
        </section>
    )
}
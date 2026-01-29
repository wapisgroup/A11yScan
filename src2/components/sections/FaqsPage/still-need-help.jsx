import { contactSales } from "../../../services/urlServices"
import { Button } from "../../atom/button"
import { WhiteBox } from "../../molecule/white-box"

export const FAQPageHelpSection = () => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-medium">
            <WhiteBox largeRounded extraClass="gap-medium">
                <h3 className="as-h5-text primary-text-color">Still need help?</h3>
                <p className="as-p2-text secondary-text-color">If you can’t find the answer, reach out and our team will
                    help with setup, deployment or advanced rule tuning.</p>
                <div>
                    <Button type="primary" title={`Contact support`} href={contactSales}/>
                </div>
            </WhiteBox>

            <WhiteBox largeRounded extraClass="gap-medium">
                <h4 className="as-h5-text primary-text-color">Resources</h4>
                <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                    <li><a href="/docs" className="underline">Documentation & developer
                        guide</a></li>
                    <li><a href="/sample-report" className="underline">View a sample
                        report</a></li>
                    <li><a href="/pricing" className="underline">Plans & pricing</a></li>
                </ul>
            </WhiteBox>
        </section>
    )
}
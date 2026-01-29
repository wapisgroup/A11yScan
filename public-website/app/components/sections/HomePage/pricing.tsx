import Link from "next/link";
import { contactSales, startTrial } from "../../../services/urlServices";
import { Button } from "../../atom/button";
import { WhiteBox } from "../../molecule/white-box";

export function HomePagePricingSection() {
    return (
        <section id="pricing" className="grid grid-cols-1 md:grid-cols-3 gap-small">
            <WhiteBox extraClass="gap-medium justify-between p-[20px]">
                <div className="flex flex-col gap-small">
                    <h4 className="as-h4-text text-slate-800 ">Free / Trial</h4>
                    <div className="as-h2-text text-slate-900 ">€0</div>
                    <div className="as-p2-text text-slate-600">1 project, up to 200 pages, 3 reports/month</div>
                </div>
                <div>
                    <Link href={startTrial}>
                        <Button variant="primary" title={`Start free`} />
                    </Link>
                </div>
            </WhiteBox>

            <WhiteBox extraClass="gap-medium justify-between p-[20px]">
                <div className="flex flex-col gap-small">
                    <h4 className="as-h4-text text-slate-800 ">Team</h4>
                    <div className="as-h2-text text-slate-900 ">€49 / mo</div>
                    <div className="as-p2-text text-slate-600">Multiple projects, scheduled scans, 2k pages/month</div>
                </div>
                <div>
                    <Link href={contactSales}>
                        <Button variant="primary" title={`Get Team`} />
                    </Link>
                </div>
            </WhiteBox>

            <WhiteBox extraClass="gap-medium justify-between p-[20px]">
                <div className="flex flex-col gap-small">
                    <h4 className="as-h4-text text-slate-800 ">Agency</h4>
                    <div className="as-h2-text text-slate-900 ">Contact</div>
                    <div className="as-p2-text text-slate-600">Private deployment, SSO, audit support</div>
                </div>
                <div>
                    <Link href={contactSales}>
                        <Button variant="primary" title={`Contact Sales`} />
                    </Link>
                </div>
            </WhiteBox >
        </section >
    )
}
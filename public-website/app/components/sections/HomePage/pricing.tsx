import Link from "next/link";
import { startTrial } from "../../../services/urlServices";
import { Button } from "../../atom/button";
import { WhiteBox } from "../../molecule/white-box";

export function HomePagePricingSection() {
    return (
        <section id="pricing" className="grid grid-cols-1 md:grid-cols-3 gap-small">
            <WhiteBox extraClass="gap-medium justify-between p-[20px]">
                <div className="flex flex-col gap-small">
                    <h4 className="as-h4-text text-slate-800 ">Basic</h4>
                    <div className="as-h2-text text-slate-900 ">$49 / mo</div>
                    <div className="as-p2-text text-slate-600">3 projects, 50 scans/month, 100 pages/scan</div>
                </div>
                <div>
                    <Link href={startTrial}>
                        <Button variant="primary" title={`Start free trial`} />
                    </Link>
                </div>
            </WhiteBox>

            <WhiteBox extraClass="gap-medium justify-between p-[20px]">
                <div className="flex flex-col gap-small">
                    <h4 className="as-h4-text text-slate-800 ">Starter</h4>
                    <div className="as-h2-text text-slate-900 ">$149 / mo</div>
                    <div className="as-p2-text text-slate-600">10 projects, 200 scans/month, AI heuristics</div>
                </div>
                <div>
                    <Link href={startTrial}>
                        <Button variant="primary" title={`Start free trial`} />
                    </Link>
                </div>
            </WhiteBox>

            <WhiteBox extraClass="gap-medium justify-between p-[20px]">
                <div className="flex flex-col gap-small">
                    <h4 className="as-h4-text text-slate-800 ">Professional</h4>
                    <div className="as-h2-text text-slate-900 ">$399 / mo</div>
                    <div className="as-p2-text text-slate-600">Unlimited projects, 1,000 scans/month</div>
                </div>
                <div>
                    <Link href={startTrial}>
                        <Button variant="primary" title={`Start free trial`} />
                    </Link>
                </div>
            </WhiteBox >
        </section >
    )
}
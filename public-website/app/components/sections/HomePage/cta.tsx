import Link from "next/link";
import { openSample, startTrial } from "../../../services/urlServices";
import { Button } from "../../atom/button";

export function HomePageCTASection() {
    return (
        <section className="bg-gradient-to-r from-purple-50 to-cyan-50 p-[var(--spacing-l)] rounded-xl border border-slate-100">
            <div className="flex flex-col sm:gap-small md:flex-row items-center justify-between gap-large md:gap-medium">
                <div className="flex flex-col gap-medium md:w-[80%]">
                    <h3 className="as-h4-text primary-text-color">Start scanning today</h3>
                    <p className="as-p1-text secondary-text-color">Try Ablelytics free — create your first project and generate a report in minutes.</p>
                </div>
                <div className="flex flex-col items-center gap-large md:flex-row md:items-start md:gap-medium ">
                    <Link href={startTrial}>
                        <Button title={`Get started — Free trial`}/>
                    </Link>
                    <Link href={openSample}>
                        <Button title={`See sample report`} variant="neutral"/>
                    </Link>
                </div>
            </div>
        </section>
    )
}
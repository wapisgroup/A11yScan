import { openSample, startTrial } from "../../../services/urlServices";
import { Button } from "../../atom/button";

export function HomePageCTASection() {
    return (
        <section className="bg-gradient-to-r from-purple-50 to-cyan-50 p-[var(--spacing-l)] rounded-xl border border-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-small">
                <div className="flex flex-col gap-medium w-[80%]">
                    <h3 className="as-h4-text primary-text-color">Start scanning today</h3>
                    <p className="as-p1-text secondary-text-color">Try A11yScan free — create your first project and generate a report in minutes.</p>
                </div>
                <div className="flex gap-medium">
                    <Button onClick={startTrial} title={`Get started — Free trial`}/>
                    <Button onClick={openSample} title={`See sample report`} type="neutral"/>
                </div>
            </div>
        </section>
    )
}
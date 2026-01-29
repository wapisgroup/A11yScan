import { openSample, startTrial } from "../../../services/urlServices"
import { Button } from "../../atom/button"

export const FeaturesCTASection = () => {
    return (
        <section className="bg-gradient-to-r from-purple-50 to-cyan-50 p-[var(--spacing-l)] rounded-xl border border-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-small">
                <div className="flex flex-col gap-medium w-[60%]">
                    <h3 className="as-h4-text primary-text-color">Want to see it in action?</h3>
                    <p className="as-p2-text secondary-text-color">Create a free account and run your first scan — no credit card required.</p>
                </div>
                <div className="flex gap-medium">
                    <Button onClick={startTrial} title={`Start free`}/>
                    <Button onClick={openSample} title={`See pricing`} type="neutral"/>
                </div>
            </div>
        </section>
    )
}
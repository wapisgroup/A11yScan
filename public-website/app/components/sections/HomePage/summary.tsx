import { FeatureBox } from "../../molecule/feature-box";
import { WhiteBox } from "../../molecule/white-box";

export function HomePageSummarySection() {
    return (
        <section className="grid lg:grid-cols-[2fr_1fr] gap-medium">
            <div className="flex gap-medium flex-col">
                <div className="flex flex-col gap-medium">
                    <h3 className="as-h4-text text-slate-800 ">How the report presents results</h3>
                    <p className="as-p2-text text-slate-600 max-w-prose">
                        Errors are grouped by rule with occurrence counts. Each page has an accordion with counts of Critical / Serious / Moderate / Minor issues in the header so you can triage quickly.
                    </p>
                </div>

                <div className="max-w-[calc(100vw-68px)] md:max-w-[100%] overflow-x-auto">
                    <table className="min-w-full text-left bg-white min-w-[600px]">
                        <thead>
                            <tr className="text-slate-500">
                                <th className="as-p2-text font-bold p-[10px]">Error ID</th>
                                <th className="as-p2-text font-bold p-[10px]">Description</th>
                                <th className="as-p2-text font-bold p-[10px]">Impact</th>
                                <th className="as-p2-text font-bold p-[10px]">Occurrences</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-slate-100 ">
                                <td className="as-p2-text whitespace-nowrap text-slate-700 p-[10px] ">document-title</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">Ensures each HTML document contains a non-empty &lt;title&gt;</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">moderate</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">74</td>
                            </tr>
                            <tr className="border-t border-slate-100 ">
                                <td className="as-p2-text whitespace-nowrap text-slate-700 p-[10px] ">color-contrast</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">Ensures the contrast between foreground and background meets WCAG 2 AA contrast ratio thresholds</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">serious</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">23</td>
                            </tr>
                            <tr className="border-t border-slate-100 ">
                                <td className="as-p2-text whitespace-nowrap text-slate-700 p-[10px] ">image-alt</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">Ensures &lt;img&gt; elements have alternate text</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">critical</td>
                                <td className="as-p2-text  text-slate-700 p-[10px] ">18</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <aside>
                <FeatureBox title={`Actionable grouping`} text={`Group errors by rule, see how often they appear, and prioritize fixes by impact.`}>
                    <div>
                        <a href="/sample-report" className="as-p2-text text-cyan-600 underline">View sample report</a>
                    </div>
                </FeatureBox>
            </aside>

        </section>
    )
}
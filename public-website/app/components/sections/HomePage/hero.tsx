import Link from "next/link";
import { openSample, startTrial } from "../../../services/urlServices";
import { Button } from "../../atom/button";
import { ErrorStats } from "../../atom/error-stats";
import { FeaturePill } from "../../atom/feature-pill";
import { TitleText } from "../../molecule/title-text";
import { WhiteBox } from "../../molecule/white-box";

export function HomePageHeroSection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-large items-start">
            <div className="flex flex-col items-start gap-medium">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full mb-2">
                    <span className="text-xs font-semibold text-purple-700">★ Trusted by agencies worldwide</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight text-slate-900 tracking-tight">
                    Website Accessibility Testing Built for Scale
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                    Automatically scan entire websites for WCAG compliance issues. Get detailed reports, track progress over time, and deliver client-ready documentation — all in one platform.
                </p>
                <div className="flex flex-wrap gap-medium mt-4">
                    <Link href={startTrial}>
                        <Button variant="primary" title={`Start Free Trial`} />
                    </Link>
                    <Link href={openSample}>
                        <Button variant="secondary" title={`View Sample Report`} />
                    </Link>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-slate-200 w-full">
                    <div>
                        <div className="text-3xl font-bold text-slate-900">10K+</div>
                        <div className="text-sm text-slate-600">Pages Scanned Daily</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900">98%</div>
                        <div className="text-sm text-slate-600">Issue Detection Rate</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900">24/7</div>
                        <div className="text-sm text-slate-600">Automated Monitoring</div>
                    </div>
                </div>
            </div>

            <WhiteBox withShadow extraClass="gap-medium">
                <div className="flex gap-small items-center flex-wrap">
                    <FeaturePill>Full-Site Crawling</FeaturePill>
                    <FeaturePill>WCAG 2.1 AA/AAA</FeaturePill>
                    <FeaturePill>PDF Reports</FeaturePill>
                    <FeaturePill>API Access</FeaturePill>
                </div>

                <WhiteBox extraClass="gap-medium border-l-4 border-l-purple-500">
                    <h4 className="as-h5-text text-slate-800">Real Example Scan</h4>
                    <div className="as-p3-text text-slate-500 font-mono">https://www.royalmailpensionplan.co.uk</div>
                    <div className="as-p3-text text-slate-400">Scanned: 156 pages · 2,341 elements tested</div>
                    <div className="grid grid-cols-2 gap-large py-[var(--spacing-m)]">
                        <ErrorStats type="Critical" number={45} />
                        <ErrorStats type="Moderate" number={12} colorSet={2} />
                    </div>
                    <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-lg">
                        <div className="text-xs font-semibold text-slate-700 uppercase">Key Issues Found</div>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Missing alt text on 23 images</li>
                            <li>• Color contrast failures (18 instances)</li>
                            <li>• 4 forms without proper labels</li>
                        </ul>
                    </div>
                    <div className="flex gap-2">
                        <Link href={openSample} className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                            View Full Report →
                        </Link>
                    </div>
                </WhiteBox>
            </WhiteBox>
        </section>
    )
}
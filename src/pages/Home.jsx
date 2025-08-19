// src/pages/Home.jsx
import React, { useEffect, useState } from 'react'

export default function Home(){
    useEffect(()=>{ document.title = 'A11yScan — Automated Website Accessibility Scanning' },[])

    const startTrial = ()=> window.location.href = '/signup'
    const openSample = ()=> window.open('/sample-report', '_blank')
    const contactSales = ()=> window.location.href = 'mailto:sales@a11yscan.example?subject=Demo%20request%20for%20A11yScan'

    const [openFaq, setOpenFaq] = useState(null)
    const toggleFaq = (i)=> setOpenFaq(openFaq === i ? null : i)

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
            <div className="max-w-[1100px] mx-auto px-6 py-10">
                <header className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg">A</div>
                        <div>
                            <h1 className="text-lg font-semibold">A11yScan</h1>
                            <div className="text-sm text-slate-400">Automated accessibility scanning</div>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 text-slate-400">
                        <a href="#features" className="hover:text-white">Features</a>
                        <a href="#pricing" className="hover:text-white">Pricing</a>
                        <a href="#faq" className="hover:text-white">FAQ</a>
                        <a href="#contact" className="hover:text-white">Contact</a>
                        <a href="/login" className="ml-4 px-3 py-1 rounded-md border border-white/5 text-slate-300 hover:bg-white/5">Log in</a>
                    </nav>
                </header>

                {/* HERO */}
                <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div>
                        <h2 className="text-4xl font-extrabold leading-tight">Find accessibility issues across your whole website — fast.</h2>
                        <p className="mt-4 text-slate-400 max-w-prose">Crawl complete websites with a Chrome-based engine, run up-to-date accessibility checks, and generate client-ready reports grouped by severity and rule.</p>

                        <div className="mt-6 flex flex-wrap gap-4">
                            <button onClick={startTrial} className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-cyan-400 text-slate-900 font-semibold px-4 py-2 rounded-lg shadow-lg">Get started — Free trial</button>
                            <button onClick={openSample} className="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-white/10 text-slate-300">See sample report</button>
                        </div>

                        <div className="mt-4 text-slate-400"> <strong>Perfect for:</strong> Product teams, agencies, QA, and accessibility leads who need repeatable, auditable scans.</div>
                    </div>

                    <aside className="bg-white/3 border border-white/5 rounded-2xl p-5 shadow-xl">
                        <div className="flex gap-3 items-center mb-4">
                            <div className="px-3 py-1 bg-white/5 rounded-md text-sm font-semibold">Full-site crawls</div>
                            <div className="px-3 py-1 bg-white/5 rounded-md text-sm font-semibold">Chrome-accurate checks</div>
                            <div className="px-3 py-1 bg-white/5 rounded-md text-sm font-semibold">Export PDF</div>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold">Example — Royal Mail (summary)</h4>
                            <div className="text-xs text-slate-400 mt-1">Tested: https://www.royalmailpensionplan.co.uk · Aug 19, 2025</div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between text-sm text-slate-300"><span className="text-slate-400">Critical</span><strong>18</strong></div>
                                    <div className="h-2 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full mt-2" style={{width:'80%'}} />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm text-slate-300"><span className="text-slate-400">Moderate</span><strong>124</strong></div>
                                    <div className="h-2 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full mt-2" style={{width:'60%'}} />
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-slate-400">Download the full report as PDF or inspect per-page issues in the dashboard.</p>
                        </div>
                    </aside>
                </section>

                {/* FEATURES */}
                <section id="features" className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/3 border border-white/5 rounded-xl p-5">
                        <h3 className="font-semibold">Site-wide crawling</h3>
                        <p className="mt-2 text-slate-400 text-sm">Breadth-first crawl with same-origin limits. Configure max pages, polite throttling, and depth to avoid overloading target sites.</p>
                    </div>

                    <div className="bg-white/3 border border-white/5 rounded-xl p-5">
                        <h3 className="font-semibold">Chrome-accurate tests</h3>
                        <p className="mt-2 text-slate-400 text-sm">Run browser-based checks with a headless Chrome runtime and the latest accessibility rules so findings match real users' browsers.</p>
                    </div>

                    <div className="bg-white/3 border border-white/5 rounded-xl p-5">
                        <h3 className="font-semibold">Client-ready reports</h3>
                        <p className="mt-2 text-slate-400 text-sm">Beautiful PDF exports, grouped issues, severity counts and per-page accordions — perfect to share with clients and stakeholders.</p>
                    </div>
                </section>

                {/* SUMMARY */}
                <section className="mt-8 md:flex md:gap-6">
                    <div className="md:flex-1">
                        <h3 className="text-lg font-semibold">How the report presents results</h3>
                        <p className="text-slate-400 mt-2 max-w-prose">Errors are grouped by rule with occurrence counts. Each page has an accordion with counts of Critical / Serious / Moderate / Minor issues in the header so you can triage quickly.</p>

                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                <tr className="text-slate-400 text-xs">
                                    <th className="px-3 py-2">Error ID</th>
                                    <th className="px-3 py-2">Description</th>
                                    <th className="px-3 py-2">Impact</th>
                                    <th className="px-3 py-2">Occurrences</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr className="border-t border-white/5">
                                    <td className="px-3 py-3">document-title</td>
                                    <td className="px-3 py-3">Ensures each HTML document contains a non-empty &lt;title&gt;</td>
                                    <td className="px-3 py-3">moderate</td>
                                    <td className="px-3 py-3">74</td>
                                </tr>
                                <tr className="border-t border-white/5">
                                    <td className="px-3 py-3">color-contrast</td>
                                    <td className="px-3 py-3">Ensures the contrast between foreground and background meets WCAG 2 AA contrast ratio thresholds</td>
                                    <td className="px-3 py-3">serious</td>
                                    <td className="px-3 py-3">23</td>
                                </tr>
                                <tr className="border-t border-white/5">
                                    <td className="px-3 py-3">image-alt</td>
                                    <td className="px-3 py-3">Ensures &lt;img&gt; elements have alternate text</td>
                                    <td className="px-3 py-3">critical</td>
                                    <td className="px-3 py-3">18</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <aside className="mt-6 md:mt-0 md:w-80">
                        <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                            <h4 className="font-semibold">Actionable grouping</h4>
                            <p className="mt-2 text-slate-400 text-sm">Group errors by rule, see how often they appear, and prioritize fixes by impact.</p>
                            <div className="mt-3"><a href="/sample-report" className="text-cyan-200 underline">View sample report</a></div>
                        </div>
                    </aside>
                </section>

                {/* PRICING */}
                <section id="pricing" className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/3 border border-white/5 rounded-xl p-5">
                        <h4 className="font-semibold">Free / Trial</h4>
                        <div className="text-2xl font-extrabold mt-2">€0</div>
                        <div className="text-slate-400 mt-1">1 project, up to 200 pages, 3 reports/month</div>
                        <div className="mt-4"><button className="bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 rounded-lg text-slate-900 font-semibold" onClick={startTrial}>Start free</button></div>
                    </div>

                    <div className="bg-white/3 border border-white/5 rounded-xl p-5">
                        <h4 className="font-semibold">Team</h4>
                        <div className="text-2xl font-extrabold mt-2">€49 / mo</div>
                        <div className="text-slate-400 mt-1">Multiple projects, scheduled scans, 2k pages/month</div>
                        <div className="mt-4"><button className="bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 rounded-lg text-slate-900 font-semibold" onClick={contactSales}>Get Team</button></div>
                    </div>

                    <div className="bg-white/3 border border-white/5 rounded-xl p-5">
                        <h4 className="font-semibold">Agency</h4>
                        <div className="text-2xl font-extrabold mt-2">Contact</div>
                        <div className="text-slate-400 mt-1">Private deployment, SSO, audit support</div>
                        <div className="mt-4"><button className="bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 rounded-lg text-slate-900 font-semibold" onClick={contactSales}>Contact Sales</button></div>
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="mt-10">
                    <h3 className="text-lg font-semibold">FAQ</h3>

                    <div className="mt-4 space-y-3">
                        <div className="border border-white/5 rounded-lg overflow-hidden">
                            <button onClick={()=>toggleFaq(0)} className="w-full px-4 py-3 flex items-center justify-between bg-transparent">
                                <span>How accurate is the scanner compared to a manual accessibility audit?</span>
                                <span className="text-slate-400">{openFaq===0? '−' : '+'}</span>
                            </button>
                            <div className={`px-4 pb-4 text-slate-400 ${openFaq===0? 'block' : 'hidden'}`}>
                                A11yScan reliably detects many programmatic accessibility issues (alt text, ARIA, contrast, keyboard focus). Manual audits are still necessary for nuanced, context-dependent checks and assistive-technology testing. A11yScan reduces manual effort by surfacing hotspots for human review.
                            </div>
                        </div>

                        <div className="border border-white/5 rounded-lg overflow-hidden">
                            <button onClick={()=>toggleFaq(1)} className="w-full px-4 py-3 flex items-center justify-between bg-transparent">
                                <span>Can I run the scanner on a staging site?</span>
                                <span className="text-slate-400">{openFaq===1? '−' : '+'}</span>
                            </button>
                            <div className={`px-4 pb-4 text-slate-400 ${openFaq===1? 'block' : 'hidden'}`}>
                                Yes — point A11yScan to any publicly reachable domain. For private staging, run the worker on your network or use a secure tunnel. We also support private Cloud Run deployments.
                            </div>
                        </div>

                        <div className="border border-white/5 rounded-lg overflow-hidden">
                            <button onClick={()=>toggleFaq(2)} className="w-full px-4 py-3 flex items-center justify-between bg-transparent">
                                <span>Does the scanner respect robots.txt and rate limits?</span>
                                <span className="text-slate-400">{openFaq===2? '−' : '+'}</span>
                            </button>
                            <div className={`px-4 pb-4 text-slate-400 ${openFaq===2? 'block' : 'hidden'}`}>
                                Yes. The crawler respects robots.txt (configurable) and uses polite throttling. Configure delays and maximum pages per run to suit your needs.
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="mt-10 bg-gradient-to-r from-purple-800/10 to-cyan-600/5 p-6 rounded-xl border border-white/5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Start scanning today</h3>
                            <p className="text-slate-400 mt-1">Try A11yScan free — create your first project and generate a report in minutes.</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-gradient-to-r from-purple-600 to-cyan-400 px-4 py-2 rounded-lg text-slate-900 font-semibold" onClick={startTrial}>Get started — Free trial</button>
                            <button className="px-4 py-2 rounded-lg border border-white/10 text-slate-300" onClick={openSample}>See sample report</button>
                        </div>
                    </div>
                </section>

                <footer className="mt-10 border-t border-white/5 pt-6 text-slate-400 flex items-center justify-between">
                    <div>
                        <strong>A11yScan</strong> · Automated accessibility scanning · <span className="text-slate-400">© 2025 A11yScan</span>
                    </div>
                    <div>Questions? <a href="mailto:hello@a11yscan.example" className="text-cyan-200 underline">hello@a11yscan.example</a></div>
                </footer>
            </div>
        </div>
    )
}
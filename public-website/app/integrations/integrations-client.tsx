"use client";

import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import Link from "next/link";
import { URL_AUTH_REGISTER, URL_DOCUMENTATION, URL_FRONTEND_CONTACT } from "@/app/services/urlServices";
import {
    HiCodeBracket,
    HiChatBubbleLeftRight,
    HiRocketLaunch,
    HiCog6Tooth,
    HiArrowPath,
    HiCommandLine,
    HiCheckCircle,
    HiCloudArrowUp,
    HiSquare3Stack3D,
    HiCube,
    HiBolt,
    HiLink
} from "react-icons/hi2";

const integrations = [
    {
        name: "Slack",
        description: "Get real-time notifications for scan results, new issues, and compliance status directly in your Slack channels.",
        icon: HiChatBubbleLeftRight,
        accentColor: "#5f3b8f",
        category: "Communication",
        features: ["Scan notifications", "Issue alerts", "Daily summaries", "Custom webhooks"],
        active: true
    },
    {
        name: "Jira",
        description: "Automatically create Jira tickets for accessibility issues, track remediation progress, and sync status updates.",
        icon: HiSquare3Stack3D,
        accentColor: "#3861ab",
        category: "Project Management",
        features: ["Auto-create tickets", "Sync issue status", "Custom fields", "Bulk import"],
        active: true
    },
    {
        name: "GitHub Actions",
        description: "Run accessibility scans in your CI/CD pipeline and block merges if critical issues are detected.",
        icon: HiCodeBracket,
        accentColor: "#2d2d6e",
        category: "CI/CD",
        features: ["PR checks", "Automated scans", "Status badges", "Comment summaries"],
        active: true
    },
    {
        name: "REST API",
        description: "Full programmatic access to scan, retrieve results, generate reports, and manage projects via REST API.",
        icon: HiCommandLine,
        accentColor: "#39b0ce",
        category: "Developer Tools",
        features: ["Full API access", "OpenAPI spec", "Rate limiting", "Authentication"],
        active: true
    },
    {
        name: "GitLab CI",
        description: "Integrate accessibility testing into your GitLab pipelines with detailed merge request reports.",
        icon: HiRocketLaunch,
        accentColor: "#5f3b8f",
        category: "CI/CD",
        features: ["Pipeline integration", "MR reports", "Quality gates", "Artifact storage"],
        active: false
    },
    {
        name: "Jenkins",
        description: "Add accessibility scanning to your Jenkins builds with comprehensive test reports and trend analysis.",
        icon: HiCog6Tooth,
        accentColor: "#3861ab",
        category: "CI/CD",
        features: ["Build steps", "Test reports", "Trend charts", "Fail conditions"],
        active: false
    },
    {
        name: "Azure DevOps",
        description: "Native Azure Pipelines integration with work item tracking and compliance dashboards.",
        icon: HiCloudArrowUp,
        accentColor: "#39b0ce",
        category: "CI/CD",
        features: ["Pipeline tasks", "Work items", "Boards sync", "Test results"],
        active: false
    },
    {
        name: "Webhooks",
        description: "Send scan results and events to any system with custom webhook integrations and flexible payloads.",
        icon: HiBolt,
        accentColor: "#5f3b8f",
        category: "Developer Tools",
        features: ["Custom endpoints", "Event filtering", "Retry logic", "Signature verification"],
        active: false
    },
    {
        name: "Zapier",
        description: "Connect Ablelytics with 5,000+ apps to automate workflows without writing code.",
        icon: HiLink,
        accentColor: "#3861ab",
        category: "Automation",
        features: ["No-code automation", "5,000+ apps", "Multi-step workflows", "Triggers & actions"],
        active: false
    }
];

const useCases = [
    {
        title: "Continuous Testing",
        description: "Run automated scans on every deployment to catch accessibility regressions before they reach production.",
        icon: HiArrowPath,
        accentColor: "#5f3b8f"
    },
    {
        title: "Issue Tracking",
        description: "Automatically create and sync issues in your project management tools for seamless remediation workflows.",
        icon: HiCheckCircle,
        accentColor: "#3861ab"
    },
    {
        title: "Team Notifications",
        description: "Keep your team informed with real-time alerts in Slack, Microsoft Teams, or custom notification channels.",
        icon: HiChatBubbleLeftRight,
        accentColor: "#39b0ce"
    },
    {
        title: "Custom Workflows",
        description: "Build tailored automation with webhooks, API access, and flexible integration points for your unique needs.",
        icon: HiCube,
        accentColor: "#2d2d6e"
    }
];

export default function IntegrationsClient() {
    return (
        <LoggedOutLayout>
            <LoggedOutHeader />

            <main>

                {/* Hero Section */}
                <section className="py-20 md:py-28 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
                    </div>
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm font-semibold mb-6">
                                <HiLink className="w-4 h-4" />
                                Seamless Integration
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                                Connect Ablelytics to Your Workflow
                            </h1>
                            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed mb-10">
                                Integrate accessibility testing into your existing tools and automate compliance across your entire development pipeline
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={URL_AUTH_REGISTER}
                                    className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                                    style={{ color: '#5f3b8f' }}
                                >
                                    Start Free Trial
                                </Link>
                                <a
                                    href={URL_DOCUMENTATION}
                                    className="px-8 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Documentation
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Integrations Grid */}
                <section className="bg-white py-20 md:py-28">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                    Popular Integrations
                                </h2>
                                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                    Connect Ablelytics with the tools you already use every day
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {integrations.map((integration, i) => (
                                    <div
                                        key={i}
                                        className={`group bg-white border-2 border-slate-200 hover:border-[#5f3b8f] rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden${!integration.active ? " opacity-60" : ""}`}
                                    >
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                                            style={{ background: integration.accentColor }}
                                        >
                                            <integration.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700 mb-4">
                                            {integration.category}
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                            {integration.name}
                                        </h3>
                                        <p className="text-slate-600 mb-6 leading-relaxed">
                                            {integration.description}
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            {integration.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                                    <HiCheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#39b0ce' }} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {integration.active ? (
                                            <a
                                                href={URL_DOCUMENTATION}
                                                className="font-semibold hover:opacity-80 inline-flex items-center gap-2 transition-opacity"
                                                style={{ color: '#5f3b8f' }}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Learn more
                                                <span>→</span>
                                            </a>
                                        ) : (
                                            <span className="inline-block px-8 py-2 bg-slate-200 text-slate-600 absolute top-[30px] right-[-40px] rotate-45 text-sm font-semibold">Coming soon</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases */}
                <section className="bg-slate-50 py-20 md:py-28">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                    Common Use Cases
                                </h2>
                                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                    See how teams use integrations to streamline accessibility compliance
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {useCases.map((useCase, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-slate-100">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                                            style={{ background: useCase.accentColor }}
                                        >
                                            <useCase.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                            {useCase.title}
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            {useCase.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* API Access Section */}
                <section className="bg-slate-900 py-20 md:py-28">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="max-w-6xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                        Powerful REST API
                                    </h2>
                                    <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                                        Build custom integrations with our comprehensive REST API. Full access to scanning, results, reports, and project management.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {[
                                            "Complete OpenAPI/Swagger documentation",
                                            "RESTful endpoints for all features",
                                            "Webhook support for real-time events",
                                            "Rate limiting and authentication",
                                            "SDK libraries for popular languages"
                                        ].map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <HiCheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: '#39b0ce' }} />
                                                <span className="text-slate-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <a
                                        href={URL_DOCUMENTATION}
                                        className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        API Documentation
                                        <span>→</span>
                                    </a>
                                </div>
                                <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="ml-2 text-slate-400 text-sm">API Example</span>
                                    </div>
                                    <pre className="text-sm text-slate-300 overflow-x-auto">
                                        {`// Start a new scan
const response = await fetch(
  'https://api.ablelytics.com/v1/scans',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      projectId: 'proj_123',
      url: 'https://example.com',
      options: {
        depth: 3,
        includeScreenshots: true
      }
    })
  }
);

const scan = await response.json();
console.log('Scan started:', scan.id);`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 md:py-28 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
                    </div>
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
                        <div className="max-w-4xl mx-auto text-center text-white">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                                Ready to Integrate?
                            </h2>
                            <p className="text-xl md:text-2xl mb-10 opacity-95">
                                Start connecting Ablelytics to your workflow in minutes
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={URL_AUTH_REGISTER}
                                    className="px-8 py-4 bg-white rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl text-lg"
                                    style={{ color: '#5f3b8f' }}
                                >
                                    Start Free Trial
                                </Link>
                                <Link
                                    href={URL_FRONTEND_CONTACT}
                                    className="px-8 py-4 bg-transparent text-white border-2 border-white/50 rounded-xl font-semibold hover:bg-white/10 transition-colors text-lg"
                                >
                                    Contact Sales
                                </Link>
                            </div>
                            <p className="text-sm mt-6 opacity-90">14-day free trial • No credit card required • Full API access</p>
                        </div>
                    </div>
                </section>
            </main>

            <LoggedOutFooter />
        </LoggedOutLayout>
    );
}

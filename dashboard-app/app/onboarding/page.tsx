"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db, useAuth } from "@/utils/firebase";
import { PlanSelection } from "@/components/subscription/plan-selection";
import { getUserSubscription } from "@/services/subscriptionService";
import { FaCheck } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        const subscription = await getUserSubscription(user.uid);
        if (subscription) {
          router.push("/workspace");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white">
      <div className="flex min-h-screen flex-col">
        {/* Header with Logo */}
        <header className="w-full px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-4">
              <Image
                src="/web-logo-02.svg"
                alt="Ablelytics"
                width={160}
                height={40}
                priority
              />
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full mb-4">
                <span className="text-xs font-semibold text-purple-700">★ Final Step</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Choose Your Plan
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Start with a 14-day free trial. No credit card required.
                Upgrade or change plans anytime.
              </p>
            </div>

            {/* Benefits Banner */}
            <div className="max-w-5xl mx-auto mb-12">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                  What you'll get with Ablelytics
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaCheck className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Comprehensive Scans</h3>
                      <p className="text-sm text-slate-600">
                        Full-site crawling with WCAG 2.1 compliance testing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaCheck className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Professional Reports</h3>
                      <p className="text-sm text-slate-600">
                        Client-ready PDF reports with detailed remediation guidance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaCheck className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Continuous Monitoring</h3>
                      <p className="text-sm text-slate-600">
                        Scheduled scans and automated tracking over time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <PlanSelection />

            {/* FAQ Section */}
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Why choose a plan now?
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>All features require an active subscription to access the workspace</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Start with a free 14-day trial on the Basic plan - no credit card needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Cancel anytime during your trial with no charges</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Easily upgrade or downgrade plans as your needs change</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-12 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-2">
                  <FaCheck className="text-green-600" />
                  Account created
                </span>
                <div className="flex-1 h-0.5 bg-green-200 mx-3"></div>
                <span className="flex items-center gap-2">
                  <FaCheck className="text-green-600" />
                  Organization setup
                </span>
                <div className="flex-1 h-0.5 bg-slate-200 mx-3"></div>
                <span className="font-semibold text-purple-600">Step 3 of 3</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <p>© 2026 Ablelytics · Automated accessibility scanning</p>
              <nav className="flex gap-6">
                <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-slate-900 transition-colors">
                  Terms
                </Link>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

import Link from "next/link";
import { LoggedOutHeader } from "./components/organism/logged-out-header";
import { LoggedOutFooter } from "./components/organism/logged-out-footer";
import { LoggedOutLayout } from "./components/organism/logged-out-layout";
import {
  URL_FRONTEND_CONTACT,
  URL_FRONTEND_PRICING,
} from "./services/urlServices";

export default function NotFound() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <section className="bg-gradient-to-br from-amber-50 via-white to-teal-50 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-200 rounded-full text-amber-700 text-sm font-semibold mb-6">
                404: Page wandered off
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                Our crawler could not find this page either.
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                This link might be broken, or the page was moved to a more accessible place.
                Either way, we are on it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/"
                  className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors text-center"
                >
                  Back to Home
                </Link>
                <Link
                  href={URL_FRONTEND_PRICING}
                  className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-semibold hover:border-slate-300 transition-colors text-center"
                >
                  View Pricing
                </Link>
              </div>
              <p className="text-sm text-slate-500 mt-6">
                Still lost? <Link href={URL_FRONTEND_CONTACT} className="text-teal-700 font-semibold">Contact us</Link> and we will point you to the right page.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-3xl border-2 border-teal-200 bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm font-semibold text-teal-700">Scan Log</div>
                  <div className="text-xs text-slate-500">Result: Not Found</div>
                </div>
                <div className="space-y-4 text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>URL</span>
                    <span className="font-mono text-xs text-slate-500">/this-page</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Severity</span>
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Missing</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recommended fix</span>
                    <span className="text-xs text-slate-500">Return home or try search</span>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl bg-slate-900 text-white p-6">
                  <p className="text-lg font-semibold mb-2">Fun fact</p>
                  <p className="text-slate-200">
                    Even our AI could not hallucinate this URL. That is how you know it is truly gone.
                  </p>
                </div>
              </div>
              <div className="absolute -top-6 -right-4 w-28 h-28 rounded-full bg-teal-200/60 blur-2xl" />
              <div className="absolute -bottom-8 -left-6 w-32 h-32 rounded-full bg-amber-200/70 blur-3xl" />
            </div>
          </div>
        </div>
      </section>
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

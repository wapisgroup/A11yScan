import Link from "next/link";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { URL_FRONTEND_CONTACT } from "../services/urlServices";
import { buildPageMetadata } from "../libs/metadata";

export const metadata = buildPageMetadata({
  title: "Login",
  description:
    "Invitation-only login for the Ablelytics dashboard. Contact us if you need access.",
  path: "/login"
});

export default function LoginPlaceholderPage() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-sm font-semibold mb-6">
              INVITE-ONLY ACCESS
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Login is Invitation Only
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              We are preparing the next release of the Ablelytics dashboard. For now, login is
              available only to invited teams. If you have a code, enter it below.
            </p>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-left">
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="invite-code">
                Invitation code
              </label>
              <input
                id="invite-code"
                type="text"
                placeholder="Enter your code"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4"
              />
              <button
                type="button"
                disabled
                className="w-full px-4 py-3 rounded-lg bg-slate-200 text-slate-500 font-semibold cursor-not-allowed"
              >
                Verify code
              </button>
              <p className="text-sm text-slate-500 mt-4">
                Need access? <Link href={URL_FRONTEND_CONTACT} className="text-indigo-600 hover:text-indigo-700 font-semibold">Contact us</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}

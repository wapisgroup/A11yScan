import Link from "next/link";
import Image from "next/image";

export function DocFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container-pad py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo-white.svg" alt="Ablelytics" width={140} height={36} />
            </div>
            <p className="text-sm text-slate-400">
              Documentation for teams using Ablelytics to automate WCAG compliance.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Docs</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs/getting-started" className="hover:text-white">Getting Started</Link></li>
              <li><Link href="/docs/page-collection" className="hover:text-white">Page Collection</Link></li>
              <li><Link href="/docs/scans-and-runs" className="hover:text-white">Scans & Runs</Link></li>
              <li><Link href="/docs/reports" className="hover:text-white">Reports</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/docs/troubleshooting" className="hover:text-white">Troubleshooting</Link></li>
              <li><a href="mailto:support@ablelytics.com" className="hover:text-white">Contact Support</a></li>
              <li><a href="https://ablelytics.com" className="hover:text-white">Marketing Site</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 Ablelytics. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="https://www.linkedin.com/company/ablelytics/" className="hover:text-white">LinkedIn</a>
            <a href="https://x.com/ablelytics" className="hover:text-white">X</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { WhiteBox } from "../../molecule/white-box"
import { Button } from "../../atom/button"
import Link from "next/link"

export const FeaturesDeveloperAutomationSection = () => {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WhiteBox extraClass="gap-medium" largeRounded>
                <h3 className="as-h4-text primary-text-color">Developer-friendly</h3>
                <p className="as-p2-text secondary-text-color">Integrate A11yScan with your workflow — run scans from CI, upload results to your storage, or fetch JSON via API for automation.</p>

                <div className="flex flex-col gap-medium">
                    <div className="flex flex-col gap-small">
                        <h4 className="as-p2-text secondary-text-color font-semibold">API example</h4>
                        <pre className="as-p2-text bg-slate-900 rounded-md p-3 text-xs text-slate-300 overflow-auto">{
                            `POST /functions/startScan
Content-Type: application/json

{ "projectId": "proj-123", "domain": "https://example.com", "maxPages": 500 }
`}
                        </pre>
                    </div>

                    <div className="flex flex-col gap-small">
                        <h4 className="as-p2-text secondary-text-color font-semibold">Webhooks & CI</h4>
                        <p className="as-p2-text secondary-text-color">Use webhooks to trigger downstream jobs (create Jira tickets, post Slack messages, update dashboards). Great for automated regression checks.</p>
                    </div>
                </div>
            </WhiteBox>

            <WhiteBox extraClass="gap-medium" largeRounded>
                <div className="flex flex-col gap-medium">
                    <h3 className="as-h4-text primary-text-color">Integrations</h3>
                    <ul className="as-p2-text secondary-text-color flex flex-col gap-small">
                        <li>• Webhooks (POST JSON on run completion)</li>
                        <li>• Cloud Storage (Firebase Storage / S3) for artifacts</li>
                        <li>• CI (GitHub Actions, GitLab CI) for scheduled scans</li>
                        <li>• Custom rule extensions via plugins</li>
                    </ul>
                </div>

                <div>
                    <Link href="/docs/integrations">
                        <Button variant="link" title={`Read integration docs`} />
                    </Link>
                </div>
            </WhiteBox>
        </section>
    )
}
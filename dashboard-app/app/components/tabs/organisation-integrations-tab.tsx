"use client";

import { FiSlack } from "react-icons/fi";

type SlackIntegrationData = {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
};

type OrganisationIntegrationsTabProps = {
  slackIntegration: SlackIntegrationData;
  setSlackIntegration: (data: SlackIntegrationData) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
};

export function OrganisationIntegrationsTab({
  slackIntegration,
  setSlackIntegration,
  saving,
  onSave,
}: OrganisationIntegrationsTabProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <form onSubmit={onSave} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h2>
          <p className="text-sm text-gray-600">
            Connect Ablelytics to external tools. More integrations are coming soon.
          </p>
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <FiSlack size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Slack</h3>
                <p className="text-sm text-gray-600">
                  Send notifications when scans, reports, and sitemaps finish.
                </p>
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={slackIntegration.enabled}
                onChange={(e) =>
                  setSlackIntegration({
                    ...slackIntegration,
                    enabled: e.target.checked,
                  })
                }
              />
              Enabled
            </label>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slack Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackIntegration.webhookUrl}
                onChange={(e) =>
                  setSlackIntegration({
                    ...slackIntegration,
                    webhookUrl: e.target.value,
                  })
                }
                disabled={!slackIntegration.enabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slack Channel
              </label>
              <input
                type="text"
                placeholder="#ablelytics"
                value={slackIntegration.channel}
                onChange={(e) =>
                  setSlackIntegration({
                    ...slackIntegration,
                    channel: e.target.value,
                  })
                }
                disabled={!slackIntegration.enabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

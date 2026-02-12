"use client";

/**
 * Organisation Settings Tab
 * Shared component in tabs/organisation-settings-tab.tsx.
 */

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { DSButton } from "@/components/atom/ds-button";
import { DSIconButton } from "@/components/atom/ds-icon-button";

type OrganisationData = {
  name: string;
  language: string;
  industry: string;
  vatNumber: string;
  ipRestrictions: string[];
};

type OrganisationSettingsTabProps = {
  orgData: OrganisationData;
  setOrgData: (data: OrganisationData) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
};

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Other",
];

export function OrganisationSettingsTab({
  orgData,
  setOrgData,
  saving,
  onSave,
}: OrganisationSettingsTabProps) {
  const [newIp, setNewIp] = useState("");

  const handleAddIpRestriction = () => {
    if (newIp && !orgData.ipRestrictions.includes(newIp)) {
      setOrgData({
        ...orgData,
        ipRestrictions: [...orgData.ipRestrictions, newIp],
      });
      setNewIp("");
    }
  };

  const handleRemoveIpRestriction = (ip: string) => {
    setOrgData({
      ...orgData,
      ipRestrictions: orgData.ipRestrictions.filter((item) => item !== ip),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border-light)] p-6">
      <form onSubmit={onSave} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organisation Name
                <span className="text-red-600 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                value={orgData.name}
                onChange={(e) =>
                  setOrgData({ ...orgData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                value={orgData.language}
                onChange={(e) =>
                  setOrgData({ ...orgData, language: e.target.value })
                }
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                value={orgData.industry}
                onChange={(e) =>
                  setOrgData({ ...orgData, industry: e.target.value })
                }
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VAT Number
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                placeholder="e.g., BE0123456789"
                value={orgData.vatNumber}
                onChange={(e) =>
                  setOrgData({ ...orgData, vatNumber: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border-light)]">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Security Settings
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IP Restrictions
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Add IP addresses that are allowed to access your organisation's
              data.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                placeholder="e.g., 192.168.1.1"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddIpRestriction();
                  }
                }}
              />
              <DSButton type="button" variant="outline" onClick={handleAddIpRestriction}>
                Add IP
              </DSButton>
            </div>
            {orgData.ipRestrictions.length > 0 && (
              <div className="space-y-2">
                {orgData.ipRestrictions.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between p-3 bg-[var(--color-bg-light)] rounded-lg border border-[var(--color-border-light)]"
                  >
                    <span className="text-gray-700 font-mono text-sm">
                      {ip}
                    </span>
                    <DSIconButton
                      type="button"
                      variant="danger"
                      label="Remove IP"
                      icon={<FiTrash2 size={16} />}
                      onClick={() => handleRemoveIpRestriction(ip)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border-light)]">
          <DSButton
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </DSButton>
        </div>
      </form>
    </div>
  );
}

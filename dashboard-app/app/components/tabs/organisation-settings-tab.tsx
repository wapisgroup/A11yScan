"use client";

import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";

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
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="e.g., BE0123456789"
                value={orgData.vatNumber}
                onChange={(e) =>
                  setOrgData({ ...orgData, vatNumber: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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
              <button
                type="button"
                onClick={handleAddIpRestriction}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Add IP
              </button>
            </div>
            {orgData.ipRestrictions.length > 0 && (
              <div className="space-y-2">
                {orgData.ipRestrictions.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-gray-700 font-mono text-sm">
                      {ip}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIpRestriction(ip)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                      title="Remove IP"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
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

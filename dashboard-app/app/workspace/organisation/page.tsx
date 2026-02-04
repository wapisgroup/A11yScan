"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth, db } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import { Button } from "@/components/atom/button";
import { PiBuildings, PiGlobe, PiBriefcase, PiShieldCheck, PiUsers, PiPalette, PiImage } from "react-icons/pi";

type TabType = "settings" | "members" | "whitelabel";

type OrganisationData = {
  name: string;
  language: string;
  industry: string;
  vatNumber: string;
  ipRestrictions: string[];
};

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: string;
  status: string;
  lastLogin: Date | null;
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

export default function OrganisationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Organisation data
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [orgData, setOrgData] = useState<OrganisationData>({
    name: "",
    language: "en",
    industry: "",
    vatNumber: "",
    ipRestrictions: [],
  });
  const [newIp, setNewIp] = useState("");

  // Members data
  const [members, setMembers] = useState<Member[]>([]);

  // White label data
  const [customLogo, setCustomLogo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#10B981");

  useEffect(() => {
    loadOrganisationData();
  }, [user]);

  const loadOrganisationData = async () => {
    if (!user?.organisationId) {
      setLoading(false);
      return;
    }

    try {
      const orgRef = doc(db, "organisations", user.organisationId);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const data = orgSnap.data();
        setOrganisationId(orgSnap.id);
        setOrgData({
          name: data.name || "",
          language: data.language || "en",
          industry: data.industry || "",
          vatNumber: data.vatNumber || "",
          ipRestrictions: Array.isArray(data.ipRestrictions) ? data.ipRestrictions : [],
        });
        setPrimaryColor(data.primaryColor || "#3B82F6");
        setSecondaryColor(data.secondaryColor || "#10B981");
        setCustomLogo(data.customLogo || "");
      }

      // Load members - including the current user
      const usersQuery = query(
        collection(db, "users"),
        where("organisationId", "==", user.organisationId)
      );
      const usersSnap = await getDocs(usersQuery);
      
      // If no members found, add current user manually
      if (usersSnap.empty && user) {
        setMembers([{
          id: user.uid,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          accountType: "Account owner",
          status: "Active",
          lastLogin: null,
        }]);
      } else {
        const membersList: Member[] = usersSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            accountType: docSnap.id === user.uid ? "Account owner" : "User",
            status: "Active",
            lastLogin: data.lastLogin ? data.lastLogin.toDate() : null,
          };
        });
        setMembers(membersList);
      }
    } catch (err) {
      console.error("Load organisation error:", err);
      setError(err instanceof Error ? err.message : "Failed to load organisation data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const orgRef = doc(db, "organisations", organisationId);
      await updateDoc(orgRef, {
        name: orgData.name,
        language: orgData.language,
        industry: orgData.industry,
        vatNumber: orgData.vatNumber,
        ipRestrictions: orgData.ipRestrictions,
      });
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhiteLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const orgRef = doc(db, "organisations", organisationId);
      await updateDoc(orgRef, {
        primaryColor,
        secondaryColor,
        customLogo,
      });
      setSuccess("Branding settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const addIpRestriction = () => {
    if (newIp && !orgData.ipRestrictions.includes(newIp)) {
      setOrgData({ ...orgData, ipRestrictions: [...orgData.ipRestrictions, newIp] });
      setNewIp("");
    }
  };

  const removeIpRestriction = (ip: string) => {
    setOrgData({
      ...orgData,
      ipRestrictions: orgData.ipRestrictions.filter((i) => i !== ip),
    });
  };

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageContainer title="Organisation Settings">
            <div>Loading...</div>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  if (!user?.organisationId) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageContainer title="Organisation Settings">
            <div className="text-red-600">No organisation found for this account.</div>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageContainer title="Organisation Settings">
          <div className="max-w-6xl mx-auto">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`${
                    activeTab === "settings"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Organisation
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={`${
                    activeTab === "members"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab("whitelabel")}
                  className={`${
                    activeTab === "whitelabel"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Branding
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          value={orgData.name}
                          onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                            <span className="text-red-600 ml-1">*</span>
                          </label>
                          <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            value={orgData.language}
                            onChange={(e) => setOrgData({ ...orgData, language: e.target.value })}
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="cs">Czech</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Industry
                            <span className="text-red-600 ml-1">*</span>
                          </label>
                          <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            value={orgData.industry}
                            onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                            required
                          >
                            <option value="">Select industry...</option>
                            {INDUSTRIES.map((industry) => (
                              <option key={industry} value={industry}>
                                {industry}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          VAT Number
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          placeholder="e.g., GB123456789"
                          value={orgData.vatNumber}
                          onChange={(e) => setOrgData({ ...orgData, vatNumber: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">For EU businesses, enter your VAT ID</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      IP Address Restriction
                    </h2>
                    <p className="text-gray-600 text-sm mb-6">
                      Restrict login access to your organisation's account only from specified IP addresses.
                    </p>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Enter IP address (e.g., 192.168.1.1)"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={addIpRestriction}
                        variant="secondary"
                        title="Add IP"
                      />
                    </div>

                    {orgData.ipRestrictions.length > 0 && (
                      <div className="space-y-2">
                        {orgData.ipRestrictions.map((ip) => (
                          <div key={ip} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <span className="text-gray-900 font-mono">{ip}</span>
                            <button
                              type="button"
                              onClick={() => removeIpRestriction(ip)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove IP"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          {activeTab === "members" && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Team Members
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  Manage users who have access to your organisation
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Account Type</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Last Login</th>
                      <th className="text-right py-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 pr-4 text-gray-900 font-medium">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="py-4 pr-4 text-gray-600">{member.email}</td>
                        <td className="py-4 pr-4">
                          <span className="px-3 py-1 bg-[#649DAD]/10 text-[#649DAD] rounded-full text-sm font-medium">
                            {member.accountType}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {member.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-gray-600 text-sm">
                          {member.lastLogin ? member.lastLogin.toLocaleString() : "Never"}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                              title="Edit member"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            {member.accountType !== "Account owner" && (
                              <button
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete member"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "whitelabel" && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <form onSubmit={handleSaveWhiteLabel} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Branding Settings
                  </h2>
                  <p className="text-gray-600 text-sm mb-6">
                    Customize the logo, color scheme, and default form settings for PDF reports.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">
                    Custom Logo
                  </h3>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Enter logo URL (e.g., https://example.com/logo.png)"
                    value={customLogo}
                    onChange={(e) => setCustomLogo(e.target.value)}
                  />
                  {customLogo && (
                    <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Preview:</p>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                        <img src={customLogo} alt="Custom logo" className="max-h-16" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-6">
                    Custom Colors
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          className="w-20 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                        />
                        <input
                          type="text"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                        />
                      </div>
                      <div 
                        className="mt-3 h-12 rounded-lg border border-gray-200 shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Secondary Color</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          className="w-20 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                        />
                        <input
                          type="text"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                        />
                      </div>
                      <div 
                        className="mt-3 h-12 rounded-lg border border-gray-200 shadow-sm"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Branding Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}
          </div>
        </PageContainer>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}

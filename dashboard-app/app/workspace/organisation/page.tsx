"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth, db } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { OrganisationSettingsTab } from "@/components/tabs/organisation-settings-tab";
import { MembersTab } from "@/components/tabs/organisation-members-tab";
import { BrandingTab } from "@/components/tabs/organisation-branding-tab";

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

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageWrapper title="Organisation Settings">
            <PageContainer title="">
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
              </div>
            </PageContainer>
          </PageWrapper>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  if (!user?.organisationId) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageWrapper title="Organisation Settings">
            <PageContainer title="">
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                No organisation found for this account.
              </div>
            </PageContainer>
          </PageWrapper>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title="Organisation Settings">
        
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
                  className={`${activeTab === "settings"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Organisation
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={`${activeTab === "members"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab("whitelabel")}
                  className={`${activeTab === "whitelabel"
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
              <OrganisationSettingsTab
                orgData={orgData}
                setOrgData={setOrgData}
                saving={saving}
                onSave={handleSaveSettings}
              />
            )}

            {activeTab === "members" && (
              <MembersTab members={members} />
            )}

            {activeTab === "whitelabel" && (
              <BrandingTab
                customLogo={customLogo}
                setCustomLogo={setCustomLogo}
                primaryColor={primaryColor}
                setPrimaryColor={setPrimaryColor}
                secondaryColor={secondaryColor}
                setSecondaryColor={setSecondaryColor}
                saving={saving}
                onSave={handleSaveWhiteLabel}
              />
            )}
          
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}

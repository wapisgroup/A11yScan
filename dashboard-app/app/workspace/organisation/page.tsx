"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth, db } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { DSTabs } from "@/components/molecule/ds-tabs";
import { OrganisationSettingsTab } from "@/components/tabs/organisation-settings-tab";
import { MembersTab } from "@/components/tabs/organisation-members-tab";
import { BrandingTab } from "@/components/tabs/organisation-branding-tab";
import { OrganisationIntegrationsTab } from "@/components/tabs/organisation-integrations-tab";

type TabType = "settings" | "members" | "whitelabel" | "integrations";

type OrganisationData = {
  name: string;
  language: string;
  industry: string;
  vatNumber: string;
  ipRestrictions: string[];
};
type SlackIntegrationData = {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
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

  // Integrations data
  const [slackIntegration, setSlackIntegration] = useState<SlackIntegrationData>({
    enabled: false,
    webhookUrl: "",
    channel: "#ablelytics",
  });

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
        const slackData = data.integrations?.slack || {};
        setSlackIntegration({
          enabled: Boolean(slackData.enabled),
          webhookUrl: slackData.webhookUrl || "",
          channel: slackData.channel || "#ablelytics",
        });
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

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const orgRef = doc(db, "organisations", organisationId);
      await updateDoc(orgRef, {
        integrations: {
          slack: {
            enabled: slackIntegration.enabled,
            webhookUrl: slackIntegration.webhookUrl,
            channel: slackIntegration.channel,
          },
        },
      });
      setSuccess("Integrations saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save integrations");
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
            <div className="mb-6">
              <DSTabs
                variant="page"
                value={activeTab}
                onChange={setActiveTab}
                items={[
                  { key: "settings", label: "Organisation" },
                  { key: "members", label: "Members" },
                  { key: "whitelabel", label: "Branding" },
                  { key: "integrations", label: "Integrations" },
                ]}
              />
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

            {activeTab === "integrations" && (
              <OrganisationIntegrationsTab
                slackIntegration={slackIntegration}
                setSlackIntegration={setSlackIntegration}
                saving={saving}
                onSave={handleSaveIntegrations}
              />
            )}
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}

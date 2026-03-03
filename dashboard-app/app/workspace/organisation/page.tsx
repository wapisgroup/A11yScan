"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { DSTabs } from "@/components/molecule/ds-tabs";
import { OrganisationSettingsTab } from "@/components/tabs/organisation-settings-tab";
import { MembersTab } from "@/components/tabs/organisation-members-tab";
import { BrandingTab } from "@/components/tabs/organisation-branding-tab";
import { OrganisationIntegrationsTab } from "@/components/tabs/organisation-integrations-tab";
import {
  getOrganizationWorkspaceData,
  updateOrganizationGeneral,
  updateOrganizationBranding,
  updateOrganizationIntegrations,
} from "@/actions/organization";

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
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
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
    let cancelled = false;

    const loadOrganisationData = async () => {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!uid) {
        setOrganisationId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await getOrganizationWorkspaceData();
        if (cancelled) return;
        setOrganisationId(data.organizationId);
        setOrgData({
          name: data.name || "",
          language: data.settings.language || "en",
          industry: data.settings.industry || "",
          vatNumber: data.settings.vatNumber || "",
          ipRestrictions: Array.isArray(data.settings.ipRestrictions)
            ? data.settings.ipRestrictions
            : [],
        });
        setPrimaryColor(data.settings.primaryColor || "#3B82F6");
        setSecondaryColor(data.settings.secondaryColor || "#10B981");
        setCustomLogo(data.settings.customLogo || "");
        setSlackIntegration({
          enabled: Boolean(data.settings.integrations?.slack?.enabled),
          webhookUrl: data.settings.integrations?.slack?.webhookUrl || "",
          channel: data.settings.integrations?.slack?.channel || "#ablelytics",
        });
        setMembers(data.members as Member[]);
      } catch (err) {
        if (cancelled) return;
        console.error("Load organisation error:", err);
        setError(err instanceof Error ? err.message : "Failed to load organisation data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrganisationData();
    return () => {
      cancelled = true;
    };
  }, [uid, authLoading]);

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateOrganizationGeneral({
        organizationId: organisationId,
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

  const handleSaveWhiteLabel = async (e: FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateOrganizationBranding({
        organizationId: organisationId,
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

  const handleSaveIntegrations = async (e: FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateOrganizationIntegrations({
        organizationId: organisationId,
        slack: {
          enabled: slackIntegration.enabled,
          webhookUrl: slackIntegration.webhookUrl,
          channel: slackIntegration.channel,
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

  return (
    <PageWrapper title="Organisation Settings">
      {loading ? (
        <PageContainer title="">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          </div>
        </PageContainer>
      ) : !organisationId ? (
        <PageContainer title="">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            No organisation found for this account.
          </div>
        </PageContainer>
      ) : (
        <>
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
        </>
      )}
    </PageWrapper>
  );
}

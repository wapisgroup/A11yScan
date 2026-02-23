"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth, db, auth } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { DSButton } from "@/components/atom/ds-button";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { useSubscription } from "@/hooks/use-subscription";
import { useConfirm } from "@/components/providers/window-provider";
import { PiCopy, PiKey, PiArrowsClockwise } from "react-icons/pi";

function generateToken() {
  // Generate a UUID v4 style token
  return 'ak_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const { hasFeature, packageConfig } = useSubscription();
  const confirm = useConfirm();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'API'>('profile');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Detect if this is an email/password account
  const isEmailPasswordUser = auth.currentUser?.providerData?.some(
    (p) => p.providerId === "password"
  ) ?? false;

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setLanguage(user.language || "en");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (!user?.uid) throw new Error("Not authenticated");

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        language,
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setPasswordError(
        msg.includes("wrong-password") || msg.includes("invalid-credential")
          ? "Current password is incorrect."
          : msg
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title="My Account">
           <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`${activeTab === 'profile'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('API')}
                className={`${activeTab === 'API'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                API Token
              </button>
            </nav>
          </div>

          {activeTab === 'profile' && (
          <>
          <PageContainer title="Personal Information" description="Update your personal details and preferences">
            <div className=" w-full max-w-4xl ">
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

              {/* Form Card */}
              <div className="py-6 w-full">
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                      value={email}
                      disabled
                      title="Email cannot be changed"
                    />
                    <p className="text-gray-500 text-xs mt-2 ml-1">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  {/* Language Field */}
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      id="language"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="cs">Czech</option>
                    </select>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <DSButton
                      disabled={saving}
                      type="submit"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </DSButton>
                  </div>
                </form>
              </div>
            </div>
          </PageContainer>

          {/* Password Change — only for email/password accounts */}
          {isEmailPasswordUser && (
          <PageContainer title="Change Password" description="Update your account password. You'll need to enter your current password to confirm.">
            <div className="w-full max-w-4xl py-6">
              {passwordError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  {passwordSuccess}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-gray-500 text-xs mt-1 ml-1">Minimum 8 characters</p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F7DEB] focus:border-transparent"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-6 border-t border-gray-200">
                  <DSButton disabled={changingPassword} type="submit">
                    {changingPassword ? "Updating..." : "Update Password"}
                  </DSButton>
                </div>
              </form>
            </div>
          </PageContainer>
          )}
          </>
          )}

          {activeTab === 'API' && (
          <PageContainer title="API Access" description="Generate an API token to access the Ablelytics REST API programmatically.">
            <div className="w-full max-w-4xl py-6">
              {!hasFeature('apiAccess') ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
                  <p className="font-medium">API access is not available on your current plan.</p>
                  <p className="text-sm mt-1">Upgrade to the Starter plan or above to unlock API access.</p>
                </div>
              ) : (
                <>
                  {packageConfig && packageConfig.limits.apiCallsPerDay && (
                    <p className="text-sm text-gray-500 mb-4">
                      Your plan allows <strong>{packageConfig.limits.apiCallsPerDay.toLocaleString()}</strong> API calls per day.
                    </p>
                  )}
                  {packageConfig && !packageConfig.limits.apiCallsPerDay && (
                    <p className="text-sm text-gray-500 mb-4">
                      Your plan has <strong>unlimited</strong> API calls.
                    </p>
                  )}

                  {user?.apiToken ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your API Token</label>
                        <div className="flex items-center gap-3">
                          <code className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono text-gray-600 truncate">
                            {'••••••••••••••••••••••••' + user.apiToken.slice(-8)}
                          </code>
                          <DSButton
                            variant="outline"
                            onClick={async () => {
                              await navigator.clipboard.writeText(user.apiToken!);
                              setTokenCopied(true);
                              setTimeout(() => setTokenCopied(false), 2000);
                            }}
                            leadingIcon={<PiCopy className="mr-1" />}
                          >
                            
                            {tokenCopied ? 'Copied!' : 'Copy'}
                          </DSButton>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <DSButton
                          variant="outline"
                          disabled={generatingToken}
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Regenerate API Token',
                              message: 'This will invalidate your current token. Any integrations using the old token will stop working. Continue?',
                              confirmLabel: 'Regenerate',
                              cancelLabel: 'Cancel',
                              tone: 'danger',
                            });
                            if (!ok) return;

                            setGeneratingToken(true);
                            try {
                              const newToken = generateToken();
                              const userRef = doc(db, 'users', user.uid);
                              await updateDoc(userRef, {
                                apiToken: newToken,
                                apiTokenCreatedAt: Timestamp.now(),
                              });
                              user.apiToken = newToken; // Update local user object to reflect new token
                              setSuccess('API token regenerated successfully!');
                              setTimeout(() => setSuccess(''), 3000);
                            } catch (err) {
                              setError('Failed to regenerate token');
                            } finally {
                              setGeneratingToken(false);
                            }
                          }}
                          leadingIcon={<PiArrowsClockwise className="mr-1" />}
                        >
                          {generatingToken ? 'Regenerating...' : 'Regenerate Token'}
                        </DSButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        You haven't generated an API token yet. Create one to start using the REST API.
                      </p>
                      <DSButton
                        disabled={generatingToken}
                        onClick={async () => {
                          if (!user) return;
                          setGeneratingToken(true);
                          try {
                            const newToken = generateToken();
                            const userRef = doc(db, 'users', user!.uid);
                            await updateDoc(userRef, {
                              apiToken: newToken,
                              apiTokenCreatedAt: Timestamp.now(),
                            });
                            user.apiToken = newToken;
                            setSuccess('API token generated! Copy it now — it won\'t be shown in full again.');
                            setTimeout(() => setSuccess(''), 5000);
                          } catch (err) {
                            setError('Failed to generate token');
                          } finally {
                            setGeneratingToken(false);
                          }
                        }}
                      >
                        <PiKey className="mr-1" />
                        {generatingToken ? 'Generating...' : 'Generate API Token'}
                      </DSButton>
                    </div>
                  )}
                </>
              )}
            </div>
          </PageContainer>
          )}
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}

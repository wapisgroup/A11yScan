"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth, db } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/atom/button";
import { PiUserCircle, PiEnvelope, PiPhone, PiGlobe } from "react-icons/pi";

export default function ProfilePage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageContainer title="My Account">
          <div className="max-w-3xl mx-auto">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-[#649DAD] to-[#4a7b8a] rounded-2xl p-8 mb-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                  <PiUserCircle className="text-white text-4xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {user?.firstName || user?.email || "User"}
                  </h2>
                  <p className="text-white/80 text-sm">Manage your account settings and preferences</p>
                </div>
              </div>
            </div>

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
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <PiUserCircle className="text-[#649DAD] text-lg" />
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <PiUserCircle className="text-[#649DAD] text-lg" />
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <PiEnvelope className="text-[#649DAD] text-lg" />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
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
                  <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <PiPhone className="text-[#649DAD] text-lg" />
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                {/* Language Field */}
                <div>
                  <label htmlFor="language" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <PiGlobe className="text-[#649DAD] text-lg" />
                    Language
                  </label>
                  <select
                    id="language"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all cursor-pointer"
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
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={saving}
                    variant="primary"
                    title={saving ? "Saving..." : "Save Changes"}
                  />
                    
                </div>
              </form>
            </div>
          </div>
        </PageContainer>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
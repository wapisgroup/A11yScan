"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/firebase";
import { URL_AUTH_LOGIN } from "@/utils/urls";
import { FaGoogle, FaCheck, FaTimes } from "react-icons/fa";
import { AuthLayout } from "@/components/auth/auth-layout";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/utils/firebase";

type RegistrationStep = "auth" | "company";

export default function RegisterPage() {
  const { loginWithGoogle, user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<RegistrationStep>("auth");
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Organisation fields
  const [organisationName, setOrganisationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");

  // Password validation
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("@/utils/firebase");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setTempUserId(result.user.uid);
      setStep("company");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("auth/email-already-in-use")) {
          setError("This email is already registered. Please sign in instead.");
        } else if (err.message.includes("auth/invalid-email")) {
          setError("Please enter a valid email address.");
        } else {
          setError(err.message);
        }
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      setTimeout(() => {
        setStep("company");
        setLoading(false);
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handleOrganisationSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userId = user?.uid || tempUserId;
      if (!userId) throw new Error("User not authenticated");

      // Create organisation document
      const orgRef = doc(db, "organisations", `org_${Date.now()}`);
      await setDoc(orgRef, {
        name: organisationName.trim(),
        language: "en",
        createdAt: serverTimestamp(),
        owner: userId,
      });

      // Update user document
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          organisationId: orgRef.id,
          email: user?.email || email,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Redirect to onboarding
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Company Details
  if (step === "company") {
    return (
      <AuthLayout
        title="Almost there!"
        subtitle="Tell us about your organization"
        showBackLink
        backLinkHref="#"
        backLinkText="Back to account"
      >
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleOrganisationSetup} className="space-y-4">
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-2">
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="Acme Inc."
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="John"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="+1 (555) 000-0000"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-500 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up..." : "Continue to Plan Selection"}
            </button>
          </form>

          {/* Progress Indicator */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <FaCheck className="text-green-600" />
                Account created
              </span>
              <div className="flex-1 h-0.5 bg-slate-200 mx-3"></div>
              <span className="font-semibold">Step 2 of 3</span>
              <div className="flex-1 h-0.5 bg-slate-200 mx-3"></div>
              <span className="text-slate-400">Choose plan</span>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Step 1: Create Account
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your 14-day free trial today"
      showBackLink
    >
      <div className="space-y-6">
        {/* Google Sign Up Button */}
        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaGoogle className="text-lg" />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500">Or continue with email</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />

            {/* Password Requirements */}
            {password && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-2">Password must contain:</p>
                <div className="space-y-1.5">
                  <PasswordRequirement met={passwordValidation.minLength}>
                    At least 8 characters
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordValidation.hasUpperCase}>
                    One uppercase letter
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordValidation.hasLowerCase}>
                    One lowercase letter
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordValidation.hasNumber}>
                    One number
                  </PasswordRequirement>
                  <PasswordRequirement met={passwordValidation.hasSpecial}>
                    One special character
                  </PasswordRequirement>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <FaTimes className="text-sm" />
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-500 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href={URL_AUTH_LOGIN}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-xs text-center text-slate-500">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-slate-700">
            Privacy Policy
          </Link>
        </p>

        {/* Progress Indicator */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">Step 1 of 3</span>
            <div className="flex-1 h-0.5 bg-slate-200 mx-3"></div>
            <span className="text-slate-400">Organization</span>
            <div className="flex-1 h-0.5 bg-slate-200 mx-3"></div>
            <span className="text-slate-400">Choose plan</span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

// Password Requirement Component
function PasswordRequirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${met ? "text-green-600" : "text-slate-500"}`}>
      {met ? <FaCheck className="text-sm" /> : <FaTimes className="text-sm" />}
      <span>{children}</span>
    </div>
  );
}

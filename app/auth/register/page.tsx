"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/firebase";
import { URL_APP_WORKSPACE, URL_AUTH_LOGIN } from "@/utils/urls";
import { FaApple, FaGoogle, FaMicrosoft } from "react-icons/fa";
import { AuthPopup } from "@/components/molecule/auth-popup";
import { AuthButton } from "@/components/atom/auth-button";
import { Separator } from "@/components/atom/separator";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/utils/firebase";

type RegistrationStep = "auth" | "company";

export default function RegisterPage() {
  const { register, loginWithGoogle, user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<RegistrationStep>("auth");
  const [tempUserId, setTempUserId] = useState<string | null>(null);

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
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("At least one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("At least one lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("At least one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("At least one special character");
    return errors;
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    if (pwd) {
      setPasswordErrors(validatePassword(pwd));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      setError("Password does not meet requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Just create the auth account, don't create user document yet
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("@/utils/firebase");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setTempUserId(result.user.uid);
      setStep("company");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("auth/email-already-in-use")) {
          setError("This email is already registered. Please sign in instead or use a different email.");
        } else if (err.message.includes("auth/invalid-email")) {
          setError("Please enter a valid email address.");
        } else if (err.message.includes("auth/weak-password")) {
          setError("Password is too weak. Please use a stronger password.");
        } else {
          setError(err.message);
        }
      } else {
        setError(String(err));
      }
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    try {
      await loginWithGoogle();
      // Wait a bit for auth state to update, then move to company setup
      setTimeout(() => {
        setStep("company");
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleOrganisationSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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

      // Update user document with organisation info and personal details
      // Use merge: true to preserve any existing data
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        organisationId: orgRef.id,
        email: user?.email || email,
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Reload the page to refresh auth state with new user data
      window.location.href = URL_APP_WORKSPACE;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const onApple = async () => {
    setError("Apple sign-in is not implemented yet.");
  };

  const onMicrosoft = async () => {
    setError("Microsoft sign-in is not implemented yet.");
  };

  if (step === "company") {
    return (
      <AuthPopup title="Organisation Details">
        <div className="flex flex-col gap-large">
          <div className="as-p2-text secondary-text-color">
            Tell us about your organisation and complete your profile.
          </div>

          {error && <div className="text-red-600 mb-2">{error}</div>}

          <form onSubmit={handleOrganisationSetup}>
            <div className="flex flex-col gap-large">
              <div className="flex flex-col gap-medium">
                <input
                  className="w-full input"
                  placeholder="Organisation Name"
                  value={organisationName}
                  onChange={(e) => setOrganisationName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-medium">
                  <input
                    className="w-full input"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <input
                    className="w-full input"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <input
                  className="w-full input"
                  placeholder="Phone Number (optional)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full form-button">
                Complete Registration
              </button>
            </div>
          </form>
        </div>
      </AuthPopup>
    );
  }

  return (
    <AuthPopup title="Create Account">
      <div className="flex flex-col gap-large">
        <div className="as-p2-text secondary-text-color">
          By continuing, you agree to our User Agreement and acknowledge that you understand the Privacy policy.
        </div>

        <div className="flex flex-col gap-small px-[var(--spacing-m)]">
          <AuthButton title="Sign up with Google" icon={<FaGoogle />} onClick={handleGoogleRegister} />
          <AuthButton title="Sign up with Apple" icon={<FaApple />} onClick={onApple} />
          <AuthButton title="Sign up with Microsoft" icon={<FaMicrosoft />} onClick={onMicrosoft} />
        </div>

        <Separator />

        <div className="flex flex-col gap-medium">
          {error && <div className="text-red-600 mb-2">{error}</div>}

          <form onSubmit={handleEmailRegister}>
            <div className="flex flex-col gap-large">
              <div className="flex flex-col gap-medium">
                <input
                  className="w-full input"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div>
                  <input
                    className="w-full input"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                  />
                  {password && passwordErrors.length > 0 && (
                    <div className="mt-2 text-xs text-slate-600">
                      <div className="font-semibold mb-1">Password must contain:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {passwordErrors.map((err, idx) => (
                          <li key={idx} className="text-red-600">{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <input
                  className="w-full input"
                  placeholder="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="w-full form-button">
                Continue
              </button>
            </div>
          </form>

          <div className="text-center as-p2-text secondary-text-color">
            Already have an account?{" "}
            <Link href={URL_AUTH_LOGIN} className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </AuthPopup>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { URL_AUTH_LOGIN } from "@/utils/urls";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PiCheckCircle } from "react-icons/pi";
import { resetPassword } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch {
      // Never reveal whether an email exists — always show success
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      showBackLink
      backLinkHref={URL_AUTH_LOGIN}
      backLinkText="Back to sign in"
    >
      {sent ? (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-4 bg-green-50 rounded-full">
              <PiCheckCircle size={40} className="text-green-500" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Check your inbox</h2>
            <p className="text-sm text-slate-600">
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a
              password reset link shortly. Check your spam folder if you don&apos;t see it.
            </p>
          </div>
          <Link
            href={URL_AUTH_LOGIN}
            className="inline-block w-full px-4 py-3 text-center bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-500 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

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
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-500 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <div className="text-center">
            <Link
              href={URL_AUTH_LOGIN}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

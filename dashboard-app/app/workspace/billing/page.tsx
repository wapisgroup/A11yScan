"use client";

import { useState, useEffect } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth, db } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { FiCheck, FiDownload } from "react-icons/fi";
import { Button } from "@/components/atom/button";
import { PiCreditCard, PiBuildings, PiMapPin, PiEnvelope, PiReceipt, PiStar } from "react-icons/pi";

type Plan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
};

type BillingDetails = {
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  vatNumber: string;
  billingEmail: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  period: string;
  amount: number;
  date: Date;
  status: string;
};

const AVAILABLE_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    features: [
      "Up to 5 projects",
      "100 pages per scan",
      "Basic reports",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    recommended: true,
    features: [
      "Up to 50 projects",
      "1,000 pages per scan",
      "Advanced reports",
      "Priority support",
      "Custom branding",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    features: [
      "Unlimited projects",
      "Unlimited pages",
      "White-label reports",
      "24/7 dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "Team collaboration",
    ],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPlan, setCurrentPlan] = useState("starter");
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    companyName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    vatNumber: "",
    billingEmail: "",
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadBillingData();
  }, [user]);

  const loadBillingData = async () => {
    if (!user?.organisationId) {
      setLoading(false);
      return;
    }

    try {
      const orgRef = doc(db, "organisations", user.organisationId);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const data = orgSnap.data();
        setCurrentPlan(data.plan || "starter");
        
        if (data.billingDetails) {
          setBillingDetails(data.billingDetails);
        }
      }

      // Load invoices (mock data for now)
      setInvoices([
        {
          id: "inv_001",
          invoiceNumber: "INV-2026-001",
          period: "January 2026",
          amount: 99,
          date: new Date("2026-01-01"),
          status: "Paid",
        },
        {
          id: "inv_002",
          invoiceNumber: "INV-2025-012",
          period: "December 2025",
          amount: 99,
          date: new Date("2025-12-01"),
          status: "Paid",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBillingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const orgRef = doc(db, "organisations", user.organisationId);
      await updateDoc(orgRef, {
        billingDetails,
      });
      setSuccess("Billing details saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save billing details");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePlan = async (planId: string) => {
    if (!user?.organisationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const orgRef = doc(db, "organisations", user.organisationId);
      await updateDoc(orgRef, {
        plan: planId,
      });
      setCurrentPlan(planId);
      setSuccess(`Successfully upgraded to ${planId} plan!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageContainer title="Billing">
            <div>Loading...</div>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageContainer title="Billing">
          <div className="max-w-7xl mx-auto">
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

            {/* Available Plans */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <PiCreditCard className="text-[#649DAD] text-3xl" />
                Available Plans
              </h2>
              <p className="text-gray-600 mb-8">Choose the plan that best fits your needs</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {AVAILABLE_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all hover:shadow-xl ${
                      plan.recommended
                        ? "border-[#649DAD] scale-105"
                        : currentPlan === plan.id
                        ? "border-green-500"
                        : "border-gray-200"
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-[#649DAD] to-[#4a7b8a] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                          <PiStar className="text-yellow-300" />
                          Recommended
                        </span>
                      </div>
                    )}
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600 text-lg">/month</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <FiCheck className="text-green-600 text-sm" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={currentPlan === plan.id || saving}
                      variant={currentPlan === plan.id ? "neutral" : "primary"}
                      className="w-full justify-center"
                      title={currentPlan === plan.id ? "Current Plan" : "Select Plan"}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Details */}
            <div className="mb-12">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <PiBuildings className="text-[#649DAD] text-3xl" />
                  Organisation Billing Details
                </h2>
                
                <form onSubmit={handleSaveBillingDetails} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <PiBuildings className="text-[#649DAD] text-lg" />
                        Company Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                        value={billingDetails.companyName}
                        onChange={(e) =>
                          setBillingDetails({ ...billingDetails, companyName: e.target.value })
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <PiMapPin className="text-[#649DAD] text-lg" />
                        Address
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                        value={billingDetails.address}
                        onChange={(e) =>
                          setBillingDetails({ ...billingDetails, address: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <PiMapPin className="text-[#649DAD] text-lg" />
                        City
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                        value={billingDetails.city}
                        onChange={(e) =>
                          setBillingDetails({ ...billingDetails, city: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <PiMapPin className="text-[#649DAD] text-lg" />
                        Postal Code
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                        value={billingDetails.postalCode}
                        onChange={(e) =>
                          setBillingDetails({ ...billingDetails, postalCode: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <PiMapPin className="text-[#649DAD] text-lg" />
                        Country
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                        value={billingDetails.country}
                        onChange={(e) =>
                          setBillingDetails({ ...billingDetails, country: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <PiReceipt className="text-[#649DAD] text-lg" />
                        VAT Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                        value={billingDetails.vatNumber}
                        onChange={(e) =>
                          setBillingDetails({ ...billingDetails, vatNumber: e.target.value })
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <PiEnvelope className="text-[#649DAD] text-lg" />
                        Email to Receive Invoices
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent transition-all"
                        value={billingDetails.billingEmail}
                        onChange={(e) =>
                          setBillingDetails({ ...billingDetails, billingEmail: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={saving}
                      variant="primary"
                      className="px-8"
                      title={saving ? "Saving..." : "Save Billing Details"}
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PiReceipt className="text-[#649DAD] text-3xl" />
                Billing History
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Invoice Number</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Period</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-right py-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 pr-4 font-mono text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="py-4 pr-4 text-gray-700">{invoice.period}</td>
                        <td className="py-4 pr-4 text-gray-700">{invoice.date.toLocaleDateString()}</td>
                        <td className="py-4 pr-4 font-semibold text-gray-900">${invoice.amount}</td>
                        <td className="py-4 pr-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 text-[#649DAD] hover:bg-[#649DAD]/10 rounded-lg transition-colors font-medium"
                            title="Download invoice"
                          >
                            <FiDownload size={16} />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </PageContainer>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}

"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../atom/button";

type ContactPlan = "Basic" | "Starter" | "Professional" | "Enterprise";

type ContactPayload = {
    name: string;
    email: string;
    company: string;
    plan: ContactPlan;
    message: string;
};

function openMailTo(payload: ContactPayload) {
    const subject = encodeURIComponent(`Ablelytics enquiry (${payload.plan})`);
    const body = encodeURIComponent(
        [
            `Name: ${payload.name}`,
            `Email: ${payload.email}`,
            `Company: ${payload.company || "(not provided)"}`,
            `Plan: ${payload.plan}`,
            "",
            payload.message,
        ].join("\n")
    );

    // Update recipient if you use a different contact address
    window.location.href = `mailto:privacy@ablelytics.com?subject=${subject}&body=${body}`;
}

export function ContactPageForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [plan, setPlan] = useState<ContactPlan>("Basic");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [honeypot, setHoneypot] = useState("");

    const validate = (): string | null => {
        if (honeypot) return "Bot detected";
        if (!name.trim()) return "Please enter your name";
        if (!email.trim()) return "Please enter your email";
        // simple email regex
        if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email address";
        if (!message.trim())
            return "Please add a short message describing your enquiry";
        return null;
    };

    const resetForm = () => {
        setName("");
        setEmail("");
        setCompany("");
        setMessage("");
        setPlan("Basic");
        setErrorMessage("");
        setSuccess(null);
        setHoneypot("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        const v = validate();
        if (v) {
            setErrorMessage(v);
            return;
        }

        const payload: ContactPayload = { name, email, company, plan, message };
        setLoading(true);
        setSuccess(null);

        try {
            // Try to POST to /api/contact. If your backend path differs, update it.
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSuccess(true);
                resetForm();
            } else {
                const txt = await res.text().catch(() => null);
                setErrorMessage(
                    txt ||
                        "Server rejected the request — opening email client as fallback."
                );
                openMailTo(payload);
                setSuccess(false);
            }
        } catch {
            setErrorMessage(
                "Unable to reach the server — opening your email client as fallback."
            );
            openMailTo(payload);
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* honeypot - visually hidden */}
            <label htmlFor="company_name" className="sr-only">
                Leave this field empty
            </label>
            <input
                id="company_name"
                name="company_name"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                autoComplete="off"
                tabIndex={-1}
            />

            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Contact details</h3>
                <p className="text-sm text-slate-600 mb-4">Tell us how to reach you.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-medium">
                <div>
                    <label
                        htmlFor="full_name"
                        className="block primary-text-color as-p3-text mb-1 font-semibold"
                    >
                        Full name
                    </label>
                    <input
                        id="full_name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full input"
                        placeholder="Jane Doe"
                        autoComplete="name"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="block primary-text-color as-p3-text mb-1 font-semibold"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full input"
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                    />
                </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Project details</h3>
                <p className="text-sm text-slate-600 mb-4">Share a bit about your team and goals.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-medium">
                    <div>
                        <label
                            htmlFor="company"
                            className="block primary-text-color as-p3-text mb-1 font-semibold"
                        >
                            Company (optional)
                        </label>
                        <input
                            id="company"
                            name="company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full input"
                            placeholder="Acme Agency"
                            autoComplete="organization"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="plan"
                            className="block primary-text-color as-p3-text mb-1 font-semibold"
                        >
                            Interested plan
                        </label>
                        <select
                            id="plan"
                            name="plan"
                            value={plan}
                            onChange={(e) => setPlan(e.target.value as ContactPlan)}
                            className="w-full input"
                        >
                            <option value="Basic">Basic</option>
                            <option value="Starter">Starter</option>
                            <option value="Professional">Professional</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <label
                    htmlFor="message"
                    className="block primary-text-color as-p3-text mb-1 font-semibold"
                >
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full input"
                    placeholder="Tell us what you'd like to achieve, size of site, private/staging access, or any questions"
                    required
                />
                <p className="text-xs text-slate-500 mt-2">
                    Include approximate page count and any compliance deadlines if you have them.
                </p>
            </div>

            {errorMessage ? (
                <div className="text-red-400 as-p2-text" role="alert">
                    {errorMessage}
                </div>
            ) : null}

            {success === true ? (
                <div className="text-green-300 as-p2-text" role="status">
                    Thanks — your message was sent. We'll be in touch shortly.
                </div>
            ) : null}

            {success === false ? (
                <div className="text-yellow-300 as-p2-text" role="status">
                    Message could not be sent via the site. Your email client was
                    opened as fallback.
                </div>
            ) : null}

            <div className="flex items-center gap-3">
                <Button
                    formSubmit
                    variant="primary"
                    disabled={loading}
                    title={loading ? "Sending…" : "Send message"}
                />

                <Button
                    type="button"
                    variant="neutral"
                    title="Clear"
                    onClick={resetForm}
                />
            </div>
        </form>
    );
}
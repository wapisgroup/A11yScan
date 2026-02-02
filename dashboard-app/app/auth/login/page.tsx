"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/utils/firebase";
import {
    URL_APP_DASHBOARD,
    URL_APP_WORKSPACE,
    URL_AUTH_FORGOTTEN,
    URL_AUTH_REGISTER,
} from "@/utils/urls";

import { FaApple, FaGoogle, FaMicrosoft } from "react-icons/fa";
import { AuthPopup } from "@/components/molecule/auth-popup";
import { AuthButton } from "@/components/atom/auth-button";
import { Separator } from "@/components/atom/separator";

export default function LoginPage() {
    const { login, loginWithGoogle } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        try {
            await login(email, password);
            router.replace(URL_APP_DASHBOARD);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const onGoogle = async () => {
        setError("");

        try {
            await loginWithGoogle();
            router.replace(URL_APP_WORKSPACE);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    // These providers are shown in the UI, but are not currently implemented in `useAuth()`.
    const onApple = async () => {
        setError("Apple sign-in is not implemented yet.");
    };

    const onMicrosoft = async () => {
        setError("Microsoft sign-in is not implemented yet.");
    };

    return (
        <AuthPopup title={`Sign in`}>
            <div className="flex flex-col gap-large">
                <div className="as-p2-text secondary-text-color">By continuing, you agree to our User Agreement and acknowledge that you understand the Privacy policy.</div>

                <div className="flex flex-col gap-small px-[var(--spacing-m)]">
                    <AuthButton title="Sign in with Google" icon={<FaGoogle />} onClick={onGoogle}/>
                    <AuthButton title="Sign in with Apple" icon={<FaApple />} onClick={onApple}/>
                    <AuthButton title="Sign in with Microsoft" icon={<FaMicrosoft />} onClick={onMicrosoft}/>
                </div>

                <Separator/>
                

                <div className="flex flex-col gap-medium">
                    {error && <div className="text-red-600 mb-2">{error}</div>}

                    <form onSubmit={submit}>
                      <div className="flex flex-col gap-large">
                        <div className="flex flex-col gap-medium">
                        <input
                            className="w-full input"
                            placeholder="Email"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                        <input
                            className="w-full input"
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                        </div>

                        <div className="text-sm flex flex-col gap-small">
                            <div>
                                <Link
                                    href={URL_AUTH_FORGOTTEN}
                                    className="secondary-text-color as-p2-text underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="secondary-text-color as-p2-text ">
                                Do you need an account?{" "}
                                <Link
                                    href={URL_AUTH_REGISTER}
                                    className="underline"
                                >
                                    Register
                                </Link>
                            </div>
                        </div>

                        <div className="">
                            <button type="submit" className="form-button">
                                Sign in
                            </button>
                        </div>
                      </div>
                    </form>
                </div>
            </div>
        </AuthPopup>
    );
}

import React from "react";
import { FooterNavItem } from "../atom/footer-nav-item";
import { FooterNavigation } from "../molecule/footer-navigation";
import { URL_FRONTEND_BLOG, URL_FRONTEND_CASE_STUDIES, URL_FRONTEND_CONTACT, URL_FRONTEND_COOKIES, URL_FRONTEND_DOCUMENTATION, URL_FRONTEND_FAQS, URL_FRONTEND_FEATURES, URL_FRONTEND_GUIDES, URL_FRONTEND_PRICING, URL_FRONTEND_PRIVACY, URL_FRONTEND_TERMS } from "@/app/services/urlServices";
import Link from "next/link";
import Image from "next/image";

export const LoggedOutFooter = () => {

    return (


        <footer className="">
            <div className="mx-auto py-[16px]">
                <div className="grid gap-medium md:grid-cols-[400px_auto]">
                    <div className=" md:min-w-[400px] flex flex-col gap-medium">
                        <div className="flex items-center gap-3">
                            <Image src="/web-logo-02.svg" alt="Ablelytics" width={200} height={80} priority className="h-10" />
                        </div>

                        <p className="max-w-xs text-sm leading-6 text-slate-600">
                            Automated accessibility scanning that helps you meet WCAG and legal compliance — fast.
                        </p>

                        <p className="text-xs text-slate-500">
                            Built for WCAG 2.2 · Used by public sector teams
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3">
                        <FooterNavigation title={`Navigation`}>
                            <FooterNavItem href={URL_FRONTEND_FEATURES}>Features</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_PRICING}>Pricing</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_FAQS}>FAQ</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_CONTACT}>Contact</FooterNavItem>
                        </FooterNavigation>

                        <FooterNavigation title={`Resources`}>
                            <FooterNavItem href={URL_FRONTEND_CASE_STUDIES}>Case studies</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_BLOG}>Blog</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_DOCUMENTATION}>Documentation</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_GUIDES}>Accessibility guides</FooterNavItem>
                        </FooterNavigation>

                        <FooterNavigation title={`Get in touch`}>
                            <FooterNavItem extraClass="flex gap-small items-center" href="mailto:hello@ablelytics.com">
                                <svg className="mt-0.5 h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                
                                    hello@ablelytics.com
                                
                            </FooterNavItem>
                            <li className="flex items-start gap-small">
                                <svg className="mt-0.5 h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M4 6h16v14H4V6Z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M7 10h10M7 14h10" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <span>Support hours: Mon–Fri, 9–5 GMT</span>
                            </li>
                        </FooterNavigation>
                    </div>
                </div>


                <div className="my-10 h-px w-full bg-slate-200/80"></div>


                <div className="flex flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                    <p>© 2026 A11yScan · Automated accessibility scanning</p>

                    <nav aria-label="Legal links">
                        <ul className="flex flex-wrap gap-x-6 gap-y-2">
                            <FooterNavItem href={URL_FRONTEND_PRIVACY}>Privacy</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_TERMS}>Terms</FooterNavItem>
                            <FooterNavItem href={URL_FRONTEND_COOKIES}>Cookies</FooterNavItem>
                        </ul>
                    </nav>

                    <div className="flex items-center gap-3">
                        <a
                            href="https://www.linkedin.com/company/ablelytics/"
                            className="inline-flex h-10 w-10 items-center justify-center secondary-text-color hover:underline underline-offset-[4px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            aria-label="LinkedIn"
                            target="_blank"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                <path d="M20.447 20.452H17.21v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.0V9h3.112v1.561h.045c.433-.82 1.49-1.685 3.065-1.685 3.276 0 3.88 2.156 3.88 4.96v6.616zM5.337 7.433a1.805 1.805 0 1 1 0-3.61 1.805 1.805 0 0 1 0 3.61zM6.956 20.452H3.717V9h3.239v11.452z" />
                            </svg>
                        </a>

                        <a
                            href="https://x.com/ablelytics"
                            className="inline-flex h-10 w-10 items-center justify-center secondary-text-color hover:underline underline-offset-[4px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            aria-label="X"
                            target="_blank"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                <path d="M18.9 2H21l-6.9 7.9L22 22h-6.2l-4.9-6.3L5.3 22H3.2l7.4-8.5L2 2h6.4l4.4 5.7L18.9 2Zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20Z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
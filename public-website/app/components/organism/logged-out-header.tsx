"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Button } from "../atom/button";
import Link from "next/link";
import Image from "next/image";
import { main_menu_mobile_urls, main_menu_urls, URL_AUTH_LOGIN, URL_FRONTEND_CONTACT, URL_FRONTEND_FAQS, URL_FRONTEND_FEATURES, URL_FRONTEND_PRICING } from "@/app/services/urlServices";

export const LoggedOutHeader = () => {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isMenuRendered, setIsMenuRendered] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (isMenuOpen) return;
      if (!isMenuRendered) return;

      // Allow exit animation before unmounting
      const t = window.setTimeout(() => setIsMenuRendered(false), 300);
      return () => window.clearTimeout(t);
    }, [isMenuOpen, isMenuRendered]);

    const pathname = usePathname();

    useEffect(() => {
      // Close the menu on route change
      closeMenu();
    }, [pathname]);

    useEffect(() => {
      if (!mounted) return;
      document.body.style.overflow = isMenuOpen ? "hidden" : "";
      return () => {
        document.body.style.overflow = "";
      };
    }, [isMenuOpen, mounted]);

    useEffect(() => {
      // Close on Escape
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeMenu();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const openMenu = () => {
      setIsMenuRendered(true);
      // Let the portal mount in the "closed" state, then animate open
      requestAnimationFrame(() => setIsMenuOpen(true));
    };

    const closeMenu = () => {
      setIsMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link className="flex items-center gap-4" href={`/`}>
                  <div>
                      <Image src="/web-logo-02.svg" alt="A11yScan" width={160} height={40} priority />
                  </div>
              </Link>
              <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-nav"
                  onClick={() => (isMenuOpen ? closeMenu() : openMenu())}
              >
                  {/* Hamburger / X icon */}
                  <span className="relative block h-5 w-6">
                      <span
                          className={`absolute left-0 top-0 block h-0.5 w-6 bg-current transition-transform duration-200 ${
                              isMenuOpen ? "translate-y-2 rotate-45" : ""
                          }`}
                      />
                      <span
                          className={`absolute left-0 top-2 block h-0.5 w-6 bg-current transition-opacity duration-200 ${
                              isMenuOpen ? "opacity-0" : "opacity-100"
                          }`}
                      />
                      <span
                          className={`absolute left-0 top-4 block h-0.5 w-6 bg-current transition-transform duration-200 ${
                              isMenuOpen ? "-translate-y-2 -rotate-45" : ""
                          }`}
                      />
                  </span>
              </button>

              <nav className="hidden md:flex items-center gap-8 text-slate-600 font-medium">
                {main_menu_urls.map((item) => (
                    <Link
                    key={item.url}
                    href={item.url}
                    className="main-menu-item"
                    >
                    {item.title}
                    </Link>
                ))}
                <Link href={URL_AUTH_LOGIN}>
                    <Button variant="secondary" title={`Log in`} />
                </Link>

            </nav>
            {/* Mobile menu */}
            {mounted && isMenuRendered
                ? createPortal(
                    <div
                        id="mobile-nav"
                        className={`md:hidden fixed inset-0 z-[99999] bg-slate-500/50 backdrop-blur shadow-2xl flex justify-end transition-opacity duration-300 ${
                          isMenuOpen ? "opacity-100" : "opacity-0"
                        }`}
                        onClick={() => closeMenu()}
                    >
                        <div
                            className={`w-full max-w-[90%] border border-white/10 bg-slate-950 px-10 py-4 gap-large flex flex-col transform transition-transform duration-300 ease-out ${
                              isMenuOpen ? "translate-x-0" : "translate-x-full"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <div className="">
                                     <Image src="/web-logo-02.svg" alt="Ablelytics" width={160} height={40} priority />
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                    aria-label="Close menu"
                                    onClick={() => closeMenu()}
                                >
                                    <span className="text-xl leading-none">×</span>
                                </button>
                            </div>
                            <nav className="flex flex-col gap-3 text-slate-200">
                                {main_menu_mobile_urls.map((item) => (
                                    <Link
                                    key={item.url}
                                    href={item.url}
                                    className="main-menu-item-mobile"
                                    onClick={() => closeMenu()}
                                    >
                                    {item.title}
                                    </Link>
                                ))}

                                <div className="pt-2 text-right">
                                    <Link href={URL_AUTH_LOGIN} onClick={() => closeMenu()}>
                                        <Button variant="secondary" title={`Log in`} />
                                    </Link>
                                </div>
                            </nav>
                        </div>
                    </div>,
                    document.body
                )
                : null}
            </div>
          </div>
        </header>
    )
}
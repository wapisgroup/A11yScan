import type { ReactNode } from "react";
import Link from "next/link";

type FooterNavItemProps = {
    href?: string;
    extraClass?: string;
    children: ReactNode;
};

export function FooterNavItem({
    href = "#",
    extraClass = "",
    children,
}: FooterNavItemProps) {
    return (
        <li>
            <Link
                href={href}
                className={`secondary-text-color hover:underline underline-offset-[4px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${extraClass}`}
            >
                {children}
            </Link>
        </li>
    );
}
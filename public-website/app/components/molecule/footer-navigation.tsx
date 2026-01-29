import type { ReactNode } from "react";

type FooterNavigationProps = {
    title: ReactNode;
    children: ReactNode;
};

export function FooterNavigation({ title, children }: FooterNavigationProps) {
    return (
        <nav
            aria-label="Footer navigation"
            className="flex flex-col gap-small"
        >
            <h3 className="as-p2-text font-semibold text-slate-900">
                {title}
            </h3>
            <ul className="space-y-2 text-sm">
                {children}
            </ul>
        </nav>
    );
}
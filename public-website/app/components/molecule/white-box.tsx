import type { ReactNode } from "react";

type WhiteBoxProps = {
    withShadow?: boolean;
    extraClass?: string;
    largeRounded?: boolean;
    children: ReactNode;
};

export function WhiteBox({
    withShadow = false,
    extraClass = "",
    largeRounded = false,
    children,
}: WhiteBoxProps) {
    let baseClasses = "bg-white border border-slate-100 flex flex-col";

    if (withShadow) baseClasses += " shadow";
    if (extraClass) baseClasses += ` ${extraClass}`;
    baseClasses += largeRounded
        ? " rounded-xl p-[var(--spacing-m-p)]"
        : " rounded-lg p-[var(--spacing-m)]";

    return <div className={baseClasses}>{children}</div>;
}
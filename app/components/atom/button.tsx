import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "neutral" | "link" | "danger" | "brand";
type ButtonSize = "small" | "normal";

type ButtonProps = {
    title: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    formSubmit?: boolean;
    /** When true, only displays the icon with a tooltip on hover */
    icon?: ReactNode;
    /** Optional badge number to display in top-right corner */
    badge?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
    title,
    icon,
    badge,
    formSubmit = false,
    variant = "primary",
    size = "normal",
    disabled = false,
    className,
    type,
    ...rest
}: ButtonProps) {
    const baseClasses =
        "inline-flex items-center gap-2.5 rounded-lg font-inter font-normal leading-[120%] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses: Record<ButtonVariant, string> = {
        primary:
            "text-white bg-gradient-to-r from-cyan-400 to-purple-600 " +
            "hover:from-red-500 hover:to-red-500 " +
            "focus-visible:ring-white",

        secondary:
            "primary-text-color bg-white border border-slate-200 " +
            "hover:bg-slate-100 " +
            "focus-visible:ring-black",

        neutral:
            "primary-text-color bg-slate-100 " +
            "hover:bg-slate-200 " +
            "focus-visible:ring-slate-500",

        link:
            "as-p2-text secondary-text-color underline underline-offset-[4px] transition-all duration-300 " +
            "hover:underline-offset-[6px] " +
            "focus-visible:ring-slate-500",

        danger:
            "bg-[var(--color-error)] text-white border border-[var(--color-error)] " +
            "hover:bg-red-600 " +
            "focus-visible:ring-red-500",
            
        brand:
            "bg-brand text-white " +
            "hover:bg-brand-hover " +
            "focus-visible:ring-brand",
    };

    const sizeClasses: Record<ButtonSize, string> = {
        small: "px-3 py-1 rounded-md as-p3-text",
        normal: "px-4 py-2 as-p2-text",
    };

    // Icon-only mode uses square padding
    const iconOnlySizeClasses: Record<ButtonSize, string> = {
        small: "p-1.5 rounded-md",
        normal: "p-2 rounded-lg",
    };

    const isIconOnly = Boolean(icon);

    // Icon-only variants with no borders
    const iconOnlyVariantClasses: Record<ButtonVariant, string> = {
        primary:
            "text-white bg-gradient-to-r from-cyan-400 to-purple-600 " +
            "hover:from-red-500 hover:to-red-500 " +
            "focus-visible:ring-white",

        secondary:
            "primary-text-color bg-transparent hover:bg-slate-100 focus-visible:ring-black",

        neutral:
            "primary-text-color bg-transparent hover:bg-slate-200 focus-visible:ring-slate-500",

        link:
            "secondary-text-color hover:text-slate-900 focus-visible:ring-slate-500",

        danger:
            "text-[var(--color-error)] bg-transparent hover:bg-red-50 focus-visible:ring-red-500",
            
        brand:
            "brand-color bg-transparent hover:bg-brand-light focus-visible:ring-brand",
    };

    // Badge colors based on variant
    const badgeColorClasses: Record<ButtonVariant, string> = {
        primary: "bg-[var(--color-info)]",
        secondary: "bg-slate-500",
        neutral: "bg-slate-500",
        link: "bg-slate-500",
        danger: "bg-[var(--color-error)]",
        brand: "bg-brand",
    };

    return (
        <button
            type={type ?? (formSubmit ? "submit" : "button")}
            disabled={disabled}
            className={[
                baseClasses,
                isIconOnly ? iconOnlyVariantClasses[variant] : variantClasses[variant],
                isIconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
                isIconOnly && "group relative",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            aria-label={typeof title === "string" ? title : undefined}
            {...rest}
        >
            {isIconOnly ? (
                <>
                    {icon}
                    {/* Badge */}
                    {badge !== undefined && badge > 0 && (
                        <span className={`absolute -top-1 -right-1 ${badgeColorClasses[variant]} text-white as-p3-text rounded-full w-5 h-5 flex items-center justify-center`}>
                            {badge}
                        </span>
                    )}
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white as-p3-text rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {title}
                    </span>
                </>
            ) : (
                title
            )}
        </button>
    );
}
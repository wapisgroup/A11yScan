import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "neutral" | "link";
type ButtonSize = "small" | "normal";

type ButtonProps = {
    title: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    formSubmit?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
    title,
    formSubmit = false,
    variant = "primary",
    size = "normal",
    disabled = false,
    className,
    type,
    ...rest
}: ButtonProps) {
    const baseClasses =
        "inline-flex items-center gap-2.5 rounded-lg font-inter text-base font-normal leading-[120%] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses: Record<ButtonVariant, string> = {
        primary:
            "text-white bg-gradient-to-r from-cyan-400 to-purple-600 " +
            "hover:from-red-500 hover:to-red-500 " +
            "focus-visible:ring-white",

        secondary:
            "text-slate-700 bg-white border border-slate-200 " +
            "hover:bg-slate-100 " +
            "focus-visible:ring-black",

        neutral:
            "text-slate-700 bg-slate-100 " +
            "hover:bg-slate-200 " +
            "focus-visible:ring-slate-500",

        link:
            "as-p2-text secondary-color-text underline underline-offset-[4px] px-0 py-0 transition-all duration-300 " +
            "hover:underline-offset-[6px] " +
            "focus-visible:ring-slate-500",
    };

    const sizeClasses: Record<ButtonSize, string> = {
        small: "px-3 py-1 rounded-md text-sm",
        normal: "px-4 py-2",
    };

    return (
        <button
            type={type ?? (formSubmit ? "submit" : "button")}
            disabled={disabled}
            className={[
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...rest}
        >
            {title}
        </button>
    );
}
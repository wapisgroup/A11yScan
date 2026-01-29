import type { ReactNode } from "react";

type TextBlockProps = {
    title: ReactNode;
    children: ReactNode;
};

export function TextBlock({ title, children }: TextBlockProps) {
    return (
        <div className="flex flex-col gap-medium">
            <h2 className="as-h4-text primary-text-color">{title}</h2>
            <div className="as-p2-text secondary-text-color text-content flex flex-col gap-small">
                {children}
            </div>
        </div>
    );
}
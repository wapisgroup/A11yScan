import type { ReactNode } from "react";

type SectionTitleProps = {
    title: ReactNode;
    text?: ReactNode;
};

export function SectionTitle({ title, text }: SectionTitleProps) {
    return (
        <div className="flex flex-col gap-medium">
            <h2 className="as-h3-text primary-text-color">{title}</h2>
            {text ? <p className="secondary-text-color">{text}</p> : null}
        </div>
    );
}
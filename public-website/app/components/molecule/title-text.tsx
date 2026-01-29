import type { ReactNode } from "react";

type TitleTextProps = {
    title: ReactNode;
    children?: ReactNode;
};

export function TitleText({ title, children }: TitleTextProps) {
    return (
        <div className="flex flex-col items-start gap-medium">
            <h2 className="as-h1-text primary-text-color">{title}</h2>
            {children ? (
                <p className="as-p1-text secondary-text-color max-w-prose">
                    {children}
                </p>
            ) : null}
        </div>
    );
}
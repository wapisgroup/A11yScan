import type { ReactNode } from "react";
import { WhiteBox } from "./white-box";

type FeatureBoxProps = {
    title?: ReactNode;
    text?: ReactNode;
    children?: ReactNode;
};

export function FeatureBox({ title, text, children }: FeatureBoxProps) {
    return (
        <WhiteBox extraClass="gap-medium" largeRounded>
            {title ? (<h3 className="as-h4-text font-semibold primary-text-color">
                {title}
            </h3>) : null}
            {text ? (
                <p className="as-p2-text secondary-text-color">{text}</p>
            ) : null}
            {children}
        </WhiteBox>
    );
}
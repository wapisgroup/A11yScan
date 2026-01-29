import { WhiteBox } from "./white-box"

export const FeatureBox = ({title, text, children}) => {
    return (
        <WhiteBox extraClass="gap-medium" largeRounded>
            <h3 className="as-h4-text font-semibold primary-text-color">{title}</h3>
            {text && <p className="as-p2-text secondary-text-color">{text}</p>}
            {children}
        </WhiteBox>
    )
}
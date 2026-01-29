export const TitleText = ({title, children}) => {
    return (
        <div className="flex flex-col items-start gap-medium">
            <h2 className="as-h1-text primary-text-color">{title}</h2>
            <p className="as-p1-text secondary-text-color max-w-prose">{children}</p>
        </div>
    )
}
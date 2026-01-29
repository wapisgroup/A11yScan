export const FooterNavItem = ({href = '#', extraClass=' ',children}) => {
    return (
        <li><a className={`text-slate-600 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${extraClass}`} href={href}>{children}</a></li>
    )
}
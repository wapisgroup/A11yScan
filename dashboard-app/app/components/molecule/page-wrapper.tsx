/**
 * Page Wrapper
 * Shared component in molecule/page-wrapper.tsx.
 */

type PageWrapperProps = {
    title: string;
    breadcrumbs?: { title: string; href?: string }[];
    children: React.ReactNode;
};
export const PageWrapper = ({ title, breadcrumbs, children }: PageWrapperProps) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 ">{title}</h1>
                {breadcrumbs && (
                    <nav className="mt-2" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 as-p3-text text-gray-600">
                            {breadcrumbs.map((crumb, index) => (
                                <li key={index}>
                                    {crumb.href ? (
                                        <a href={crumb.href} className="hover:underline underline-offset-4">
                                            {crumb.title}
                                        </a>
                                    ) : (
                                        <span className="text-gray-500">{crumb.title}</span>
                                    )}
                                    {index < breadcrumbs.length - 1 && (
                                        <span className="mx-2 text-gray-400">/</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>
            {children}
        </div>
    );
}
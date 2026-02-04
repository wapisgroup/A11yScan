type PageWrapperProps = {
    title: string;
    children: React.ReactNode;
};  
export const PageWrapper = ({title, children }: PageWrapperProps) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
        
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
            {children}
        </div>
    );
}
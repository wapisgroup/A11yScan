import type { ReactNode } from "react";



export const LoggedOutLayout = ({ children }: {children: ReactNode}) => {
    return (
        <div
            className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white text-slate-900"
        >
            <div className="max-w-[1120px] mx-auto px-[24px] py-[40px] gap-[30px] flex flex-col">
                {children}
            </div>
        </div>
    );
};
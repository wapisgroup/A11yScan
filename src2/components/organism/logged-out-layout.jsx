import React from "react";
export default function LoggedOutLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white text-slate-900
                dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
            <div className="max-w-[1120px] mx-auto px-[24px] py-[40px] gap-[30px] flex flex-col">{children}</div>
        </div>
    )
}
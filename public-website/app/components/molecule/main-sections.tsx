import type { ReactNode } from "react";

type MainSectionsProps = {
    children: ReactNode;
};

export function MainSections({ children }: MainSectionsProps) {
    return (
        <main className="flex flex-col gap-[120px] py-12">
            {children}
        </main>
    );
}
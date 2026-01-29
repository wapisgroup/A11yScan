import type { ReactNode } from "react";

type FAQItemProps = {
    title: ReactNode;
    category?: ReactNode | null;
    openFaq?: number;
    toggleIndex?: number;
    toggle?: (index: number) => void;
    children?: ReactNode;
};

export function FAQItem({
    title,
    toggle = () => {},
    openFaq = -1,
    toggleIndex = 0,
    category = null,
    children,
}: FAQItemProps) {
    const isOpen = openFaq === toggleIndex;
    const contentId = `faq-item-content-${toggleIndex}`;

    return (
        <div className="border rounded-lg overflow-hidden border-slate-200 ">
            <button
                type="button"
                onClick={() => toggle(toggleIndex)}
                className="w-full px-4 py-3 flex items-center justify-between bg-transparent text-slate-800"
                aria-expanded={isOpen}
                aria-controls={contentId}
            >
                <div className="flex flex-col items-start gap-small text-left">
                    <span className="font-semibold as-p2-text">{title}</span>
                    {category ? (
                        <div className="as-p3-text secondary-text-color">{category}</div>
                    ) : null}
                </div>

                <span className="secondary-text-color" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                </span>
            </button>

            <div
                id={contentId}
                className={`as-p2-text px-4 py-3 secondary-text-color ${isOpen ? "block" : "hidden"}`}
            >
                {children}
            </div>
        </div>
    );
}
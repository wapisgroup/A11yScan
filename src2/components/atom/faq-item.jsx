export function FAQItem({ title, toggle = () => {}, openFaq = -1, toggleIndex = 0, category = null, children }) {
    return (
        <div className="border rounded-lg overflow-hidden border-slate-100">
            <button onClick={() => toggle(toggleIndex)} className="w-full px-4 py-3 flex items-center justify-between bg-transparent text-slate-800">
                <div className="flex flex-col items-start gap-small">
                    <span className="font-semibold as-p2-text">{title}</span>
                    {category && <div className="as-p3-text secondary-text-color">{category}</div>}
                </div>
                    
                <span className="secondary-text-color">{openFaq === toggleIndex ? '−' : '+'}</span>
            </button>
            <div className={`as-p2-text px-4 py-3 text-slate-600 ${openFaq === toggleIndex ? 'block' : 'hidden'}`}>{children}</div>
        </div>
    )
}
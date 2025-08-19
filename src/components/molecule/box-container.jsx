// src/components/BoxContainer.jsx
import React, { useId, useRef } from "react";

/**
 * BoxContainer
 *
 * Props:
 *  - title: string | ReactNode (required)
 *  - children: ReactNode (required) -> goes into .box-container-inner
 *  - className: additional classes for outer container (optional)
 *  - headerAction: ReactNode (optional) -> an element rendered on the right side of the header (e.g. a + button)
 *
 * Accessibility:
 *  - The region has role="region" and aria-labelledby pointing to the header.
 */
export default function BoxContainer({ title, className = "", children, headerAction = null }) {
    const generatedId = useId();
    const contentId = `box-content-${generatedId}`;
    const headerId = `box-header-${generatedId}`;
    const contentRef = useRef(null);

    return (
        <div
            className={`box-container ${className || ""}`}
            role="region"
            aria-labelledby={headerId}
        >
            <div className="px-4">
                <div id={headerId} className="flex items-center justify-between">
                    <h2 className="m-0 text-[12px] pt-2 pb-2 font-light text-slate-900 dark:text-slate-100">
                        {title}
                    </h2>

                    {headerAction ? (
                        <div className="ml-4 flex items-center" aria-hidden={typeof headerAction === 'string'}>
                            {headerAction}
                        </div>
                    ) : null}
                </div>
            </div>

            <div id={contentId} ref={contentRef} className="box-container-inner">
                {children}
            </div>
        </div>
    );
}
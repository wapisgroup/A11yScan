// src/components/BoxContainer.jsx
import React, {useId, useRef, useState, useLayoutEffect} from "react";

/**
 * BoxContainer
 *
 * Props:
 *  - title: string | ReactNode (required)
 *  - children: ReactNode (required) -> goes into .box-container-inner
 *
 * Accessibility:
 *  - If collapsible, the header becomes a button with aria-expanded and aria-controls.
 *  - The region has role="region" and aria-labelledby.
 */
export default function BoxContainer({
                                         title,
                                         children

                                     }) {
    const generatedId = useId();
    const contentId = `box-content-${generatedId}`;
    const headerId = `box-header-${generatedId}`;
    const contentRef = useRef(null);

    // keyboard handler for header-button if needed (Enter/Space are handled by button by default)
    return (
        <div
            className={`box-container`}
            role="region"
            aria-labelledby={headerId}
        >
            <div className="px-4 py-3">
                <div id={headerId} className="flex items-center justify-between">
                    <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
                        {title}
                    </h2>
                </div>
            </div>

            <div
                id={contentId}
                ref={contentRef}
                className="box-container-inner px-4 pb-4 pt-0 text-sm text-slate-700 dark:text-slate-300"
            >
                {children}
            </div>
        </div>
    );
}
import {StatPill} from "../atom/stat-pill";
import React from "react";

export function ProjectDetailStats({stats}) {
    return (
        <div className="flex gap-small items-center">
            <StatPill label="Pages" value={stats.pagesTotal} type="info"/>
            <StatPill label="Scanned" value={stats.pagesScanned} type="info"/>
            <StatPill label="Critical" value={stats.critical} type="critical"/>
            <StatPill label="Serious" value={stats.serious} type="serious"/>
            <StatPill label="Moderate" value={stats.moderate} type="moderate"/>
            <StatPill label="Minor" value={stats.minor} type="minor"/>
        </div>
    )
}

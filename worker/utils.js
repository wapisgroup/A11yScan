// utils.js
function computeSummary(results) {
    const summary = { totalPages: 0, totalViolations: 0, byImpact: {}, byRule: {} };
    for (const url in results) {
        const item = results[url];
        summary.totalPages++;
        if (item && item.results && item.results.violations) {
            for (const v of item.results.violations) {
                const impact = v.impact || 'moderate';
                summary.byImpact[impact] = (summary.byImpact[impact] || 0) + (v.nodes ? v.nodes.length : 1);
                const id = v.id;
                if (!summary.byRule[id]) summary.byRule[id] = { id, description: v.description, impact: v.impact, count: 0 };
                summary.byRule[id].count += (v.nodes ? v.nodes.length : 1);
                summary.totalViolations += (v.nodes ? v.nodes.length : 1);
            }
        }
    }
    summary.byRule = Object.values(summary.byRule).sort((a,b)=>b.count-a.count);
    return summary;
}

module.exports = { computeSummary };
import { UITooltip } from "../ui/ui-tooltip";

const colorTypes: Record<string, { bg: string, text: string }> = {
    critical: { bg: 'bg-red-600', text: 'text-white' },
    serious: { bg: 'bg-orange-500', text: 'text-white' },
    moderate: { bg: 'bg-amber-500', text: 'text-white' },
    minor: { bg: 'bg-slate-500', text: 'text-white' },
};

const roundedTypes: Record<string, string> = {
    none: '',
    start: 'rounded-s',
    end: 'rounded-e',
}


export const TableErrorBadge = ({ count, type, rounded = 'none', tooltip }: { count: number, type: string, rounded?: string, tooltip?: string }) => {

    const block = (<span className={`cursor-default opacity-75 inline-flex items-center justify-center min-w-[30px] px-2 py-1 ${colorTypes[type]?.bg} ${colorTypes[type]?.text} ${roundedTypes[rounded]} as-p3-text`}>
        {count}
    </span>);

    if (!tooltip) return block;
    return <UITooltip text={tooltip}>{block}</UITooltip>;

}
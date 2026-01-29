import type { ReactElement } from "react";

type ColorSet = 1 | 2;

type ErrorStatsProps = {
    type?: string;
    number?: number;
    colorSet?: ColorSet;
};

const COLOR_SETS: Record<ColorSet, string> = {
    1: "[background:linear-gradient(90deg,#EF4444_0%,#FACC15_100%)]",
    2: "[background:linear-gradient(90deg,#22D3EE_0%,#9333EA_100%)]",
};

export function ErrorStats({
    type = "Critical",
    number = 0,
    colorSet = 1,
}: ErrorStatsProps): ReactElement {
    const resolvedColorSet: ColorSet = colorSet === 2 ? 2 : 1;

    return (
        <div className="flex flex-col justify-center items-start gap-small flex-[1_0_0]">
            <div className="flex justify-between items-start self-stretch">
                <span className="as-p2-text text-slate-500">{type}</span>
                <span className="as-p2-text text-slate-800 font-bold">{number}</span>
            </div>
            <div className={`w-[80%] h-2 rounded-[99px] ${COLOR_SETS[resolvedColorSet]}`}></div>
        </div>
    );
}
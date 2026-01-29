import React from "react";

type SeparatorProps = {
  title?: string;
};

export function Separator({ title = "or" }: SeparatorProps) {
  return (
    <div className="grid grid-cols-[auto_50px_auto] gap-small">
      <div className="flex items-center">
        <div className="w-full border-b bg-[#F0F0F0]  border-solid h-px" />
      </div>
      <div className="text-gray-400 text-center">{title}</div>
      <div className="flex items-center">
        <div className="w-full border-b bg-[#F0F0F0]  border-solid h-px" />
      </div>
    </div>
  );
}
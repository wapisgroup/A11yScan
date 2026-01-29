import React, { type ReactNode } from "react";

type AuthPopupProps = {
  title: ReactNode;
  children: ReactNode;
};

export function AuthPopup({ title, children }: AuthPopupProps) {
  return (
    <div className="justify-center h-full flex flex-col items-center">
      <div className="max-w-md rounded-xl shadow-xl bg-[#F0F0F0]">
        <h2 className="as-h3-text primary-text-color p-[var(--spacing-m)] border-b border-[#DEDEDE] border-solid">
          {title}
        </h2>
        <div className="p-[var(--spacing-l)] flex flex-col gap-small">{children}</div>
      </div>
    </div>
  );
}
import React, { type ReactNode } from "react";

type AuthButtonProps = {
  onClick: () => void | Promise<void>;
  icon: ReactNode;
  title: string;
  type?: "button" | "submit" | "reset";
};

export function AuthButton({
  onClick,
  icon,
  title,
  type = "button",
}: AuthButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-[var(--spacing-m)] py-[var(--spacing-s)] bg-white text-black rounded-full"
    >
      <div className="grid grid-cols-[50px_auto]">
        <div className="flex items-center h-[24px] w-[24px]">
          <span className="inline-flex h-[24px] w-[24px] items-center justify-center">{icon}</span>
        </div>
        <div className="text-sm pr-[50px]">{title}</div>
      </div>
    </button>
  );
}
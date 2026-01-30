import { ProjectTabKey } from "@lib/types/project";

 type TabButtonProps = {
  tabKey: ProjectTabKey;
  selected: boolean;
  onClick: (key: ProjectTabKey) => void;
};

export const TabButton = ({ tabKey, selected = false, onClick }: TabButtonProps) => {
  return (
    <button
      type="button"
      onClick={() => onClick(tabKey)}
      className={
        "px-4 py-1 -mb-px as-p2-text primary-text-color " +
        (selected
          ? "border-solid border-t border-l border-r border-[#DCE3EE] border-b-[3px] border-b-[#628BEB] rounded-md bg-[#E5ECF8] text-[#344489]"
          : "")
      }
    >
      {tabKey[0].toUpperCase() + tabKey.slice(1)}
    </button>
  );
};
import { PiSpinner } from "react-icons/pi";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--spacing-xl)] gap-medium">
      <PiSpinner className="text-5xl brand-color animate-spin" />
      <p className="as-p2-text secondary-text-color">{message}</p>
    </div>
  );
}

export interface ModeChipProps {
  label: string;
}

export function ModeChip({ label }: ModeChipProps): JSX.Element {
  return (
    <div className="mx-auto w-fit rounded-full bg-bg-surface px-4 py-1 text-base font-bold text-text-secondary">
      {label}
    </div>
  );
}

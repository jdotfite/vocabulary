import { Surface } from "@/design-system/primitives/Surface";

interface PracticeModeCardProps {
  title: string;
  description: string;
  icon: string;
  fullWidth?: boolean;
  onClick?: () => void;
}

export function PracticeModeCard({
  title,
  description,
  icon,
  fullWidth,
  onClick
}: PracticeModeCardProps): JSX.Element {
  if (fullWidth) {
    return (
      <button className="w-full text-left" onClick={onClick} type="button">
        <Surface className="flex items-center gap-3 p-4" variant="card">
          <span className="text-2xl">{icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-text-primary">{title}</p>
            <p className="text-sm text-text-secondary">{description}</p>
          </div>
        </Surface>
      </button>
    );
  }

  return (
    <button className="w-full text-left" onClick={onClick} type="button">
      <Surface className="flex h-[90px] flex-col justify-between p-3" variant="default">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-bold text-text-primary">{title}</p>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </Surface>
    </button>
  );
}

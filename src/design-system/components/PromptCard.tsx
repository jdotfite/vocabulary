import clsx from "clsx";
import { useMemo } from "react";

export interface PromptCardProps {
  text: string;
  modeLabel?: string;
  questionId?: string;
}

/** Simple deterministic hash → [0, 1) float */
function seededRandom(seed: string, index: number): number {
  let h = 0x811c9dc5;
  const str = `${seed}-${index}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

interface LayerStyle {
  rotation: number;
  opacity: number;
  inset: number;
}

const LAYER_INSETS: readonly [number, number, number] = [-6, -3, -1];

function generateLayers(questionId: string): LayerStyle[] {
  return LAYER_INSETS.map((inset, i) => ({
    rotation: lerp(-4, 4, seededRandom(questionId, i * 3)),
    opacity: lerp(0.12, 0.5, seededRandom(questionId, i * 3 + 1)),
    inset
  }));
}

const DEFAULT_LAYERS: LayerStyle[] = [
  { rotation: 3, opacity: 0.2, inset: -6 },
  { rotation: -2, opacity: 0.35, inset: -3 },
  { rotation: 1, opacity: 0.15, inset: -1 }
];

export function PromptCard({ text, modeLabel, questionId }: PromptCardProps): JSX.Element {
  const layers = useMemo(
    () => (questionId ? generateLayers(questionId) : DEFAULT_LAYERS),
    [questionId]
  );

  return (
    <div className="space-y-3">
      {modeLabel ? (
        <div className="mx-auto w-fit rounded-full bg-bg-surface px-3.5 py-1 text-sm font-semibold text-text-secondary">
          {modeLabel}
        </div>
      ) : null}
      <div className="relative">
        {layers.map((layer, i) => (
          <div
            className="absolute rounded-card bg-bg-surface"
            key={i}
            style={{
              inset: `${layer.inset}px`,
              transform: `rotate(${layer.rotation}deg)`,
              opacity: layer.opacity
            }}
          />
        ))}
        <div
          className={clsx(
            "relative rounded-card bg-bg-surface px-6 py-12",
            "text-center text-xl font-normal text-text-primary"
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

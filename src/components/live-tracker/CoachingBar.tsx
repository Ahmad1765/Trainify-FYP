import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

export type CoachTone = 'good' | 'warn' | 'info';

interface CoachingBarProps {
  text: string;
  tone: CoachTone;
  /** 0–1 range-of-motion, or null to show a "hold/steady" state. */
  progress: number | null;
}

const toneStyles: Record<CoachTone, { wrap: string; icon: JSX.Element; bar: string }> = {
  good: {
    wrap: 'border-fitness-success/40 bg-fitness-success/10 text-fitness-success',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
    bar: 'bg-fitness-success',
  },
  warn: {
    wrap: 'border-fitness-error/40 bg-fitness-error/10 text-white',
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-fitness-error" />,
    bar: 'bg-fitness-error',
  },
  info: {
    wrap: 'border-white/10 bg-white/[0.04] text-fitness-gray',
    icon: <Info className="h-4 w-4 shrink-0" />,
    bar: 'bg-fitness-green',
  },
};

/** Live coaching cue + range-of-motion meter (bottom-center of the HUD). */
const CoachingBar = ({ text, tone, progress }: CoachingBarProps) => {
  const t = toneStyles[tone];
  const pct = progress === null ? 0 : Math.round(progress * 100);
  return (
    <div className={`pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-2.5 shadow-elevation-2 backdrop-blur-md ${t.wrap}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {t.icon}
        <span className="truncate">{text}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        {progress === null ? (
          <div className="h-full w-full animate-pulse bg-fitness-green/40" />
        ) : (
          <div
            className={`h-full rounded-full transition-[width] duration-150 ease-out ${t.bar}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default CoachingBar;

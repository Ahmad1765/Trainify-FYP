interface RepCounterCardProps {
  repCount: number;
  exerciseName: string;
  elapsedLabel: string;
}

/** Glass rep-counter card for the immersive stage (bottom-left of the HUD). */
const RepCounterCard = ({ repCount, exerciseName, elapsedLabel }: RepCounterCardProps) => (
  <div className="pointer-events-auto rounded-2xl border border-white/10 bg-fitness-black/70 px-4 py-3 shadow-elevation-3 backdrop-blur-md">
    <div className="flex items-end gap-3">
      <div className="text-4xl font-extrabold leading-none text-fitness-green tabular-nums drop-shadow-[0_0_12px_rgba(31,221,128,0.35)] sm:text-5xl">
        {repCount}
      </div>
      <div className="pb-0.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-fitness-gray sm:text-xs">
          Reps
        </div>
        <div className="max-w-[9rem] truncate text-xs font-medium text-white/90 sm:text-sm">
          {exerciseName}
        </div>
      </div>
    </div>
    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium tabular-nums text-fitness-gray">
      <span className="h-1.5 w-1.5 rounded-full bg-fitness-green/70" />
      {elapsedLabel}
    </div>
  </div>
);

export default RepCounterCard;

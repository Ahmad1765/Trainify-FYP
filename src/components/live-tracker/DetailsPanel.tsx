import { X, XCircle, CheckCircle2 } from "lucide-react";
import { getCoaching } from "@/lib/formFeedback";
import type { Workout } from "@/lib/workouts";

interface DetailsPanelProps {
  open: boolean;
  workout: Workout;
  onClose: () => void;
}

/** Slide-in exercise details over the immersive stage. Camera never unmounts. */
const DetailsPanel = ({ open, workout, onClose }: DetailsPanelProps) => {
  const coaching = getCoaching(workout.id);
  return (
    <>
      {/* Scrim */}
      <div
        className={`absolute inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        className={`absolute inset-y-0 right-0 z-30 flex w-[min(88%,22rem)] transform flex-col border-l border-white/10 bg-fitness-card-bg/95 shadow-elevation-3 backdrop-blur-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{workout.name}</h3>
            <span className="text-[11px] text-fitness-gray">{workout.level}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-white transition-colors hover:border-fitness-green/40"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {workout.targetMuscles.map((m) => (
              <span key={m} className="rounded-full bg-fitness-dark-gray px-3 py-1 text-xs text-white/80">
                {m}
              </span>
            ))}
          </div>

          <div className="rounded-lg border border-fitness-green/25 bg-fitness-green/10 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fitness-green" />
              <div>
                <h4 className="text-sm font-medium text-fitness-green">Form focus</h4>
                <p className="mt-1 text-sm text-fitness-gray">{coaching.cue}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-white">How to do it right</h4>
            <ul className="space-y-2 text-sm">
              {workout.instructions.map((ins, i) => (
                <li key={i} className="flex items-start text-fitness-gray">
                  <span className="mr-2 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fitness-green/20 text-xs text-fitness-green">
                    {i + 1}
                  </span>
                  {ins}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-white">Avoid these mistakes</h4>
            <ul className="space-y-2 text-sm">
              {coaching.mistakes.map((m, i) => (
                <li key={i} className="flex items-start text-fitness-gray">
                  <XCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-fitness-error" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-white">Tutorial video</h4>
            <div className="aspect-video overflow-hidden rounded-lg bg-fitness-dark-gray">
              <iframe
                src={workout.videoUrl}
                className="h-full w-full"
                title={`${workout.name} tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DetailsPanel;

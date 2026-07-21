import {
  CheckCircle2, XCircle, Info, Volume2, VolumeX,
  Play, Pause, RefreshCw, Aperture, X,
} from "lucide-react";
import RepCounterCard from "./RepCounterCard";
import CoachingBar, { type CoachTone } from "./CoachingBar";

interface TrackerHUDProps {
  repCount: number;
  exerciseName: string;
  elapsedLabel: string;
  isGoodForm: boolean | null;
  coachText: string;
  coachTone: CoachTone;
  romProgress: number | null;
  isPaused: boolean;
  isSoundEnabled: boolean;
  onPause: () => void;
  onReset: () => void;
  onCapture: () => void;
  onToggleSound: () => void;
  onOpenDetails: () => void;
  onExit: () => void;
}

const iconBtn =
  "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-fitness-black/70 text-white shadow-elevation-2 backdrop-blur-md transition-colors hover:border-fitness-green/40";

/** Floating glass HUD over the immersive camera stage. Presentational only. */
const TrackerHUD = ({
  repCount, exerciseName, elapsedLabel, isGoodForm, coachText, coachTone,
  romProgress, isPaused, isSoundEnabled, onPause, onReset, onCapture,
  onToggleSound, onOpenDetails, onExit,
}: TrackerHUDProps) => (
  <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-5">
    {/* Top-left: LIVE */}
    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-fitness-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-glow-sm backdrop-blur-md sm:left-5 sm:top-5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fitness-error opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-fitness-error" />
      </span>
      Live
    </div>

    {/* Top-right: form status + actions */}
    <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-5 sm:top-5">
      {isGoodForm !== null && (
        <div className={`pointer-events-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-elevation-2 backdrop-blur-md ${
          isGoodForm
            ? "border-fitness-success/40 bg-fitness-success/15 text-fitness-success"
            : "border-fitness-error/40 bg-fitness-error/15 text-fitness-error"
        }`}>
          {isGoodForm ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span className="hidden sm:inline">{isGoodForm ? "Good Form" : "Adjust Form"}</span>
        </div>
      )}
      <button className={iconBtn} onClick={onOpenDetails} aria-label="Exercise details" title="Details">
        <Info className="h-4 w-4" />
      </button>
      <button className={iconBtn} onClick={onToggleSound} aria-label="Toggle sound" title="Sound">
        {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
      <button
        className={`${iconBtn} hover:border-fitness-error/50`}
        onClick={onExit}
        aria-label="Exit workout"
        title="Exit"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    {/* Bottom row: rep card | coaching | controls */}
    <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
      <RepCounterCard repCount={repCount} exerciseName={exerciseName} elapsedLabel={elapsedLabel} />

      <div className="hidden flex-1 justify-center sm:flex">
        <CoachingBar text={coachText} tone={coachTone} progress={romProgress} />
      </div>

      <div className="flex items-center gap-2">
        <button className={iconBtn} onClick={onPause} aria-label={isPaused ? "Resume" : "Pause"} title={isPaused ? "Resume" : "Pause"}>
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button className={iconBtn} onClick={onReset} aria-label="Reset" title="Reset">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          className={`${iconBtn} border-fitness-green/40 text-fitness-green`}
          onClick={onCapture}
          aria-label="Capture snapshot"
          title="Capture"
        >
          <Aperture className="h-4 w-4" />
        </button>
      </div>
    </div>

    {/* Coaching bar for phones (below the row, since space is tight up top) */}
    <div className="absolute inset-x-3 bottom-[5.5rem] flex justify-center sm:hidden">
      <CoachingBar text={coachText} tone={coachTone} progress={romProgress} />
    </div>
  </div>
);

export default TrackerHUD;

import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import type { Workout } from "@/lib/workouts";
import TrackerHUD from "./TrackerHUD";
import DetailsPanel from "./DetailsPanel";
import type { CoachTone } from "./CoachingBar";

interface ImmersiveStageProps {
  webcamRef: React.RefObject<Webcam>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoConstraints: MediaTrackConstraints;
  workout: Workout;
  showInstructions: boolean;
  onStartExercise: () => void;
  detailsOpen: boolean;
  onOpenDetails: () => void;
  onCloseDetails: () => void;
  // HUD data + handlers
  repCount: number;
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
  onExit: () => void;
}

/**
 * Immersive full-bleed camera stage. The webcam + overlay canvas are rendered
 * here but their refs and the detection loop are owned by the page, so ML
 * behavior is unchanged. Keeps the exact object-cover + mirror classes.
 */
const ImmersiveStage = ({
  webcamRef, canvasRef, videoConstraints, workout, showInstructions,
  onStartExercise, detailsOpen, onOpenDetails, onCloseDetails,
  repCount, elapsedLabel, isGoodForm, coachText, coachTone, romProgress,
  isPaused, isSoundEnabled, onPause, onReset, onCapture, onToggleSound, onExit,
}: ImmersiveStageProps) => (
  <div className="relative mx-auto aspect-[3/4] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-elevation-3 animate-scale-in sm:aspect-video">
    <Webcam
      ref={webcamRef}
      audio={false}
      mirrored={true}
      videoConstraints={videoConstraints}
      className="absolute left-0 top-0 h-full w-full object-cover"
    />
    <canvas
      ref={canvasRef}
      className="absolute left-0 top-0 h-full w-full object-cover -scale-x-100"
    />

    <TrackerHUD
      repCount={repCount}
      exerciseName={workout.name}
      elapsedLabel={elapsedLabel}
      isGoodForm={isGoodForm}
      coachText={coachText}
      coachTone={coachTone}
      romProgress={romProgress}
      isPaused={isPaused}
      isSoundEnabled={isSoundEnabled}
      onPause={onPause}
      onReset={onReset}
      onCapture={onCapture}
      onToggleSound={onToggleSound}
      onOpenDetails={onOpenDetails}
      onExit={onExit}
    />

    {/* First-rep instructions overlay */}
    {showInstructions && (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto bg-fitness-black/80 p-4 text-center backdrop-blur-md animate-fade-in sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-fitness-card-bg/80 p-5 shadow-elevation-3 animate-fade-in-up sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">{workout.name}</h3>
          <ul className="mx-auto mb-6 space-y-2 text-left text-sm">
            {workout.instructions.map((ins, i) => (
              <li key={i} className="flex items-start text-white/90">
                <span className="mr-2 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fitness-green text-xs text-black">
                  {i + 1}
                </span>
                {ins}
              </li>
            ))}
          </ul>
          <Button
            className="bg-brand-gradient text-black shadow-glow hover:opacity-90"
            onClick={onStartExercise}
          >
            Start Exercise
          </Button>
        </div>
      </div>
    )}

    <DetailsPanel open={detailsOpen} workout={workout} onClose={onCloseDetails} />
  </div>
);

export default ImmersiveStage;

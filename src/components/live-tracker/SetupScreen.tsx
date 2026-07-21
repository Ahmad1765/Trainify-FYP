import { useState } from "react";
import { Play, CheckCircle2, XCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoaching } from "@/lib/formFeedback";
import {
  WORKOUT_CATEGORIES,
  getWorkoutsByCategory,
  type Workout,
  type WorkoutCategory,
} from "@/lib/workouts";

interface SetupScreenProps {
  selectedWorkout: Workout;
  onSelectWorkout: (id: string) => void;
  onStart: () => void;
  isModelLoading: boolean;
}

/** Phase 1: choose an exercise, review its details, and start training. */
const SetupScreen = ({ selectedWorkout, onSelectWorkout, onStart, isModelLoading }: SetupScreenProps) => {
  const [activeCategory, setActiveCategory] = useState<WorkoutCategory>(selectedWorkout.category);
  const coaching = getCoaching(selectedWorkout.id);
  const exercises = getWorkoutsByCategory(activeCategory);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 animate-fade-in-up">
      {/* Left: category rail + exercise list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap gap-2">
          {WORKOUT_CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-brand-gradient text-black shadow-glow-sm"
                    : "border border-white/10 bg-white/[0.03] text-fitness-gray hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {exercises.map((w) => {
            const active = w.id === selectedWorkout.id;
            return (
              <button
                key={w.id}
                onClick={() => onSelectWorkout(w.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  active
                    ? "border-fitness-green/50 bg-fitness-green/10 shadow-glow-sm"
                    : "border-white/[0.06] bg-fitness-card-bg hover:border-white/20"
                }`}
              >
                <div>
                  <div className={`text-sm font-semibold ${active ? "text-fitness-green" : "text-white"}`}>
                    {w.name}
                  </div>
                  <div className="text-[11px] text-fitness-gray">{w.level}</div>
                </div>
                {active && <CheckCircle2 className="h-4 w-4 text-fitness-green" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: featured exercise */}
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-fitness-card-bg shadow-elevation-2">
          <div className="relative bg-radial-glow p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-display-sm text-white">{selectedWorkout.name}</h2>
                <p className="mt-1 max-w-md text-sm text-fitness-gray">{selectedWorkout.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-fitness-green/20 px-3 py-1 text-xs font-medium text-fitness-green">
                {selectedWorkout.level}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedWorkout.targetMuscles.map((m) => (
                <span key={m} className="rounded-full bg-fitness-dark-gray px-3 py-1 text-xs text-white/80">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-5 px-6 pb-6">
            <div className="aspect-video overflow-hidden rounded-xl bg-fitness-dark-gray">
              <iframe
                src={selectedWorkout.videoUrl}
                className="h-full w-full"
                title={`${selectedWorkout.name} tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="rounded-lg border border-fitness-green/25 bg-fitness-green/10 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-fitness-green" />
                <div>
                  <h3 className="text-sm font-medium text-fitness-green">Form focus</h3>
                  <p className="mt-1 text-sm text-fitness-gray">{coaching.cue}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-white">Avoid these mistakes</h3>
              <ul className="space-y-2 text-sm">
                {coaching.mistakes.map((m, i) => (
                  <li key={i} className="flex items-start text-fitness-gray">
                    <XCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-fitness-error" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="w-full bg-brand-gradient py-6 text-base font-semibold text-black shadow-glow hover:opacity-90 disabled:opacity-60"
              onClick={onStart}
              disabled={isModelLoading}
            >
              {isModelLoading ? (
                <>
                  <Camera className="mr-2 h-5 w-5 animate-pulse" />
                  Loading AI model…
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Start Training
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;

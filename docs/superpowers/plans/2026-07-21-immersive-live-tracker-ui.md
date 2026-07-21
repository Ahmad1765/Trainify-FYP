# Immersive Live Workout Tracker UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Live Workout Tracker into a premium two-phase experience — a cinematic Setup screen and an immersive full-bleed camera Train stage with a floating glass HUD — without changing any pose-detection / ML logic.

**Architecture:** Extract presentational pieces into `src/components/live-tracker/`. The page (`LiveWorkoutTracker.tsx`) keeps ALL state, refs, and the `detectPose` loop, and composes the children. Two new pure helpers (`getWorkoutsByCategory`, `romProgress`) are TDD'd with vitest. Everything else is presentation; verification is typecheck + lint + existing suite staying green + a manual pass.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind (existing `tailwind.config.ts` tokens), shadcn/radix UI, lucide-react icons, vitest (node env).

## Global Constraints

- **No changes to ML logic:** `detectPose`, `drawSkeleton`, `drawCorrections`, `KeypointSmoother`, `RepCounter`, `getCorrections`, `assessForm`, `getRepSpec`, session saving (`createSession`/`saveSession`) must behave identically. Presentational children own NO detection state.
- **No new dependencies.** Use only what's in `package.json`.
- **No new design tokens.** Reuse `tailwind.config.ts`: `fitness.*` palette, `shadow-elevation-1/2/3`, `shadow-glow`, `shadow-glow-sm`, `bg-brand-gradient`, `bg-radial-glow`, `animate-fade-in`, `animate-fade-in-up`, `animate-scale-in`, `animate-pulse-glow`, `text-display-*`, `tabular-nums`.
- **Webcam + overlay canvas:** keep exact classes `absolute top-0 left-0 w-full h-full object-cover` (video) and `... object-cover -scale-x-100` (canvas). Refs stay owned by the page.
- **Path alias:** import via `@/...` (configured in `vite.config.ts`).
- **Test command:** `npm run test` (vitest run). **Typecheck/build:** `npm run build`. **Lint:** `npm run lint`.
- **Exercise `coach` tone type:** `'good' | 'warn' | 'info'`. **Form status:** `boolean | null`.
- Branch: `redesign/immersive-live-tracker` (already checked out).

---

### Task 1: Extract workout data + category grouping helper

Move the inline `WORKOUTS` array out of the page into a data module, add a `category` to each exercise, and add a grouping helper for the Setup category rail.

**Files:**
- Create: `src/lib/workouts.ts`
- Create: `src/test/workouts.test.ts`
- Modify: `src/pages/dashboard/LiveWorkoutTracker.tsx` (remove inline `WORKOUTS`, import instead)

**Interfaces:**
- Produces:
  - `type WorkoutCategory = 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Legs' | 'Abs' | 'Cardio'`
  - `interface Workout { id: string; name: string; description: string; instructions: string[]; targetMuscles: string[]; recommendedReps: string; level: string; videoUrl: string; category: WorkoutCategory }`
  - `const WORKOUTS: Workout[]`
  - `const WORKOUT_CATEGORIES: WorkoutCategory[]` (display order)
  - `function getWorkoutsByCategory(category: WorkoutCategory): Workout[]`

- [ ] **Step 1: Write the failing test**

Create `src/test/workouts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  WORKOUTS,
  WORKOUT_CATEGORIES,
  getWorkoutsByCategory,
} from '@/lib/workouts';

describe('workout data + category grouping', () => {
  it('every workout has a category in WORKOUT_CATEGORIES', () => {
    for (const w of WORKOUTS) {
      expect(WORKOUT_CATEGORIES).toContain(w.category);
    }
  });

  it('getWorkoutsByCategory returns only that category', () => {
    for (const cat of WORKOUT_CATEGORIES) {
      const list = getWorkoutsByCategory(cat);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((w) => w.category === cat)).toBe(true);
    }
  });

  it('grouping partitions all workouts with no loss', () => {
    const grouped = WORKOUT_CATEGORIES.flatMap(getWorkoutsByCategory);
    expect(grouped).toHaveLength(WORKOUTS.length);
  });

  it('classic exercises land in expected categories', () => {
    expect(getWorkoutsByCategory('Chest').map((w) => w.id)).toContain('push-ups');
    expect(getWorkoutsByCategory('Legs').map((w) => w.id)).toContain('squats');
    expect(getWorkoutsByCategory('Cardio').map((w) => w.id)).toContain('jumping-jacks');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- workouts`
Expected: FAIL — cannot resolve `@/lib/workouts`.

- [ ] **Step 3: Create the data module**

Create `src/lib/workouts.ts`. Copy the exact 30 exercise objects from `LiveWorkoutTracker.tsx` (lines 52–407) and add a `category` field to each per the group comments. Full file:

```ts
export type WorkoutCategory =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Abs'
  | 'Cardio';

export interface Workout {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];
  recommendedReps: string;
  level: string;
  videoUrl: string;
  category: WorkoutCategory;
}

/** Display order for the Setup category rail. */
export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Abs',
  'Cardio',
];

export const WORKOUTS: Workout[] = [
  // CHEST
  { id: 'push-ups', name: 'Push-ups', description: 'A classic bodyweight exercise for the chest, shoulders, and triceps.', instructions: ['Place your hands shoulder-width apart', 'Keep your back straight and core engaged', 'Lower your body until your chest nearly touches the floor', 'Push back up to the starting position'], targetMuscles: ['Chest', 'Shoulders', 'Triceps'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4', category: 'Chest' },
  { id: 'incline-push-ups', name: 'Incline Push-ups', description: 'Targets the upper chest and shoulders.', instructions: ['Place your hands on an elevated surface', 'Keep your body straight', 'Lower your chest to the surface', 'Push back up'], targetMuscles: ['Chest', 'Shoulders'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/cyJgTTUu6qk', category: 'Chest' },
  { id: 'decline-push-ups', name: 'Decline Push-ups', description: 'Targets the lower chest.', instructions: ['Place your feet on an elevated surface', 'Keep your body straight', 'Lower your chest to the floor', 'Push back up'], targetMuscles: ['Chest', 'Shoulders'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/0yQwY6f8ZcE', category: 'Chest' },
  { id: 'chest-dips', name: 'Chest Dips', description: 'Targets the lower chest and triceps.', instructions: ['Use parallel bars', 'Lean forward as you dip', 'Lower until elbows are at 90 degrees', 'Push back up'], targetMuscles: ['Chest', 'Triceps'], recommendedReps: '8-12', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/2z8JmcrW-As', category: 'Chest' },
  // BACK
  { id: 'pull-ups', name: 'Pull-ups', description: 'A compound back exercise using a bar.', instructions: ['Hang from a bar with palms facing away', 'Pull your chin above the bar', 'Lower back down with control'], targetMuscles: ['Back', 'Biceps'], recommendedReps: '5-10', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g', category: 'Back' },
  { id: 'chin-ups', name: 'Chin-ups', description: 'Similar to pull-ups but with palms facing you.', instructions: ['Hang from a bar with palms facing you', 'Pull your chin above the bar', 'Lower back down with control'], targetMuscles: ['Back', 'Biceps'], recommendedReps: '5-10', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/b-ztMQpj8yc', category: 'Back' },
  { id: 'inverted-rows', name: 'Inverted Rows', description: 'A horizontal pulling exercise for the back.', instructions: ['Lie under a bar', 'Pull your chest to the bar', 'Lower back down'], targetMuscles: ['Back', 'Biceps'], recommendedReps: '8-12', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/5pW6rG6A8b8', category: 'Back' },
  // SHOULDERS
  { id: 'shoulder-press', name: 'Shoulder Press', description: 'A strength exercise targeting the shoulders and triceps.', instructions: ['Stand or sit with a straight back', 'Hold weights at shoulder height', 'Press the weights overhead until arms are fully extended', 'Lower back to shoulder height'], targetMuscles: ['Shoulders', 'Triceps'], recommendedReps: '8-12', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/B-aVuyhvLHU', category: 'Shoulders' },
  { id: 'side-lateral-raise', name: 'Side Lateral Raise', description: 'Targets the lateral deltoids for shoulder width.', instructions: ['Stand with arms at your sides, holding weights', 'Raise your arms out to the sides until shoulder height', 'Lower back down slowly'], targetMuscles: ['Shoulders'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo', category: 'Shoulders' },
  { id: 'front-raise', name: 'Front Raise', description: 'Targets the front deltoids.', instructions: ['Stand with arms at your sides, holding weights', 'Raise your arms in front to shoulder height', 'Lower back down slowly'], targetMuscles: ['Shoulders'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/-t7fuZ0KhDA', category: 'Shoulders' },
  { id: 'reverse-fly', name: 'Reverse Fly', description: 'Targets the rear deltoids and upper back.', instructions: ['Bend forward at the hips', 'Raise your arms out to the sides', 'Squeeze your shoulder blades', 'Lower back down'], targetMuscles: ['Shoulders', 'Upper Back'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/6kALZikXxLc', category: 'Shoulders' },
  // BICEPS
  { id: 'bicep-curl', name: 'Bicep Curl', description: 'An isolation exercise for the biceps.', instructions: ['Stand with arms at your sides, holding weights', 'Curl the weights up toward your shoulders', 'Keep elbows close to your torso', 'Lower the weights back down'], targetMuscles: ['Biceps'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo', category: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', description: 'Variation of bicep curl with neutral grip.', instructions: ['Stand with arms at your sides, holding weights', 'Curl the weights up with palms facing each other', 'Lower the weights back down'], targetMuscles: ['Biceps', 'Forearms'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/zC3nLlEvin4', category: 'Biceps' },
  // TRICEPS
  { id: 'tricep-dip', name: 'Tricep Dip', description: 'Targets the triceps using bodyweight.', instructions: ['Sit on a chair or bench, hands next to hips', 'Slide forward and lower your body by bending elbows', 'Push back up to starting position'], targetMuscles: ['Triceps'], recommendedReps: '10-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM', category: 'Triceps' },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', description: 'Targets the long head of the triceps.', instructions: ['Hold a weight overhead with both hands', 'Lower the weight behind your head', 'Extend your arms back up'], targetMuscles: ['Triceps'], recommendedReps: '10-15', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-Q', category: 'Triceps' },
  // LEGS
  { id: 'squats', name: 'Squats', description: 'A compound exercise that strengthens the lower body and core.', instructions: ['Stand with feet shoulder-width apart', 'Keep your chest up and back straight', 'Lower your body as if sitting in a chair', 'Push through your heels to return to standing'], targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'], recommendedReps: '12-15', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U', category: 'Legs' },
  { id: 'lunges', name: 'Lunges', description: 'A unilateral exercise that builds strength and stability in the lower body.', instructions: ['Stand tall with feet hip-width apart', 'Step forward with one leg and lower your body', 'Keep your front knee over your ankle', 'Push back up and repeat with the other leg'], targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'], recommendedReps: '10-12 per leg', level: 'Beginner-Intermediate', videoUrl: 'https://www.youtube.com/embed/QE_hU8XX48I', category: 'Legs' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', description: 'A single-leg squat variation for quads and glutes.', instructions: ['Place one foot behind on a bench', 'Lower your back knee toward the ground', 'Push through your front heel to stand'], targetMuscles: ['Quadriceps', 'Glutes'], recommendedReps: '8-12 per leg', level: 'Intermediate', videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE', category: 'Legs' },
  { id: 'calf-raise', name: 'Calf Raise', description: 'Targets the calf muscles.', instructions: ['Stand upright', 'Push through the balls of your feet to raise your heels', 'Lower back down'], targetMuscles: ['Calves'], recommendedReps: '15-20', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/-M4-G8p8fmc', category: 'Legs' },
  // ABS
  { id: 'plank', name: 'Plank', description: 'An isometric core exercise that improves stability and endurance.', instructions: ['Start in a push-up position', 'Keep your body in a straight line from head to heels', 'Engage your core and hold the position'], targetMuscles: ['Core', 'Shoulders', 'Back'], recommendedReps: 'Hold for 30-60 seconds', level: 'All Levels', videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw', category: 'Abs' },
  { id: 'crunches', name: 'Crunches', description: 'Targets the upper abdominals.', instructions: ['Lie on your back with knees bent', 'Lift your shoulders off the ground', 'Squeeze your abs at the top', 'Lower back down'], targetMuscles: ['Abs'], recommendedReps: '15-20', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/Xyd_fa5zoEU', category: 'Abs' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', description: 'Targets the obliques and upper abs.', instructions: ['Lie on your back', 'Bring opposite elbow to opposite knee', 'Alternate sides in a pedaling motion'], targetMuscles: ['Abs', 'Obliques'], recommendedReps: '15-20', level: 'Beginner', videoUrl: 'https://www.youtube.com/embed/9FGilxCbdz8', category: 'Abs' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', description: 'A dynamic core and cardio exercise.', instructions: ['Start in a plank position', 'Drive one knee toward your chest', 'Switch legs quickly, alternating knees'], targetMuscles: ['Core', 'Cardio'], recommendedReps: '20-30', level: 'All Levels', videoUrl: 'https://www.youtube.com/embed/nmwgirgXLYM', category: 'Abs' },
  // FULL BODY/CARDIO
  { id: 'jumping-jacks', name: 'Jumping Jacks', description: 'A full-body cardio exercise that increases heart rate.', instructions: ['Stand upright with feet together and arms at your sides', 'Jump up, spreading your feet and raising your arms overhead', 'Return to the starting position'], targetMuscles: ['Full Body', 'Cardio'], recommendedReps: '20-30', level: 'All Levels', videoUrl: 'https://www.youtube.com/embed/c4DAnQ6DtF8', category: 'Cardio' },
];

export function getWorkoutsByCategory(category: WorkoutCategory): Workout[] {
  return WORKOUTS.filter((w) => w.category === category);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- workouts`
Expected: PASS (4 tests).

- [ ] **Step 5: Update the page to import from the module**

In `src/pages/dashboard/LiveWorkoutTracker.tsx`: delete the inline `// Sample workout data\nconst WORKOUTS = [ ... ];` block (lines ~51–407) and add near the other imports:

```ts
import { WORKOUTS, type Workout } from "@/lib/workouts";
```

- [ ] **Step 6: Verify build + full suite green**

Run: `npm run build`
Expected: succeeds, no type errors.
Run: `npm run test`
Expected: all suites PASS (existing + new `workouts`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/workouts.ts src/test/workouts.test.ts src/pages/dashboard/LiveWorkoutTracker.tsx
git commit -m "refactor: extract workout data + category grouping helper"
```

---

### Task 2: Range-of-motion progress helper

Add a pure helper mapping the rep signal to a 0–1 progress value for the coaching meter.

**Files:**
- Create: `src/lib/rangeOfMotion.ts`
- Create: `src/test/rangeOfMotion.test.ts`

**Interfaces:**
- Consumes: `RepSpec` from `@/lib/repCounter` (fields `signal`, `downBelow`, `upAbove`, `isometric`).
- Produces: `function romProgress(value: number | null, spec: Pick<RepSpec, 'downBelow' | 'upAbove' | 'isometric'>): number | null`
  - Returns `null` when `value` is null, when `spec.isometric` is true, or when `upAbove === downBelow` (degenerate).
  - Otherwise returns `(upAbove - value) / (upAbove - downBelow)` clamped to `[0, 1]`. `0` = start/top, `1` = full depth.

- [ ] **Step 1: Write the failing test**

Create `src/test/rangeOfMotion.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { romProgress } from '@/lib/rangeOfMotion';

const spec = { downBelow: 90, upAbove: 160 };

describe('romProgress', () => {
  it('is 0 at/above the top threshold', () => {
    expect(romProgress(160, spec)).toBe(0);
    expect(romProgress(200, spec)).toBe(0);
  });

  it('is 1 at/below the depth threshold', () => {
    expect(romProgress(90, spec)).toBe(1);
    expect(romProgress(40, spec)).toBe(1);
  });

  it('is ~0.5 at the midpoint', () => {
    expect(romProgress(125, spec)).toBeCloseTo(0.5, 5);
  });

  it('returns null for null value, isometric, or degenerate range', () => {
    expect(romProgress(null, spec)).toBeNull();
    expect(romProgress(120, { ...spec, isometric: true })).toBeNull();
    expect(romProgress(120, { downBelow: 100, upAbove: 100 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- rangeOfMotion`
Expected: FAIL — cannot resolve `@/lib/rangeOfMotion`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/rangeOfMotion.ts`:

```ts
import type { RepSpec } from '@/lib/repCounter';

/**
 * Map the live rep signal to a 0–1 range-of-motion progress for the coaching
 * meter. 0 = start/top of the movement, 1 = full depth. Read-only view of the
 * same signal the rep counter consumes — it changes nothing about counting.
 */
export function romProgress(
  value: number | null,
  spec: Pick<RepSpec, 'downBelow' | 'upAbove' | 'isometric'>,
): number | null {
  if (value === null || spec.isometric) return null;
  const range = spec.upAbove - spec.downBelow;
  if (range === 0) return null;
  const p = (spec.upAbove - value) / range;
  return Math.max(0, Math.min(1, p));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- rangeOfMotion`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rangeOfMotion.ts src/test/rangeOfMotion.test.ts
git commit -m "feat: add range-of-motion progress helper"
```

---

### Task 3: Leaf HUD components — RepCounterCard + CoachingBar

Two small presentational components used by the Train-stage HUD.

**Files:**
- Create: `src/components/live-tracker/RepCounterCard.tsx`
- Create: `src/components/live-tracker/CoachingBar.tsx`

**Interfaces:**
- Produces:
  - `RepCounterCard(props: { repCount: number; exerciseName: string; elapsedLabel: string })`
  - `type CoachTone = 'good' | 'warn' | 'info'`
  - `CoachingBar(props: { text: string; tone: CoachTone; progress: number | null })`

- [ ] **Step 1: Create RepCounterCard**

Create `src/components/live-tracker/RepCounterCard.tsx`:

```tsx
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
```

- [ ] **Step 2: Create CoachingBar**

Create `src/components/live-tracker/CoachingBar.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify typecheck + lint**

Run: `npm run build`
Expected: succeeds (components compile; unused-until-wired is fine — they're exported).
Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/live-tracker/RepCounterCard.tsx src/components/live-tracker/CoachingBar.tsx
git commit -m "feat: add RepCounterCard and CoachingBar HUD components"
```

---

### Task 4: DetailsPanel + SessionSummaryDialog

The slide-in exercise details panel and the end-of-session summary dialog.

**Files:**
- Create: `src/components/live-tracker/DetailsPanel.tsx`
- Create: `src/components/live-tracker/SessionSummaryDialog.tsx`

**Interfaces:**
- Consumes: `Workout` from `@/lib/workouts`; `getCoaching` from `@/lib/formFeedback` (signature `getCoaching(id: string): { cue: string; mistakes: string[] }`).
- Produces:
  - `DetailsPanel(props: { open: boolean; workout: Workout; onClose: () => void })`
  - `SessionSummaryDialog(props: { open: boolean; exerciseName: string; reps: number; durationLabel: string; goodFormPct: number | null; onClose: () => void })`

- [ ] **Step 1: Create DetailsPanel**

Create `src/components/live-tracker/DetailsPanel.tsx`:

```tsx
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
```

- [ ] **Step 2: Create SessionSummaryDialog**

Create `src/components/live-tracker/SessionSummaryDialog.tsx`:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionSummaryDialogProps {
  open: boolean;
  exerciseName: string;
  reps: number;
  durationLabel: string;
  goodFormPct: number | null;
  onClose: () => void;
}

/** End-of-session recap shown on Stop. Uses the values already computed for saving. */
const SessionSummaryDialog = ({
  open,
  exerciseName,
  reps,
  durationLabel,
  goodFormPct,
  onClose,
}: SessionSummaryDialogProps) => (
  <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <AlertDialogContent className="border-fitness-dark-gray bg-fitness-card-bg">
      <AlertDialogHeader>
        <AlertDialogTitle>Session complete</AlertDialogTitle>
        <AlertDialogDescription className="text-fitness-gray">
          Nice work on {exerciseName}. Here's your recap.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-fitness-dark-gray p-3">
          <div className="text-2xl font-bold tabular-nums text-fitness-green">{reps}</div>
          <div className="text-[10px] text-fitness-gray sm:text-xs">Reps</div>
        </div>
        <div className="rounded-lg bg-fitness-dark-gray p-3">
          <div className="text-2xl font-bold tabular-nums">{durationLabel}</div>
          <div className="text-[10px] text-fitness-gray sm:text-xs">Time</div>
        </div>
        <div className="rounded-lg bg-fitness-dark-gray p-3">
          <div className="text-2xl font-bold tabular-nums">
            {goodFormPct === null ? "–" : `${goodFormPct}%`}
          </div>
          <div className="text-[10px] text-fitness-gray sm:text-xs">Good form</div>
        </div>
      </div>
      <AlertDialogFooter>
        <AlertDialogAction
          onClick={onClose}
          className="bg-fitness-green text-black hover:bg-fitness-green/80"
        >
          Done
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default SessionSummaryDialog;
```

- [ ] **Step 3: Verify typecheck + lint**

Run: `npm run build`
Expected: succeeds.
Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/live-tracker/DetailsPanel.tsx src/components/live-tracker/SessionSummaryDialog.tsx
git commit -m "feat: add DetailsPanel and SessionSummaryDialog components"
```

---

### Task 5: TrackerHUD (composes the floating overlay)

The floating glass HUD layer that sits over the camera: LIVE pill, form status + action buttons, rep card, coaching bar, control cluster.

**Files:**
- Create: `src/components/live-tracker/TrackerHUD.tsx`

**Interfaces:**
- Consumes: `RepCounterCard`, `CoachingBar` (+ `CoachTone`) from Task 3.
- Produces:
  - `TrackerHUD(props: { repCount: number; exerciseName: string; elapsedLabel: string; isGoodForm: boolean | null; coachText: string; coachTone: CoachTone; romProgress: number | null; isPaused: boolean; isSoundEnabled: boolean; onPause: () => void; onReset: () => void; onCapture: () => void; onToggleSound: () => void; onOpenDetails: () => void; onExit: () => void })`

- [ ] **Step 1: Create TrackerHUD**

Create `src/components/live-tracker/TrackerHUD.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run build`
Expected: succeeds.
Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/live-tracker/TrackerHUD.tsx
git commit -m "feat: add TrackerHUD floating overlay"
```

---

### Task 6: ImmersiveStage (camera host + overlays)

Hosts the webcam video, the overlay canvas (via passed refs), the first-rep instructions overlay, the `TrackerHUD`, and the `DetailsPanel`. Owns NO detection logic.

**Files:**
- Create: `src/components/live-tracker/ImmersiveStage.tsx`

**Interfaces:**
- Consumes: `TrackerHUD` (Task 5), `DetailsPanel` (Task 4), `CoachTone` (Task 3), `Workout` (Task 1). `Webcam` from `react-webcam`. `MutableRefObject` types from React.
- Produces:
  - `ImmersiveStage(props: { webcamRef: React.RefObject<Webcam>; canvasRef: React.RefObject<HTMLCanvasElement>; videoConstraints: MediaTrackConstraints; workout: Workout; showInstructions: boolean; onStartExercise: () => void; detailsOpen: boolean; onOpenDetails: () => void; onCloseDetails: () => void } & Omit<TrackerHUDProps, 'onOpenDetails'>)`
  - (i.e. all `TrackerHUD` handler/data props except `onOpenDetails`, plus the stage-specific props above)

- [ ] **Step 1: Create ImmersiveStage**

Create `src/components/live-tracker/ImmersiveStage.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run build`
Expected: succeeds.
Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/live-tracker/ImmersiveStage.tsx
git commit -m "feat: add ImmersiveStage camera host"
```

---

### Task 7: SetupScreen (phase 1)

The cinematic pre-workout screen: category rail, exercise list, featured exercise card, Start CTA.

**Files:**
- Create: `src/components/live-tracker/SetupScreen.tsx`

**Interfaces:**
- Consumes: `WORKOUTS`, `WORKOUT_CATEGORIES`, `getWorkoutsByCategory`, `Workout`, `WorkoutCategory` (Task 1); `getCoaching` (`@/lib/formFeedback`); `Button` (`@/components/ui/button`).
- Produces:
  - `SetupScreen(props: { selectedWorkout: Workout; onSelectWorkout: (id: string) => void; onStart: () => void; isModelLoading: boolean })`

- [ ] **Step 1: Create SetupScreen**

Create `src/components/live-tracker/SetupScreen.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run build`
Expected: succeeds.
Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/live-tracker/SetupScreen.tsx
git commit -m "feat: add SetupScreen (phase 1)"
```

---

### Task 8: Wire it into LiveWorkoutTracker (phase switching + ROM + summary)

Replace the page's presentational JSX with `SetupScreen` / `ImmersiveStage`, add the ROM progress state fed from `detectPose`, and show `SessionSummaryDialog` on Stop. Keep ALL ML logic and existing handlers.

**Files:**
- Modify: `src/pages/dashboard/LiveWorkoutTracker.tsx`

**Interfaces:**
- Consumes: `SetupScreen`, `ImmersiveStage`, `SessionSummaryDialog` (Tasks 4/6/7); `romProgress` (Task 2); `type CoachTone` (Task 3).

- [ ] **Step 1: Add imports**

In `src/pages/dashboard/LiveWorkoutTracker.tsx`, add near the other imports:

```ts
import SetupScreen from "@/components/live-tracker/SetupScreen";
import ImmersiveStage from "@/components/live-tracker/ImmersiveStage";
import SessionSummaryDialog from "@/components/live-tracker/SessionSummaryDialog";
import { romProgress } from "@/lib/rangeOfMotion";
```

The `Select`, `Separator`, `Video`, `ChevronLeft/Right`, and other now-unused imports from the old layout may be removed — the build/lint step will flag leftovers; delete only ones no longer referenced.

- [ ] **Step 2: Add state for ROM, details panel, and summary**

After the existing `const [coach, setCoach] = useState(...)` block, add:

```ts
  // Range-of-motion progress (0–1) for the coaching meter — a read-only view of
  // the same rep signal the counter consumes. Throttled like the coach line.
  const [rom, setRom] = useState<number | null>(null);
  const romRef = useRef<number | null>(null);
  const setRomThrottled = (v: number | null) => {
    // Only re-render on a visible change to avoid churn every frame.
    const prev = romRef.current;
    if (prev === null || v === null ? prev !== v : Math.abs(prev - v) > 0.02) {
      romRef.current = v;
      setRom(v);
    }
  };

  // Details slide-in panel (Train stage) + end-of-session summary dialog.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [summary, setSummary] = useState<
    { open: boolean; reps: number; durationLabel: string; goodFormPct: number | null; exerciseName: string }
  >({ open: false, reps: 0, durationLabel: "0:00", goodFormPct: null, exerciseName: "" });
```

- [ ] **Step 3: Feed ROM from the detection loop**

In `detectPose`, inside `if (counter) { ... }`, right after `const value = counter.spec.signal(keypoints);`, add:

```ts
            setRomThrottled(romProgress(value, counter.spec));
```

(Do not change anything else in the counter block.)

- [ ] **Step 4: Show the summary on Stop**

Change `stopWebcam` so it captures the recap before tearing down. Replace the first line `saveSession();` with:

```ts
    // Snapshot recap values before state resets, then persist.
    const durationSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const reps = repCounterRef.current?.counter.reps ?? 0;
    const { good, total } = formFramesRef.current;
    saveSession();
    setSummary({
      open: true,
      reps,
      durationLabel: formatElapsed(durationSec),
      goodFormPct: total > 0 ? Math.round((good / total) * 100) : null,
      exerciseName: selectedWorkout.name,
    });
    setDetailsOpen(false);
```

- [ ] **Step 5: Replace the page body JSX**

Replace the entire returned markup between `<DashboardLayout>` and `</DashboardLayout>` (the `<div className="space-y-6">…</div>` block, NOT the permission `AlertDialog`) with:

```tsx
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-display-md">Live Workout Tracker</h1>
            <p className="mt-1 text-fitness-gray">AI-powered form detection and rep counting</p>
          </div>
          {!isWebcamActive && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className={strictForm ? "border-fitness-green/50 text-fitness-green" : "border-fitness-dark-gray"}
                onClick={() => setStrictForm((v) => !v)}
                title="Strict form: only count reps performed with good form"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Strict form: {strictForm ? "On" : "Off"}
              </Button>
              <Button
                variant="outline"
                className="border-fitness-dark-gray"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {isWebcamActive ? (
          <ImmersiveStage
            webcamRef={webcamRef}
            canvasRef={canvasRef}
            videoConstraints={videoConstraints}
            workout={selectedWorkout}
            showInstructions={showInstructions}
            onStartExercise={() => setShowInstructions(false)}
            detailsOpen={detailsOpen}
            onOpenDetails={() => setDetailsOpen(true)}
            onCloseDetails={() => setDetailsOpen(false)}
            repCount={repCount}
            elapsedLabel={formatElapsed(elapsedSec)}
            isGoodForm={isGoodForm}
            coachText={coach.text}
            coachTone={coach.tone}
            romProgress={rom}
            isPaused={isPaused}
            isSoundEnabled={isSoundEnabled}
            onPause={togglePause}
            onReset={resetWorkout}
            onCapture={captureSnapshot}
            onToggleSound={() => setIsSoundEnabled((v) => !v)}
            onExit={stopWebcam}
          />
        ) : (
          <SetupScreen
            selectedWorkout={selectedWorkout}
            onSelectWorkout={(id) => {
              const w = WORKOUTS.find((x) => x.id === id);
              if (w) {
                setSelectedWorkout(w);
                resetWorkout();
                setShowInstructions(true);
              }
            }}
            onStart={startWebcam}
            isModelLoading={isModelLoading}
          />
        )}
      </div>
```

- [ ] **Step 6: Mount the summary dialog**

Immediately before the closing `</DashboardLayout>` (after the permission `AlertDialog`), add:

```tsx
      <SessionSummaryDialog
        open={summary.open}
        exerciseName={summary.exerciseName}
        reps={summary.reps}
        durationLabel={summary.durationLabel}
        goodFormPct={summary.goodFormPct}
        onClose={() => setSummary((s) => ({ ...s, open: false }))}
      />
```

- [ ] **Step 7: Reset ROM where the counter resets**

In both `resetWorkout` and the `useEffect` keyed on `selectedWorkout.id`, add after `resetFormSmoothing();`:

```ts
    setRomThrottled(null);
```

(Keeps the meter from showing a stale value after reset / exercise switch.)

- [ ] **Step 8: Verify typecheck, lint, and the full ML suite**

Run: `npm run build`
Expected: succeeds; remove any now-unused imports it flags (e.g. `Select*`, `Separator`, `Video`, `ChevronLeft`, `ChevronRight`, `Pause`, `Play`, `RefreshCw`, `Aperture`, `Camera` if unreferenced) until clean.
Run: `npm run lint`
Expected: no errors/warnings.
Run: `npm run test`
Expected: ALL suites PASS — `repCounter`, `formCorrection`, `poseSmoothing`, `videoDetection`, `workouts`, `rangeOfMotion`. (This proves the ML logic is untouched.)

- [ ] **Step 9: Manual verification (dev server)**

Run: `npm run dev`, open the Live Tracker.
Confirm:
- Setup screen: category rail switches lists; selecting an exercise updates the featured card + video; "Start Training" is disabled with a loading label until the model loads.
- Train stage: camera fills the stage; LIVE pill, form status, rep card + timer, coaching bar with a filling ROM meter (plank shows the pulsing "hold" state), controls (pause/reset/capture), `ⓘ` opens the details panel, `✕` stops and shows the summary dialog.
- Rep counting, good/bad form colors, correction arrows, snapshot download, and sound all still work.

- [ ] **Step 10: Commit**

```bash
git add src/pages/dashboard/LiveWorkoutTracker.tsx
git commit -m "feat: wire immersive two-phase Live Tracker UI"
```

---

## Self-Review

**Spec coverage:**
- Two-phase (Setup → Train) → Tasks 7, 6, 8. ✓
- Category rail from data → Task 1 (`getWorkoutsByCategory`) + Task 7. ✓
- Featured exercise card + video + Start CTA (shimmer while loading) → Task 7. ✓
- Immersive full-bleed camera, object-cover + mirror preserved → Task 6 (classes copied verbatim). ✓
- Floating glass HUD: LIVE, form status, rep card, coaching bar, controls → Tasks 3/5. ✓
- Range-of-motion meter (additive, read-only) → Task 2 + Task 8 step 3. ✓
- Slide-in details panel → Task 4 + Task 6. ✓
- First-rep instructions overlay restyled → Task 6. ✓
- Session summary dialog on Stop → Task 4 + Task 8 steps 4/6. ✓
- No ML logic changes → Task 8 keeps refs/loop/handlers; suite re-run in step 8. ✓
- Reuse tokens only / no new deps → enforced in Global Constraints; all classes are existing tokens. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code. ✓

**Type consistency:** `CoachTone` defined in Task 3 (`CoachingBar`) and imported by Tasks 5/6/8. `Workout`/`WorkoutCategory`/`getWorkoutsByCategory`/`WORKOUT_CATEGORIES`/`WORKOUTS` defined in Task 1, consumed consistently. `romProgress(value, spec)` signature matches its use in Task 8 step 3. `TrackerHUDProps` handler names (`onPause`/`onReset`/`onCapture`/`onToggleSound`/`onOpenDetails`/`onExit`) match `ImmersiveStage` and page wiring. `getCoaching(id) → { cue, mistakes }` used consistently. ✓

**Note on `MediaTrackConstraints`:** the page's `videoConstraints` is built with `facingMode` etc.; typed as `MediaTrackConstraints` in `ImmersiveStage` props — assignable. If TS narrows the page's `useMemo` to a stricter literal, widen the prop or cast at the call site (`videoConstraints as MediaTrackConstraints`). Verified conceptually; build step will confirm.

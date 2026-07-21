# Immersive Live Workout Tracker UI — Design Spec

**Date:** 2026-07-21
**Status:** Approved (design), pending implementation plan
**Scope:** Presentation-layer redesign of `src/pages/dashboard/LiveWorkoutTracker.tsx`. No changes to pose-detection / ML logic.

## Goal

Make the Live Workout Tracker look and feel premium via an **immersive, cinematic, two-phase** experience:

1. **Setup phase** (camera off) — a polished screen to browse and choose an exercise, with full details and tutorial video.
2. **Train phase** (camera on) — a near-fullscreen immersive camera stage with a floating glassmorphic HUD (reps, form status, coaching, controls). Supporting detail reachable via a slide-in panel.

## Non-Goals

- No changes to pose detection, the `detectPose` render loop, canvas draw functions (`drawSkeleton`, `drawCorrections`), keypoint smoothing, rep counting, form assessment, or session persistence logic.
- No new color/spacing tokens — reuse the existing `tailwind.config.ts` design system.
- No new dependencies.
- Not adding new exercises or changing workout data (only re-presenting it).

## Design System (reuse only)

All visual treatment draws from existing tokens:

- **Glass surfaces:** `bg-fitness-black/60` (or `/70`) + `backdrop-blur` + `border border-white/10`.
- **Elevation:** `shadow-elevation-1/2/3`.
- **Accent glow:** `shadow-glow`, `shadow-glow-sm`, `bg-brand-gradient`, `bg-radial-glow`.
- **Motion:** `animate-fade-in`, `animate-fade-in-up`, `animate-scale-in`, `animate-pulse-glow`, `shimmer` keyframe.
- **Palette:** `fitness.green #1FDD80`, `fitness.success`, `fitness.error`, `fitness.gray`, `fitness.card-bg`, `fitness.card-elevated`, `fitness.dark-gray`, `fitness.black`.
- **Type scale:** `text-display-*` for headers, `tabular-nums` for counters.

## Architecture

Extract presentation into `src/components/live-tracker/`. The page component keeps **all** state and the detection loop and composes the children. Webcam/canvas refs live in the page and are passed down (the camera + overlay canvas are rendered inside `ImmersiveStage` but the refs and the `detectPose` loop stay owned by the page, so ML behavior is unchanged).

```
src/pages/dashboard/LiveWorkoutTracker.tsx   (state + ML loop + composition; WORKOUTS may move to data file)
src/components/live-tracker/
  SetupScreen.tsx           Phase 1: category rail + featured exercise card + Start CTA
  ImmersiveStage.tsx        Phase 2: full-bleed camera stage host (renders webcam + canvas via passed refs, HUD, overlays)
  TrackerHUD.tsx            Floating HUD layer (composes the pieces below)
  RepCounterCard.tsx        Glass rep counter (number + exercise + timer)
  CoachingBar.tsx           Coaching cue + range-of-motion progress meter
  DetailsPanel.tsx          Slide-in panel: instructions, muscles, mistakes, tutorial video
  SessionSummaryDialog.tsx  Scale-in summary dialog on Stop
```

Optionally extract the `WORKOUTS` array (currently ~355 lines inline) to `src/lib/workouts.ts` (or `src/data/workouts.ts`) to slim the page. Grouping helper `getWorkoutsByCategory()` derives muscle-group categories from the existing data for the setup rail.

### Component contracts (props in, callbacks out — no internal ML state)

- **SetupScreen** — in: `workouts`, `selectedWorkout`, `isModelLoading`; out: `onSelectWorkout(id)`, `onStart()`. Renders category rail, featured card (details + video), Start CTA (shimmer while loading).
- **ImmersiveStage** — in: refs (`webcamRef`, `canvasRef`), `videoConstraints`, plus HUD data/handlers; hosts the video, overlay canvas, and `TrackerHUD`. Owns no detection logic.
- **TrackerHUD** — in: `repCount`, `elapsedLabel`, `exerciseName`, `isGoodForm`, `coach`, `isPaused`, `isSoundEnabled`, range-of-motion `progress` (0–1); out: `onPause`, `onReset`, `onCapture`, `onToggleSound`, `onOpenDetails`, `onExit`.
- **RepCounterCard** — in: `repCount`, `exerciseName`, `elapsedLabel`.
- **CoachingBar** — in: `coach {text, tone}`, `progress`.
- **DetailsPanel** — in: `open`, `workout`; out: `onClose`.
- **SessionSummaryDialog** — in: `open`, summary `{reps, durationLabel, goodFormPct, exerciseName}`; out: `onClose`.

## Phase 1 — Setup Screen

Replaces today's flat 2/3 + 1/3 grid when `!isWebcamActive`.

- **Header:** `Live Workout Tracker` (`text-display-md`) + subtitle; keeps "How it Works", "Strict form", sound toggle actions (restyled).
- **Category rail:** horizontal, scrollable muscle-group tabs derived from workout data (Chest, Back, Shoulders, Biceps, Triceps, Legs, Abs, Cardio/Full Body). Selecting a category filters the exercise list. Active tab uses green/gradient treatment.
- **Exercise list/grid:** exercises in the active category as selectable cards/chips; selecting one updates the featured card. Current exercise highlighted.
- **Featured exercise card** (elevated, `animate-fade-in-up`): name + level badge, description, target-muscle chips, "Form focus" cue, "Avoid these mistakes" list, embedded tutorial video (`aspect-video`).
- **Primary CTA:** `Start Training` — `bg-brand-gradient text-black` + `shadow-glow`. While `isModelLoading`, disabled with a shimmer/loading label; enabled when the model is ready.
- Transition into Train phase uses `animate-scale-in` / fade.

## Phase 2 — Immersive Train Stage

Active when `isWebcamActive`. Camera fills the main content area (near-fullscreen within `DashboardLayout`'s main region), portrait `aspect-[3/4]` on mobile, `sm:aspect-video`/fill on desktop. **Existing** webcam + `-scale-x-100` overlay canvas + object-cover behavior preserved exactly.

Floating glass HUD (all `pointer-events-none` container; interactive controls re-enable pointer events):

- **Top-left:** `● LIVE` pill — `animate-pulse-glow`, dot ping (existing pattern, restyled glass).
- **Top-right cluster:** form-status pill (`Good Form ✓` success / `Adjust Form ✕` error, glass tinted), then icon buttons: `ⓘ` open details, sound toggle, `✕` exit (calls existing `stopWebcam`).
- **Bottom-left:** `RepCounterCard` — big `tabular-nums` count (green), exercise name, live timer (`formatElapsed`).
- **Bottom-center:** `CoachingBar` — coach text with tone coloring (good/warn/info, existing `coach` state) + a range-of-motion progress meter. Progress derived from the live rep signal vs. the exercise's `upAbove`/`downBelow` thresholds (read-only use of existing rep spec; exposed from the loop via a throttled state setter — no change to counting logic).
- **Bottom-right:** control cluster — Pause/Resume, Reset, Capture as glass icon buttons (existing handlers `togglePause`, `resetWorkout`, `captureSnapshot`).

Overlays:

- **First-rep instructions overlay** (`showInstructions`): restyled premium — glass panel, numbered steps, gradient "Start Exercise" CTA. Same trigger/behavior.
- **Details slide-in panel** (`DetailsPanel`): slides from the right over the stage; instructions, target muscles, mistakes, tutorial video; dismiss returns to camera. Camera never unmounts.

## Session Summary

On Stop (`stopWebcam`), before/after `saveSession`, show `SessionSummaryDialog` (`animate-scale-in`): total reps, active time, good-form % (from `formFramesRef`), exercise name. Buttons: Done (close, return to Setup). Reuses existing session values; does not change persistence.

## Range-of-Motion Progress (only new derived signal)

The detection loop already computes `value = counter.spec.signal(keypoints)` and knows `spec.upAbove` / `spec.downBelow`. Map `value` to a 0–1 progress (clamped, normalized between the thresholds) and push it to a throttled `setRomProgress` state (same throttle pattern as `setCoachThrottled`). Purely additive read — the rep state machine and its inputs are untouched. Isometric exercises (e.g., plank) show a "hold" state instead of a filling bar.

## Responsive / Accessibility

- Mobile: HUD elements scale down (existing responsive class pattern), controls remain thumb-reachable; the below-video coaching bar for phones is superseded by the in-stage `CoachingBar`.
- Respect `prefers-reduced-motion` for the added transitions where practical (rely on `tailwindcss-animate` + existing keyframes; avoid essential info conveyed by motion alone).
- Buttons keep accessible labels/titles as today; form status is text + icon (not color alone).

## Risks / Mitigations

- **Breaking the ML loop:** mitigated by keeping refs + `detectPose` + all draw/counter logic in the page; children are presentational only.
- **Canvas alignment:** stage keeps the exact object-cover + `-scale-x-100` mirroring; no aspect logic changes.
- **Scope creep on the setup rail:** category rail is derived from existing data only; if grouping proves fiddly, fall back to grouped `SelectItem`s — still an improvement, decided during implementation.

## Success Criteria

- Setup and Train are visually distinct, premium, and use only existing tokens.
- Camera is the hero in Train mode with a legible floating glass HUD.
- Rep counting, form feedback, corrections overlay, snapshot, sound, strict-form, and session saving all behave exactly as before.
- No regressions in existing AI form tests; `npm run build` and lint pass.

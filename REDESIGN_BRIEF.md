# TRAINify — Frontend Redesign Brief

**Purpose of this document.** It describes exactly how the TRAINify web app is
built and how every screen currently looks and behaves, so that an AI assistant
(Gemini) can turn it into a precise redesign prompt for Claude Code. The goal of
that redesign: keep 100% of the current functionality and architecture, but make
the interface look and feel like it was crafted by a senior product designer.

Read the two big sections first:
- **Part 4 (Design System)** and **Part 5 (Screen Inventory)** are what to redesign.
- **Part 6 (Hard Constraints)** is what must NOT change. Breaking these breaks a
  working, database-backed app. The redesign is visual only.

---

## Part 1 — What TRAINify Is

A fitness web app (also packaged for Android via Capacitor). A user signs up,
logs in, and gets a dashboard with six tools:

1. **Workout Tutorials** — searchable/filterable exercise library with embedded videos.
2. **Live Workout Tracker** — uses the webcam + a TensorFlow.js pose model to draw a
   skeleton over the user's body, judge form (green/red), and count reps in real time.
3. **Custom Workout Plan** — a questionnaire that generates and saves a weekly plan.
4. **Calories Calculator** — computes BMR/TDEE and saves a history.
5. **Custom Diet Plan** — a questionnaire that generates and saves a meal plan.
6. **Profile** — account info, editable details + avatar, and workout statistics.

The backend is **Supabase** (Postgres + Auth + Storage). All data is real and
persisted per user. This is a finished, working app — the redesign is purely to
elevate the visual and interaction design.

## Part 2 — Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite (dev server on port 8080) |
| Routing | React Router 6 (client-side) |
| Styling | Tailwind CSS + **shadcn/ui** (~50 prebuilt Radix-based components in `src/components/ui/`) |
| Icons | lucide-react |
| Data/Auth | Supabase (`@supabase/supabase-js`) |
| Server state | @tanstack/react-query |
| ML | TensorFlow.js + `@tensorflow-models/pose-detection` (MoveNet) |
| PDF | jsPDF (text only) |
| Charts | recharts (available, lightly used) |

## Part 3 — Architecture (so the redesign doesn't break data)

The app is cleanly layered. **The redesign should only touch the top layer (pages
and presentational components).**

```
pages/  →  hooks/ (react-query)  →  services/ (Supabase calls)  →  services/supabase.ts
```

- `src/contexts/AuthContext.tsx` — auth/session state. Exposes `useAuth()` →
  `{ user, session, loading, signUp, signIn, signInWithGoogle, logout, resetPassword }`.
- `src/hooks/` — data hooks the pages consume:
  - `useProfile()`, `useUpdateProfile()`, `useUploadAvatar()`, `displayNameOf()`
  - `useCalorieEntries()`, `useCreateCalorieEntry()`, `useDeleteCalorieEntry()`
  - `useRecentWorkoutPlan()`, `useCreateWorkoutPlan()`, `useUpdatePlanSchedule()`
  - `useRecentDietPlan()`, `useCreateDietPlan()`
  - `useWorkoutSessions()`, `useWorkoutStats()`, `useCreateWorkoutSession()`
- `src/services/` — the only place that talks to Supabase.
- `src/lib/` — pure helpers: `calories.ts`, `repCounter.ts`, `poseGeometry.ts`,
  `stats.ts`, `generatePlan.ts`, `format.ts`, `authErrors.ts`, `utils.ts` (`cn()`).

**A page gets its data from a hook and renders it. The redesign changes the
rendering. It must keep calling the same hooks with the same shapes.**

---

## Part 4 — Current Design System (the thing to elevate)

### Theme
Dark-mode only. Defined in **two places that must stay in sync**:
`tailwind.config.ts` (the `fitness` palette) and `src/index.css` (CSS variables /
shadcn tokens).

| Token | Hex | Usage |
|---|---|---|
| `fitness-green` | `#00FF7F` | primary accent, CTAs, active states, "good form" |
| `fitness-background` | `#121212` | page background |
| `fitness-card-bg` | `#1E1E1E` | cards, panels |
| `fitness-dark-gray` | `#333333` | borders, inputs, secondary surfaces |
| `fitness-gray` | `#B0B0B0` | muted/secondary text |
| `fitness-black` | `#000000` | text on green buttons |
| `fitness-success` | `#4CAF50` | success |
| `fitness-error` | `#F44336` | error, "bad form" |
| white | `#FFFFFF` | primary text |

The shadcn token `--primary` maps to the green; `--background`, `--card`,
`--muted`, etc. map to the greys above.

### Typography
- **Inter** (system-font fallback stack). No secondary/display face.
- Headings use Tailwind sizes (`text-3xl` page titles, `text-2xl`/`text-lg` sub).
- The wordmark is always "**TRAIN**ify" — "TRAIN" in green, "ify" in white.

### Components
All UI is shadcn/ui: `Button`, `Card`, `Input`, `Label`, `Tabs`, `Dialog`,
`AlertDialog`, `Select`, `RadioGroup`, `Checkbox`, `Slider`, `Progress`,
`Switch`, `Toast/Toaster` (feedback), `Separator`, `Badge`, etc. Buttons are
commonly `rounded-full` (landing/auth) or default rounded (dashboard).

### Honest assessment of the current design (what "professional" should fix)
This is a competent but **generic dark SaaS look**. Concrete weaknesses a
designer would address:

- **Flat, uniform cards** — every panel is the same `#1E1E1E` rounded rectangle
  with no elevation, depth, or hierarchy. Nothing draws the eye.
- **Neon green overload** — `#00FF7F` is used at full saturation everywhere,
  which is loud and tiring. No supporting accent or tonal range.
- **Weak typographic hierarchy** — one typeface, few weights, similar sizes; page
  titles don't feel distinct from card titles.
- **Decorative-only progress bars** — several `Progress` bars use hardcoded values
  (e.g. `value={70}`) as visual filler, not real data.
- **No empty/loading/error polish** — states exist but are plain text.
- **Sparse spacing rhythm** — inconsistent padding; no clear grid.
- **The auth pages and landing page** are very plain (centered card on flat bg).
- **The dashboard stat tiles** are generic KPI boxes with no sparated/mini-charts.

The redesign should introduce depth, a refined color system (keep green as the
brand but tame and complement it), a real type scale, motion/micro-interactions,
polished empty/loading states, and a cohesive, distinctive fitness identity —
without changing the information architecture.

---

## Part 5 — Screen Inventory

Routes are in `src/App.tsx`. Every route below must remain at the same path.

### Public

**`/` — Landing (`LandingPage.tsx`)**
- Centered hero: wordmark, one-line value prop, "Get Started" (→ /register) +
  "Login" (→ /login) buttons, and 3 numbered feature cards (AI Form Tracking,
  Custom Workouts, Nutrition Plans).
- Very minimal today. Prime candidate for a proper marketing hero, imagery,
  sections, social proof, footer.

**`/login` — (`auth/LoginPage.tsx`)** and **`/register` — (`auth/RegisterPage.tsx`)**
- Single centered card on flat background: "Back to home" link, wordmark, email +
  password (register also: full name, terms checkbox, live password-strength
  meter), primary submit, "Continue with Google" button, link to the other page.
- Loading state: submit button shows "Logging in…" / "Signing up…".
- Errors surface as destructive **toasts**.
- Form field IDs are load-bearing (see Part 6).

### Protected (all wrapped in the sidebar shell)

**Shell — `components/layout/DashboardLayout.tsx`**
- Fixed left **sidebar** (256px): wordmark, 7 nav links with lucide icons
  (Dashboard, Workout Tutorials, Live Workout Tracker, Custom Workout Plan,
  Calories Calculator, Custom Diet Plan, Profile), active link highlighted green.
- Sidebar footer: avatar (or placeholder) + display name + Logout.
- Mobile: sidebar collapses behind a hamburger; slides in.
- Main content area scrolls independently.
- **The redesign should keep this nav structure and all 7 destinations.**

**`/dashboard` — (`dashboard/Dashboard.tsx`)**
- Greeting header ("Welcome back, {firstName}") + date + "Start Workout" CTA.
- 4 **stat tiles**: Daily Streak, This Week (workouts), Total Time, Total Reps —
  **now real**, from `useWorkoutStats()`. (Note: the small progress bars in these
  tiles are still decorative.)
- 5 **feature shortcut cards** linking to the tools.
- **Recent Workouts** list (real, from `useWorkoutSessions()`; has an empty state:
  "No workouts yet…") and **Upcoming Workouts** (static placeholder — no scheduling
  feature exists; treat as aspirational UI or redesign into something real-looking).

**`/workouts` — (`dashboard/WorkoutTutorials.tsx`)**
- Searchable, filterable grid of exercise cards (category, equipment, level,
  duration filters), each opening a video dialog. Data is a static in-file list.

**`/live-tracker` — (`dashboard/LiveWorkoutTracker.tsx`)** — the most complex screen
- Header with "How it Works" dialog + controls.
- Exercise `Select` dropdown (24 exercises).
- Big **webcam viewport with a `<canvas>` overlay** where the skeleton is drawn.
- Live readouts: rep count, good/bad form indicator, sound toggle, pause/reset,
  start/stop.
- Instruction panel for the selected exercise.
- **CRITICAL:** the `<video>`/`<canvas>` elements, their refs, and the detection
  loop must be left functionally intact — only the surrounding chrome/layout is
  redesigned. See Part 6.

**`/workout-plan` — (`dashboard/CustomWorkoutPlan.tsx`)**
- 3-step wizard (progress indicator): (1) pick a goal card, (2) days/week slider,
  time slider, equipment checkboxes, experience radio, (3) the generated weekly
  plan shown per day with exercises; each exercise can be viewed/edited/added/
  deleted (dialogs); "Download PDF"; "Start Workout" session modal.
- Plan is generated from answers and **persisted**; loads the saved plan on return.

**`/calories` — (`dashboard/CaloriesCalculator.tsx`)**
- Tabs: **Calculator** (age, gender radio, weight, height, activity, goal → BMR/
  TDEE/target result card + Save), **Saved Calculations**, **History** (both list
  the persisted entries with Load/Delete).

**`/diet-plan` — (`dashboard/CustomDietPlan.tsx`)**
- 3-step wizard: (1) calorie goal + purpose, (2) restrictions, (3) generated meal
  plan (breakfast/lunch/dinner cards with macros, calories, ingredients, images) +
  totals; "Download PDF". Persisted; loads saved plan on return.

**`/profile` — (`dashboard/Profile.tsx`)**
- Tabs: **Profile** (avatar upload, editable name/bio/height/weight/age, save),
  **Statistics** (real totals + current/longest streak from `useWorkoutStats()`),
  **Workout History** (real session list), **Settings** (toggles).

**`*` — 404 (`NotFound.tsx`)** — simple centered "page not found".

### Cross-cutting states (a professional redesign must handle all four everywhere)
- **Loading** — `useAuth().loading` gates the app with a spinner (`ui/loading.tsx`);
  data hooks expose `isLoading`.
- **Empty** — e.g. no workouts, no saved calculations, no plan yet.
- **Error** — surfaced via **toasts** (`ui/use-toast`), destructive variant.
- **Populated** — the normal case.

---

## Part 6 — HARD CONSTRAINTS (do not break these)

The redesign is **visual/layout only**. The following must remain intact, or a
working database-backed app breaks:

1. **Routes** — every path in `src/App.tsx` stays identical, same page components,
   same `ProtectedRoute` guarding. The 7 sidebar destinations stay.

2. **Data layer is off-limits** — do **not** modify `src/services/**`,
   `src/hooks/**`, `src/contexts/**`, `src/types/**`, or the pure logic in
   `src/lib/**` (`calories.ts`, `repCounter.ts`, `poseGeometry.ts`, `stats.ts`,
   `generatePlan.ts`, `format.ts`, `authErrors.ts`). Pages must keep calling the
   same hooks and reading the same field names.

3. **Keep shadcn/ui** — restyle via `tailwind.config.ts`, `src/index.css` tokens,
   and component `className`s / variants. Do not rip out the Radix-based components
   in `src/components/ui/` and replace them with a different library.

4. **Form contracts are load-bearing.** Handlers read specific input `name`/`id`
   attributes. If markup changes, these must be preserved (or the handler updated
   in lockstep):
   - Login/Register: `#email`, `#password`, `#name`, the terms checkbox, the
     Google button label "Continue with Google", submit labels.
   - Calories: inputs `#age`, `name="weight"`, `name="height"`, gender radio,
     activity/goal selects; result "Save" button.
   - Diet wizard: `#calorieGoal` gates step 1's "Continue".
   - Workout wizard: a goal must be selected before "Continue"; experience +
     ≥1 equipment before "Generate Plan".
   - Profile: name/bio/height/weight/age fields; avatar file input; "Save".

5. **Live Tracker internals stay functional** — the `<video>` (react-webcam) and
   `<canvas ref>` overlay, the `requestAnimationFrame` detection loop, and the
   rep-counter/pose wiring must keep working. Redesign the surrounding layout,
   controls, readouts, and panels — not the detection plumbing.

6. **Theme tokens stay in sync** — if the palette changes, update BOTH
   `tailwind.config.ts` and `src/index.css` together. The wordmark stays
   "**TRAIN**ify" (two-tone).

7. **PDF export stays text-only** (jsPDF `doc.text`). Don't introduce HTML/SVG
   rendering (the build deliberately stubs `canvg`/`html2canvas`).

8. **Dark theme remains the baseline.** A light theme may be *added*, but dark is
   the identity.

9. **Verify after redesign:** `npm run build` and `npx tsc --noEmit` must pass,
   and all routes must still render and function (sign up, log in, calculate +
   save calories, generate + save a plan, open the live tracker).

---

## Part 7 — What "Professional Redesign" Should Deliver

Direction for the redesign (Gemini can expand these into the Claude Code prompt):

- **A refined color system.** Keep `#00FF7F` as the brand signal but use it
  sparingly (CTAs, key accents, live-form feedback). Introduce a tonal range and
  a supporting accent; add depth via layered surfaces, subtle gradients, and
  shadows rather than one flat grey.
- **A real type scale** — distinct display/heading/body steps, considered weights
  and line-heights; optionally a characterful display face for headings.
- **Depth & hierarchy** — elevation, card variety, clear focal points per screen;
  the dashboard should feel like a product, not a form dump.
- **Data visualization** — turn the stat tiles into proper KPI cards with real
  sparklines/mini-charts (recharts is available and stats data is real). Remove or
  make-real the decorative progress bars.
- **Motion & micro-interactions** — hover/press states, transitions, skeleton
  loaders, toast polish, smooth wizard step transitions.
- **First-class empty/loading/error states** — designed, on-brand, encouraging.
- **A standout Live Tracker** — the pose overlay is the app's signature feature;
  frame it like a premium camera UI with clear live readouts (reps, form, timer).
- **Polished auth + landing** — a real marketing landing page (hero, feature
  sections, footer) and elevated auth screens.
- **Consistent spacing/grid system** and responsive behavior on mobile.
- **Accessibility** — contrast, focus rings, semantic markup preserved.

Deliver it as a cohesive design system (tokens + restyled shadcn components +
redesigned pages), not a per-page reskin.

---

## Appendix — File Map (for reference)

```
src/
  App.tsx                       routes + provider stack
  pages/
    LandingPage.tsx  NotFound.tsx
    auth/LoginPage.tsx  auth/RegisterPage.tsx
    dashboard/Dashboard.tsx  WorkoutTutorials.tsx  LiveWorkoutTracker.tsx
              CustomWorkoutPlan.tsx  CaloriesCalculator.tsx  CustomDietPlan.tsx
              Profile.tsx
  components/
    layout/DashboardLayout.tsx  ProtectedRoute.tsx
    ui/                         shadcn/ui primitives (restyle, don't replace)
  contexts/AuthContext.tsx      (do not modify)
  hooks/                        (do not modify)
  services/                     (do not modify)
  lib/                          (do not modify pure logic; utils.cn is fine to use)
  types/database.types.ts       (do not modify)
  index.css                     theme tokens  ← edit for theme
tailwind.config.ts              fitness palette  ← edit for theme
```

Theme lives in `index.css` + `tailwind.config.ts`. Everything visual flows from
those two files plus the page/component markup.

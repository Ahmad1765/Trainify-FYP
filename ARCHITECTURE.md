# TRAINify — How This Program Works

A guide to the codebase, written for two audiences at once. **Part 1** is plain-English:
what the app is and what it does. **Part 2** is the technical map: how it's wired, where
every piece lives, and what to touch when you want to change something. **Part 3** is the
honest list of what's broken or fake, because that determines what "adding a feature"
actually costs you.

Last verified against the code on 2026-07-20.

---

# Part 1 — The Non-Technical Picture

## What is TRAINify?

A fitness web app that runs in a browser (and can be packaged as an Android app). A user
signs up, logs in, and gets a dashboard with six tools:

| Feature | What the user sees |
|---|---|
| **Workout Tutorials** | A searchable, filterable library of exercises with embedded YouTube videos |
| **Live Workout Tracker** | Turns on the webcam, draws a stick-figure skeleton over the user's body, turns it green when form looks right and red when it doesn't, and counts reps |
| **Custom Workout Plan** | A short questionnaire (goal, days per week, equipment, experience) that produces a weekly workout plan the user can edit and download as a PDF |
| **Calories Calculator** | Enter age/weight/height/activity level, get daily calorie targets; results can be saved and revisited |
| **Custom Diet Plan** | A questionnaire that produces a daily meal plan, downloadable as a PDF |
| **Profile** | Name, email, and workout statistics |

## The single most important thing to understand

**Almost nothing the user does is saved anywhere.**

Only two things persist:

1. **The user account itself** — email, password, and display name live in Firebase, a
   Google-hosted service. This is real and works.
2. **Saved calorie calculations** — stored in the browser's own local storage. They survive
   a page refresh, but they live on that one device in that one browser. Clear your browser
   data and they're gone. Log in on your phone and they aren't there.

Everything else — the workout plans, the diet plans, the profile statistics, the workout
history — is **fake data hardcoded into the source code**. When the "Custom Workout Plan"
questionnaire produces a plan, it isn't reading the user's answers and generating anything.
It shows the same pre-written sample plan every time, to every user. Refresh the page and
any edits are gone.

This isn't a bug so much as an unfinished state: the app is a fully-built, good-looking
*front end* with the *back end* never connected. The scaffolding for a backend exists in the
repo (`functions/`, `dataconnect/`, `firestore.rules`) but every file in it is either an
untouched Google template or entirely commented out.

**What this means for you:** the visual work is largely done. The work remaining is
persistence — deciding where user data lives and wiring every screen to it. Part 3 covers
this.

## The one feature that's genuinely real

The **Live Workout Tracker** is not a mockup. It downloads a real Google machine-learning
model (MoveNet) into the browser, reads the webcam, and computes the actual angles of the
user's joints ~30–60 times per second. The form feedback is real geometry, not a simulation.

It also runs entirely on the user's own machine — the video never leaves the browser and is
never uploaded. The privacy claim shown in the app's "How it Works" dialog is accurate.

Its rep *counting*, however, is crude. See Part 3.

---

# Part 2 — The Technical Map

## Stack

| Layer | Choice |
|---|---|
| Build tool | Vite 5 (dev server on port **8080**, set in `vite.config.ts`) |
| Framework | React 18 + TypeScript |
| Routing | React Router 6 (client-side, `BrowserRouter`) |
| Styling | Tailwind CSS + shadcn/ui (~50 prebuilt components in `src/components/ui/`) |
| Auth | Firebase Authentication (email/password + Google) |
| ML | TensorFlow.js + `@tensorflow-models/pose-detection` (MoveNet) |
| PDF | jsPDF |
| Mobile | Capacitor 7 (Android target, `android/`) |
| Server state | `@tanstack/react-query` — **installed and mounted, but never actually used**; there are no server calls to cache |

## Commands

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # → dist/
npm run lint
```

## Directory layout

```
src/
  main.tsx                    entry — mounts <App/> into #root
  App.tsx                     provider stack + every route (57 lines; read this first)
  lib/
    firebase.ts               Firebase init — the canonical copy
    empty-module.ts           stub aliased over jspdf's optional deps (see Build Notes)
    utils.ts                  cn() — Tailwind class merger used everywhere
  contexts/
    AuthContext.tsx           auth state + all auth actions
  components/
    ProtectedRoute.tsx        route guard (24 lines)
    layout/DashboardLayout.tsx  sidebar + nav shell for all logged-in pages
    ui/                       shadcn/ui primitives — generated code, don't hand-edit
  pages/
    LandingPage.tsx           public marketing page
    NotFound.tsx              404
    Index.tsx                 orphaned — not routed, dead file
    auth/LoginPage.tsx
    auth/RegisterPage.tsx
    dashboard/*.tsx           the six features

functions/       Firebase Cloud Functions — untouched Google template, nothing deployed
dataconnect/     Firebase Data Connect — schema is 100% commented-out movie-review example
android/         Capacitor Android shell
public/          static assets
```

## Startup sequence

```
index.html  →  src/main.tsx  →  <App/>
```

`App.tsx` wraps everything in four providers, outermost first:

```
QueryClientProvider      react-query (unused in practice)
  AuthProvider           ← the important one; gates the whole app
    TooltipProvider
      BrowserRouter
        Routes
```

## Authentication — how it actually flows

`src/contexts/AuthContext.tsx` is the heart of it.

**On app load** (`AuthContext.tsx:67`): registers Firebase's `onAuthStateChanged` listener.
Firebase checks for a stored session and fires the callback with either a user or `null`,
then `loading` flips to `false`.

**The gate** (`AuthContext.tsx:222`):

```tsx
<AuthContext.Provider value={value}>
  {!loading && children}
</AuthContext.Provider>
```

Nothing in the app renders until Firebase has answered. This is why there's no flash of
the login page for an already-signed-in user — but it also means a slow Firebase response
shows a blank screen, not a spinner.

**Route protection** (`ProtectedRoute.tsx`): reads `user` and `loading` from the context.
While loading → `<Loading/>`. No user → `<Navigate to="/login"/>`. Otherwise renders the page.

Verified behavior: all seven protected routes correctly bounce a signed-out visitor to
`/login`.

**The context exposes:** `user`, `loading`, `signUp`, `signIn`, `signInWithGoogle`,
`logout`, `resetPassword`, `updateUserProfile`.

> ⚠️ **`LoginPage` and `RegisterPage` do not use any of this.** Both files paste in their own
> copy of the Firebase config and call `initializeApp` themselves
> (`LoginPage.tsx:19-31`, `RegisterPage.tsx:23-33`), then call `signInWithEmailAndPassword`
> directly. The `AuthContext.signIn` / `signUp` functions are dead code. See Part 3.

## Route map (`App.tsx`)

| Path | Component | Guard |
|---|---|---|
| `/` | LandingPage | public |
| `/login` | LoginPage | public |
| `/register` | RegisterPage | public |
| `/dashboard` | Dashboard | protected |
| `/workouts` | WorkoutTutorials | protected |
| `/live-tracker` | LiveWorkoutTracker | protected |
| `/workout-plan` | CustomWorkoutPlan | protected |
| `/calories` | CaloriesCalculator | protected |
| `/diet-plan` | CustomDietPlan | protected |
| `/profile` | Profile | protected |
| `*` | NotFound | public |

The sidebar links live separately in `DashboardLayout.tsx:39` (`navItems`). **Adding a page
means editing both** — a route in `App.tsx` and an entry in `navItems`.

## The Live Workout Tracker (the real engine)

`src/pages/dashboard/LiveWorkoutTracker.tsx` — 1,470 lines, by far the most substantial
file. Worth understanding as three separate parts.

### 1. Exercise data (`:44-399`)

A `WORKOUTS` array of **24 exercises**, grouped by muscle. Each entry:

```ts
{
  id: 'push-ups',              // ← the key that drives form analysis
  name, description,
  instructions: [...],
  targetMuscles: [...],
  recommendedReps, level,
  videoUrl,                    // YouTube embed
}
```

### 2. Model loading (`:416-448`)

On mount: `tf.ready()`, then creates a MoveNet detector with
`SINGLEPOSE_LIGHTNING` — the fastest/smallest variant, single person, `enableSmoothing: true`.
Downloaded from Google's CDN at runtime, so **the first load of this page needs internet**.
Toasts on success and failure.

### 3. The detection loop (`:938-1000`)

A `requestAnimationFrame` loop that runs while the webcam is on and not paused:

```
detectPose()
  ├─ stop if paused (togglePause reschedules on resume)
  ├─ retry-next-frame if detector/webcam/canvas missing, or video.readyState !== 4
  ├─ size canvas to the video
  ├─ detector.estimatePoses(video)   →  17 keypoints w/ x, y, score
  ├─ getCorrections(id, kp)          →  Correction[] (the fault detector)
  ├─ assessForm(id, kp, corrections) →  true | false | null (the form verdict)
  ├─ on state change: play a tone, maybe increment reps
  ├─ drawSkeleton(...) + drawCorrections(...)
  └─ requestAnimationFrame(detectPose)   ← loop
```

### The form verdict — `assessForm` (`src/lib/formCorrection.ts`)

Returns `true` (good form), `false` (a real fault), or `null` (can't tell / not assessed).

The verdict is derived from **`getCorrections`**, the same fault detector that draws the
on-camera arrows — so the badge, the skeleton colour, the coaching text, and the arrows all
share one source of truth. It flags **position-independent faults** (hip sag, elbow flare,
knee cave, over-raising…), NOT whether the body is at peak contraction.

> Historical note: this replaced `analyzePose`, a per-exercise `switch` that returned "good
> form" only while the body was at the bottom/peak of a rep. Because that answer was tied to
> rep position, the badge flipped red during the top half of every otherwise-correct rep —
> the "red even with correct form" bug. `assessForm` fixes it at the root.

1. **Assessability gate**: if the exercise has no form rules (`ASSESSABLE` = the union of the
   `PRONE`/`ARM_TUCK`/`SQUAT`/`PRESS`/`RAISE` sets), return `null` so the badge hides rather
   than showing a hollow "good form".
2. **Visibility gate**: require at least `MIN_VISIBLE_JOINTS` confident keypoints, else `null`.
3. Otherwise, good form ⇔ `getCorrections(...)` returns no faults.

**Adding or tuning an exercise's form check** now means editing `getCorrections` in
`src/lib/formCorrection.ts` (and its calibrated thresholds), not a `switch` in the component.
Its checks are **view-aware** and scaled to shoulder-width / torso length, so they don't
depend on video resolution or how far the user stands from the camera.

### Rendering

`drawSkeleton` clears the canvas and draws 16 bone connections plus keypoint dots, filtering
to keypoints with `score > 0.4`. Colors: green `#1FDD80` good, red `#F0616D` bad, white
undetermined. The canvas is overlaid on the `<Webcam>` element.

**Keypoint smoothing (`src/lib/poseSmoothing.ts`).** MoveNet's raw keypoints jitter a few
pixels per frame even when the subject is still, which makes the overlay shimmer. Each frame's
keypoints are passed through a `KeypointSmoother` (a speed-adaptive **One-Euro** filter, one
per joint per axis) before they drive both the drawing and the geometry. It filters hard when
a joint is still (jitter gone) and opens up when it moves fast (no lag behind a rep); at a
steady position it converges to the true value, so calibrated form/rep thresholds are
unaffected. The smoother is reset on start / reset / exercise switch so it never lerps from a
stale position. Low-confidence keypoints reset their filter and pass through untouched.

### Audio (`:458-487`)

No sound files. Generates tones with the Web Audio API — an 800Hz beep for success, 300Hz
for error. Cheap and dependency-free.

### Rep counting (`:975-988`)

```ts
if (formStatus !== null && formStatus !== isGoodForm) {
  setIsGoodForm(formStatus);
  if (formStatus) {
    playSound('success');
    if (isGoodForm === false) setRepCount(prev => prev + 1);
  } else { playSound('error'); }
}
```

A rep is counted on **any bad→good transition**. There's no notion of a movement cycle
(down-then-up), no debounce, no minimum duration. The code's own comment concedes this:
`// (in a real app, you would detect actual reps)`. Jitter at the threshold boundary inflates
the count. Fixing this properly means tracking a per-exercise state machine
(`up`/`down` phase) rather than a boolean.

## Calories Calculator — the only real computation outside the tracker

`CaloriesCalculator.tsx:80` implements **Mifflin-St Jeor**, a standard clinical formula:

```
male:    BMR = 10×weight(kg) + 6.25×height(cm) − 5×age + 5
female:  BMR = 10×weight(kg) + 6.25×height(cm) − 5×age − 161

TDEE = BMR × activity multiplier
  sedentary 1.2 | light 1.375 | moderate 1.55 | active 1.725 | veryActive 1.9

target = TDEE − 500 (lose) | TDEE (maintain) | TDEE + 500 (gain)
```

This is correct and standard. Results persist to `localStorage` under the keys
`calorie_saved` and `calorie_history` (`:43-56`) — the app's **only** client persistence.

## PDF generation

`CustomWorkoutPlan.tsx:139` and `CustomDietPlan.tsx:328` both `new jsPDF()` and build the
document with text calls. Text only — no images, no HTML rendering. This matters for the
build config (below).

## Styling

Tailwind with a custom palette in `tailwind.config.ts`:

```
fitness-green       #00FF7F   accent / primary
fitness-black       #000000
fitness-background  #121212   page background
fitness-card-bg     #1E1E1E   cards
fitness-dark-gray   #333333   borders
fitness-gray        #B0B0B0   muted text
fitness-success     #4CAF50
fitness-error       #F44336
```

Used as `bg-fitness-card-bg`, `text-fitness-green`, etc. Change the palette here and it
propagates app-wide. The design is dark-mode-only; there is no light theme.

`src/components/ui/` is generated shadcn/ui code. Restyle via the Tailwind config or by
wrapping components — hand-edits there get clobbered if anyone regenerates.

## Build notes — the `canvg` alias

`jspdf` contains `import("canvg")` for rendering SVG into PDFs. That package isn't
installed, and Vite's bundler treats the unresolved import as fatal — it crashed the dev
server and made **every** page return a 500.

Since both PDF call sites emit text only, those renderers are never invoked at runtime. The
fix aliases them to a no-op stub rather than installing ~1MB of unused dependencies:

```ts
// vite.config.ts
resolve: { alias: {
  canvg:       path.resolve(__dirname, "./src/lib/empty-module.ts"),
  html2canvas: path.resolve(__dirname, "./src/lib/empty-module.ts"),
  dompurify:   path.resolve(__dirname, "./src/lib/empty-module.ts"),
}}
```

**If you ever add image or HTML rendering to a PDF** (`doc.html()`, `addSvgAsImage`), remove
the relevant alias and `npm install` the real package — otherwise it'll fail silently
against the stub.

## Mobile (Capacitor)

`capacitor.config.ts` — appId `com.trainify.app`, serves from `dist/`. `AuthContext` has
native-platform branches that mirror the user into Capacitor `Preferences` on
sign-up/logout. **Google sign-in on native explicitly throws
`'Google Sign-In not implemented for native platforms yet'` (`AuthContext.tsx:155`).** The
config also reads `process.env.VITE_*` client IDs, which won't be defined at build time
without extra setup.

---

# Part 3 — What's Broken, Fake, or Missing

Ordered roughly by how much they'll bite you.

### 1. No backend persistence — the defining gap

Only Firebase Auth (accounts) and one `localStorage` key set (calories) are real. Workout
plans, diet plans, profile stats, and workout history are hardcoded arrays that reset on
refresh.

The scaffolding is all inert:
- `functions/src/index.ts` — every function commented out
- `functions/src/genkit-sample.ts` — untouched Vertex AI template
- `dataconnect/schema/schema.gql` — 100% commented-out movie-review example
- `firestore.rules` — **deny-all**: `allow read, write: if false`

To make anything persist you'd enable Firestore, replace those rules with per-user rules
keyed on `request.auth.uid`, and write read/write calls in each page. This is the single
largest piece of remaining work.

### 2. Login and Register bypass `AuthContext`

`LoginPage.tsx` and `RegisterPage.tsx` each re-declare the Firebase config and call
`initializeApp` themselves. Consequences:

- Three copies of the config exist (`lib/firebase.ts`, `LoginPage`, `RegisterPage`) — change
  Firebase projects and you must edit all three or get confusing partial failures.
- `AuthContext`'s `signIn`/`signUp` and its friendly error mapper are **dead code**. That's
  why a failed login shows the raw string `Firebase: Error (auth/invalid-credential)` instead
  of a human message.

Fix: delete the local Firebase setup from both pages, import `useAuth()`, call
`signIn`/`signUp`. Low risk, high payoff.

### 3. Sidebar reads the wrong user fields

`DashboardLayout.tsx:105` and `:117` read `user?.profilePicture` and `user?.name`. A Firebase
`User` has **`photoURL`** and **`displayName`**. Those properties are always `undefined`, so
the sidebar permanently shows the placeholder avatar and the name "User" — even for a
signed-in user with a display name set. One-line fix each.

### 4. `getAuthErrorMessage` has a login-time wording bug

`AuthContext.tsx:46` — the `default` branch returns *"An error occurred during registration."*
but the same mapper is used by `signIn`, `logout`, `resetPassword`, and
`updateUserProfile`. Wrong wording in four flows. It also has no case for
`auth/invalid-credential` or `auth/user-not-found`, so ordinary wrong-password attempts land
on that default.

### 5. Rep counting is not real rep detection

Covered above. Counts bad→good transitions with no cycle tracking or debounce.

### 6. Pixel thresholds don't scale

Distance rules in `analyzePose` use raw pixel constants, so behavior changes with camera
resolution and user distance. Normalize against a body-size reference (e.g. shoulder width)
if you want this robust.

### 7. `Index.tsx` is orphaned

`src/pages/Index.tsx` is never imported or routed. Dead file.

### 8. Single 3.5MB JS bundle

`npm run build` emits one `index-*.js` of ~3.5MB (~720KB gzipped) — TensorFlow.js and
Firebase dominate. Vite warns about it. The natural fix is route-level code splitting via
`React.lazy`, so only visitors to `/live-tracker` pay for TensorFlow.

### 9. `.env` is duplicated and ignored

`.env` defines `VITE_FIREBASE_*`, but no code reads them — the config is hardcoded in three
places instead. Editing `.env` does nothing. `.env` is also not gitignored. (Firebase web API
keys are not secrets — they're safe in client code by design — so this is a tidiness and
confusion problem, not an exposure one. The `VITE_*_CLIENT_ID` values are likewise public
OAuth client IDs.)

### 10. No tests

No test runner, no test files. The CI workflow (`.github/workflows/main.yml`) has its test
step hard-disabled with `if: false`. It only installs and builds.

### 11. Not a git repository

There's no version control in this directory. Nothing is recoverable if you delete or
overwrite it. **Run `git init` and make a baseline commit before any significant change.**

---

# Part 4 — Recipes for Common Changes

**Add a page.** Create `src/pages/dashboard/Foo.tsx`, wrap its body in `<DashboardLayout>`,
add a `<Route>` in `App.tsx` inside `<ProtectedRoute>`, add an entry to `navItems` in
`DashboardLayout.tsx:39`.

**Add a tracked exercise.** Add an object to `WORKOUTS` (`LiveWorkoutTracker.tsx:44`), then
add a matching `case '<your-id>':` in the `analyzePose` switch (`:581`). Prefer joint-angle
rules over pixel distances.

**Tune form strictness.** Edit the numeric thresholds inside the relevant `case`. Looser
angle ranges = more forgiving.

**Rebrand colors.** `tailwind.config.ts` → the `fitness` palette. Nothing else needs touching.

**Make something persist.** Enable Firestore in the Firebase console, rewrite
`firestore.rules` to allow a user access to their own documents only, export a
`getFirestore(app)` from `src/lib/firebase.ts`, then read/write in the page. Start with
`CustomWorkoutPlan` — it has the clearest shape (one plan document per user).

**Change Firebase project.** Update the config in **all three** places until issue #2 is
fixed: `src/lib/firebase.ts`, `LoginPage.tsx:19`, `RegisterPage.tsx:23`.

**Build for Android.** `npm run build` then `npx cap sync android`, open `android/` in
Android Studio. Expect Google sign-in to fail until the native implementation in
`AuthContext.tsx:151-158` is written.

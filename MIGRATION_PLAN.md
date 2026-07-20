# TRAINify — Supabase Migration & Redesign Plan

Status: **awaiting approval + Supabase keys.** No application code has been changed yet.
Research verified against Supabase docs and changelog on 2026-07-20.

---

# Part A — Research Summary

## A.1 Three findings that change the design

### 🔴 1. New tables are NOT reachable by the API by default (changelog, 2026-04-28)

> *"New tables in the public schema will no longer be exposed to the Data API automatically."*

This is the single most important finding. Historically `create table` + `enable row level
security` + policies was enough. It no longer is. Without explicit grants the API returns
Postgres error **`42501`** *before any policy is evaluated* — so the failure looks like a
broken policy and sends you debugging the wrong layer.

Every table in our migration therefore needs **two** gates:

```sql
-- Gate 1: GRANT — can this role reach the table at all?
grant select, insert, update, delete on table public.workout_plans to authenticated;

-- Gate 2: RLS — which rows can it see once it's through?
alter table public.workout_plans enable row level security;
```

Much of the Supabase tutorial content online predates this change. I've written every
migration below with explicit grants.

### 🔴 2. `user_metadata` is user-editable — never authorize on it

Supabase's `raw_user_meta_data` can be modified by the user themselves and surfaces in
`auth.jwt()`. It is **unsafe for any authorization decision**.

Consequence for our brief: your spec suggested reading the sidebar name from
`user?.user_metadata?.display_name`. That's *safe for display* but I'm making the
`profiles` table the **source of truth** for names and avatars, with `user_metadata` used
only as the initial seed at signup. This keeps one consistent read path and avoids the
habit of treating metadata as trustworthy.

### 🟡 3. API key naming has moved to `sb_publishable_...`

Newer projects issue **publishable** keys rather than legacy `anon` keys. They're
functionally equivalent for our purposes and both are safe in client code (RLS is what
protects data). I'll keep the env var named `VITE_SUPABASE_ANON_KEY` per your spec — the
value just may start with `sb_publishable_`.

**Never** put the `service_role` / secret key in any `VITE_*` variable. Vite inlines those
into the browser bundle, and that key bypasses RLS entirely.

## A.2 Other verified constraints

| Area | Finding | Impact |
|---|---|---|
| **UPDATE policies** | An UPDATE must first SELECT the row. Without a SELECT policy, updates silently affect 0 rows — no error. | Every table gets a SELECT policy. |
| **UPDATE needs `WITH CHECK`** | `USING` alone lets a user reassign a row's `user_id` to someone else. | All UPDATE policies get both `USING` and `WITH CHECK`. |
| **`auth.role()` is deprecated** | Breaks silently if anonymous sign-ins are enabled. | Use `TO authenticated` + an ownership predicate. |
| **`TO authenticated` alone is not authorization** | It checks the role, not the row (BOLA/IDOR). | Always paired with `(select auth.uid()) = user_id`. |
| **Storage upsert** | Replacing a file needs INSERT **+ SELECT + UPDATE**. INSERT alone fails silently. | Avatar bucket gets all three. |
| **Views bypass RLS** | Need `security_invoker = true` on PG15+. | Workout stats will be a **function or client-side aggregate**, not a view — simpler and avoids the trap. |
| **Google native auth** | Native uses `signInWithIdToken`, not the `signInWithOAuth` redirect. Needs separate Web + Android client IDs, Web ID registered first, and SHA-1 fingerprints. | Phase 5; see A.3. |

## A.3 Google sign-in: two genuinely different flows

**Web (SPA):** `supabase.auth.signInWithOAuth({ provider: 'google' })` → redirect to Google
→ back to the app with a session. Setup is dashboard-only; no client IDs in our code.

**Capacitor native:** the redirect flow is a poor fit inside a WebView. The documented path
is a native Google plugin that returns an **ID token**, which we hand to Supabase:

```ts
await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: rawNonce })
```

This requires a Google Cloud **Android** OAuth client with your app's SHA-1 fingerprint —
which I cannot generate for you, since it comes from your signing keystore. Phase 5 is
therefore documented-and-scaffolded, with the exact steps for you to complete. I'll be
explicit rather than leaving a half-working stub like the current
`'Google Sign-In not implemented for native platforms yet'`.

---

# Part B — Database Schema

Five tables. `exercises` is deliberately **excluded** — see B.6.

## B.1 `profiles` — extends `auth.users`

```sql
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  avatar_url    text,
  fitness_goal  text check (fitness_goal in ('lose','maintain','gain','build-muscle','endurance')),
  date_of_birth date,
  height_cm     numeric(5,2) check (height_cm > 0 and height_cm < 300),
  weight_kg     numeric(5,2) check (weight_kg > 0 and weight_kg < 700),
  gender        text check (gender in ('male','female','other')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

Auto-created on signup by a trigger, so the app never has to handle "profile missing":

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

`security definer` is correct and necessary here (it must write to a table the new user
can't yet touch). It's safe because it takes no user-controlled arguments — it only reads
the `new` row — and `search_path = ''` blocks search-path hijacking.

## B.2 `workout_plans`

```sql
create table public.workout_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  name          text not null,
  goal          text,
  days_per_week int  check (days_per_week between 1 and 7),
  time_per_session_min int,
  experience_level text,
  equipment     text[] not null default '{}',
  schedule      jsonb not null default '[]'::jsonb,  -- [{day, exercises:[{name,sets,reps,rest}]}]
  is_active     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.workout_plans (user_id, created_at desc);
```

`schedule` stays **JSONB** rather than normalized child tables. The UI already treats a plan
as one editable document and saves it whole; JSONB matches that access pattern exactly and
avoids a 3-table join for every render. We can normalize later if per-exercise analytics
are ever needed.

## B.3 `diet_plans`

```sql
create table public.diet_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  purpose      text,
  calorie_goal int,
  restrictions text[] not null default '{}',
  daily_meals  jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.diet_plans (user_id, created_at desc);
```

## B.4 `calorie_entries`

```sql
create table public.calorie_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  age            int     not null check (age  between 1 and 120),
  gender         text    not null,
  weight_kg      numeric(5,2) not null,
  height_cm      numeric(5,2) not null,
  activity_level text    not null,
  goal           text    not null,
  bmr            int     not null,
  tdee           int     not null,
  target         int     not null,
  created_at     timestamptz not null default now()
);
create index on public.calorie_entries (user_id, created_at desc);
```

Immutable log — no `updated_at`, no UPDATE policy. A recalculation is a new row.

## B.5 `workout_sessions`

```sql
create table public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  exercise_id  text not null,   -- matches WORKOUTS[].id in the tracker
  exercise_name text not null,  -- denormalized so history survives renames
  reps         int  not null default 0 check (reps >= 0),
  duration_sec int  not null default 0 check (duration_sec >= 0),
  good_form_pct numeric(5,2) check (good_form_pct between 0 and 100),
  notes        text,
  created_at   timestamptz not null default now()
);
create index on public.workout_sessions (user_id, created_at desc);
```

Profile statistics (total workouts, total reps, streaks) are aggregated from this table.

## B.6 Why `exercises` stays in code

Your brief marks this low priority and offers the choice. **Recommendation: keep the 24
exercises hardcoded.**

The tracker's form analysis is a `switch` on `selectedWorkout.id` with hand-written geometry
per exercise. An exercise row in the database without a matching `case` in that switch
produces an exercise that *looks* selectable but silently returns `null` — a white skeleton
and no feedback. Moving the list to the DB creates a way to add exercises that can never
work, while the thing that actually blocks new exercises (the geometry code) stays in the
codebase regardless. It adds a failure mode and buys nothing.

## B.7 Grants, RLS, and the `updated_at` trigger

Applied uniformly to all five tables:

```sql
-- Gate 1: reachability (required since 2026-04-28)
grant select, insert, update, delete on table public.<t> to authenticated;
-- NOTE: no grants to `anon` — every table here is private user data.

-- Gate 2: row visibility
alter table public.<t> enable row level security;

create policy "own rows: select" on public.<t>
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "own rows: insert" on public.<t>
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "own rows: update" on public.<t>
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);   -- blocks reassigning user_id

create policy "own rows: delete" on public.<t>
  for delete to authenticated using ((select auth.uid()) = user_id);
```

`(select auth.uid())` is wrapped in a subquery deliberately — Postgres caches it per
statement instead of re-evaluating per row, which matters on the history tables.

For `profiles` the predicate is `id` rather than `user_id`, and there is no INSERT policy
(the trigger owns creation) and no DELETE policy (cascades from `auth.users`).

`updated_at` is maintained by a shared trigger function rather than trusted from the client.

## B.8 Storage — avatars

```sql
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
```

Public-read bucket, writes restricted to the owning user's folder (`<uid>/filename`).
Per the upsert rule, the owner gets **INSERT + SELECT + UPDATE + DELETE** so replacing an
avatar doesn't fail silently.

---

# Part C — Application Architecture

## C.1 Target structure

```
src/
  services/
    supabase.ts            createClient, env validation (fail fast + loud)
    auth.service.ts        signUp/signIn/OAuth/reset/updateProfile
    profiles.service.ts    get/update profile, avatar upload
    workoutPlans.service.ts    CRUD
    dietPlans.service.ts       CRUD
    calories.service.ts        list/create/delete
    workoutSessions.service.ts create + stats aggregation
  types/
    database.types.ts      generated from the live schema (supabase gen types)
  contexts/
    AuthContext.tsx        session only — thin
  hooks/
    useProfile.ts, useWorkoutPlans.ts, useDietPlans.ts,
    useCalorieEntries.ts, useWorkoutSessions.ts   (react-query wrappers)
  lib/
    repCounter.ts          NEW — rep state machine (pure, testable)
    poseGeometry.ts        NEW — angles + shoulder-width normalization
    calories.ts            NEW — BMR/TDEE extracted from the page (pure, testable)
    pdf.ts                 shared jsPDF helpers
    utils.ts, empty-module.ts
  pages/                   unchanged routes, refactored internals
```

**Layering rule:** pages → hooks → services → supabase client. Pages never import the
Supabase client directly. This is what makes the "Login page re-initializes Firebase" class
of bug structurally impossible to repeat.

`@tanstack/react-query` is already installed and mounted but unused — the hooks layer
finally gives it a job (caching, loading/error states, invalidation after mutations).

## C.2 AuthContext rewrite

```ts
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
  const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
  return () => sub.subscription.unsubscribe()
}, [])
```

Two changes from the Firebase version worth calling out:

1. **`getSession()` first, then subscribe.** Firebase's `onAuthStateChanged` fires
   immediately with the current state; Supabase's `onAuthStateChange` does not reliably do
   so on first load. Subscribing alone would leave `loading` stuck `true` forever.
2. **Replace `{!loading && children}` with a real loading screen.** Today a slow auth
   response renders a blank white page. Same gate, visible feedback.

Error mapping gets a shared helper covering `invalid_credentials`, `email_not_confirmed`,
`user_already_exists`, `weak_password`, `over_email_send_rate_limit`, with a *generic*
fallback — fixing the current bug where every failure says "during registration".

## C.3 Rep counting — state machine

Replacing the bad→good transition counter. Each exercise declares a **signal** and two
thresholds with hysteresis:

```ts
type RepSpec = {
  signal: (kp: Keypoints) => number | null;  // e.g. elbow angle
  downBelow: number;   // enter DOWN phase
  upAbove: number;     // enter UP phase
  minPhaseMs?: number; // debounce
};
```

State: `UNKNOWN → UP → DOWN → UP` — **a rep is counted on DOWN→UP only**, and only if the
phase lasted `minPhaseMs`. The gap between `downBelow` and `upAbove` is the hysteresis band
that kills the jitter-inflation the current code suffers from.

Push-ups: `signal = elbow angle`, `downBelow: 95`, `upAbove: 150`.
Squats: `signal = knee angle`, `downBelow: 100`, `upAbove: 160`.
Plank (isometric): no reps — tracks *duration* under good form instead.

Pure module, no React, no canvas → **directly unit-testable** by feeding a synthetic angle
sequence and asserting the count.

## C.4 Relative measurements

Every raw-pixel threshold (`< 40`, `> 150`) becomes a multiple of **shoulder width**
(distance between the shoulder keypoints), which scales naturally with resolution and user
distance:

```ts
const unit = distance(leftShoulder, rightShoulder);   // ~1 shoulder width
legsApart = distance(leftAnkle, rightAnkle) > 1.4 * unit;   // was: > 150px
```

## C.5 Code splitting

`React.lazy` per route + a `<Suspense>` boundary. `/live-tracker` carries TensorFlow.js
(the bulk of the 3.5MB bundle), so users who never open it stop paying for it. Expected
initial bundle: **~3.5MB → well under 1MB**, with TF.js in a chunk fetched on demand.

## C.6 Tests (Vitest)

Pure logic only — no DOM/network, fast and stable:

- `calories.test.ts` — BMR/TDEE against hand-computed Mifflin-St Jeor values, both genders, all five activity multipliers, ±500 goal offsets.
- `repCounter.test.ts` — synthetic angle sequences: clean reps, jitter at the threshold (must **not** count), partial reps, sub-`minPhaseMs` bounces.
- `poseGeometry.test.ts` — angle math incl. degenerate zero-length vectors; shoulder-width scaling invariance.
- `authErrors.test.ts` — error code → message mapping.

CI (`.github/workflows/main.yml`) currently has its test step disabled with `if: false`.
That gets removed and `npm run test` wired in.

---

# Part D — Phased Execution

Each phase ends with a **running, verified app** and its own commit + push.

| Phase | Scope | Verification | Blocked on |
|---|---|---|---|
| **0 ✅** | git init, `.gitignore` hardening, baseline pushed | done | — |
| **1** | Schema + RLS applied; `@supabase/supabase-js` installed; services + AuthContext; Login/Register use `useAuth()`; sidebar fields fixed; Firebase **fully removed**; `.env` wired | Sign up, log in, log out, reset password, Google web OAuth, route guards — driven in a real browser. RLS verified by attempting cross-user reads. | **your keys** |
| **2** | Persistence: workout plans, diet plans, calorie entries, profile + avatar upload. Real generation from questionnaire answers. | Create → refresh → data survives. Second account cannot see the first's rows. | Phase 1 |
| **3** | Rep-counter state machine, relative thresholds, session saving, profile stats | Unit tests + manual webcam check on push-ups/squats | Phase 2 |
| **4** | `React.lazy` splitting, Vitest suite, CI enabled, delete `Index.tsx`, docs rewrite | Bundle size measured before/after; `npm run test` green in CI | Phase 3 |
| **5** | Capacitor: session persistence + native Google via `signInWithIdToken` | Android build; you supply SHA-1 | Phase 4 + your keystore |

**Rollback:** every phase is a commit on `main`. `git revert <sha>` undoes any phase cleanly.

---

# Part E — What I Need From You

**To start Phase 1:**

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Send me **Project URL** and the **anon / publishable** key
   (Project Settings → API). Both are safe to share — they're public client credentials
   protected by RLS. **Do not send the `service_role` key.**
3. Enable **Email** auth (Authentication → Providers). For local testing, turning *off*
   "Confirm email" avoids inbox round-trips; turn it back on before release.
4. For Google web OAuth: create a Web OAuth client in Google Cloud Console, paste the
   callback URL from Supabase's Google provider page into "Authorized redirect URIs", then
   put the client ID + secret into Supabase. *(Optional — email/password works without it,
   and I can defer this to the end of Phase 1.)*

I'll apply the schema via SQL migrations checked into `supabase/migrations/`, so it's
reproducible and reviewable rather than clicked into a dashboard.

**Two decisions I've made on your behalf** (say the word and I'll flip either):

- **`exercises` table dropped from scope** — reasoning in B.6.
- **localStorage for calories dropped, not kept as a fallback.** Your spec left this open.
  Keeping both means two sources of truth that silently diverge across devices. The DB
  becomes the single source; I'll do a one-time import of any existing localStorage entries
  on first load after login, then clear the key, so nothing you've saved is lost.

---

# Appendix — Local Setup (for the README)

```bash
git clone https://github.com/Ahmad1765/Trainify-FYP.git
cd Trainify-FYP
npm install
cp .env.example .env      # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:8080
```

`src/services/supabase.ts` will throw a clear, named error at startup if either variable is
missing — far better than the undefined-URL fetch failures you'd otherwise chase.
